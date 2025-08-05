/* eslint-disable no-console */
import { Plugin, PluginConfig, OrcdkConfig, EnvironmentConfig, EventBus, OrcdkEvent, EventTypes } from '@orcdkestrator/core';
import * as fs from 'fs';
import * as path from 'path';
import { prompt } from 'enquirer';
import { glob } from 'glob';

// Read version from package.json
const packageJsonPath = path.join(__dirname, '../..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

interface EnvironmentScannerConfig {
  scanPaths?: string[];
  filePatterns?: string[];
  excludePatterns?: string[];
  autoPrompt?: boolean;
}

interface EnvironmentChanges {
  found: string[];
  configured: string[];
  added: string[];
  removed: string[];
}

/**
 * Environment Scanner plugin for orcdkestrator
 * Automatically discovers environments from various sources
 */
export class EnvironmentScannerPlugin implements Plugin {
  public readonly name = '@orcdkestrator/environment-scanner';
  public readonly version = packageJson.version;
  
  private eventBus!: EventBus;
  private config: EnvironmentScannerConfig = {};
  private orcdkConfig: OrcdkConfig | null = null;
  private projectRoot: string = process.cwd();
  
  async initialize(config: PluginConfig, orcdkConfig: OrcdkConfig): Promise<void> {
    this.config = config.config as EnvironmentScannerConfig || {};
    this.orcdkConfig = orcdkConfig;
    this.eventBus = EventBus.getInstance();
    
    // Set defaults
    this.config.scanPaths = this.config.scanPaths || ['.', 'cdk'];
    this.config.filePatterns = this.config.filePatterns || [
      '**/.env*',
      '**/cdk.json',
      '**/package.json',
      '**/bin/*.ts',
      '**/bin/*.js'
    ];
    this.config.excludePatterns = this.config.excludePatterns || [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.git/**'
    ];
    
    // Subscribe to events
    this.eventBus.on(EventTypes['cli:command:starting'], (event: unknown) => this.handleCommandStart(event as OrcdkEvent<{ command: string; environment?: string }>));
    this.eventBus.on(EventTypes['orchestrator:before:initialization'], (event: unknown) => this.handleBeforeInit(event as OrcdkEvent<{ command: string }>));
  }
  
  private async handleCommandStart(event: OrcdkEvent<{ command: string; environment?: string }>): Promise<void> {
    const { command, environment } = event.data;
    
    // Only scan for specific commands
    if (!['init', 'deploy', 'plan'].includes(command)) {
      return;
    }
    
    const environments = await this.scanEnvironments();
    
    // For deploy/plan, validate the environment exists
    if ((command === 'deploy' || command === 'plan') && environment) {
      if (!environments.includes(environment)) {
        throw new Error(
          `Environment "${environment}" not found. Available environments: ${environments.join(', ')}`
        );
      }
    }
    
    // For init, we'll handle environment setup in handleBeforeInit
  }
  
  private async handleBeforeInit(event: OrcdkEvent<{ command: string }>): Promise<void> {
    const environments = await this.scanEnvironments();
    const configured = Object.keys(this.orcdkConfig?.environments || {});
    
    // Detect changes
    const added = environments.filter(env => !configured.includes(env));
    const removed = configured.filter(env => !environments.includes(env));
    
    if (added.length > 0 || removed.length > 0) {
      this.eventBus.emitEvent('environment:changes:detected', {
        found: environments,
        configured,
        added,
        removed
      } as EnvironmentChanges, this.name);
      
      // If auto-prompt is enabled and we're in init
      if (this.config.autoPrompt !== false && event.data.command === 'init') {
        await this.updateConfiguration(environments);
      }
    }
  }
  
  async scanEnvironments(): Promise<string[]> {
    const environments = new Set<string>();
    
    // 1. Scan environment variables
    if (process.env.CDK_ENVIRONMENT) {
      environments.add(process.env.CDK_ENVIRONMENT);
    }
    
    // 2. Scan .env files
    await this.scanEnvFiles(environments);
    
    // 3. Scan CDK code
    await this.scanCDKCode(environments);
    
    // 4. Scan package.json scripts
    await this.scanPackageJson(environments);
    
    return Array.from(environments).sort();
  }
  
  private async scanEnvFiles(environments: Set<string>): Promise<void> {
    for (const scanPath of this.config.scanPaths!) {
      const pattern = path.join(this.projectRoot, scanPath, '.env*');
      const files = await glob(pattern, {
        ignore: this.config.excludePatterns
      });
      
      for (const file of files) {
        const basename = path.basename(file);
        const match = basename.match(/\.env\.(.+)$/);
        if (match && match[1]) {
          environments.add(match[1]);
        }
      }
    }
  }
  
  private async scanCDKCode(environments: Set<string>): Promise<void> {
    const patterns = [
      '**/bin/*.ts',
      '**/bin/*.js',
      '**/lib/*-stack.ts',
      '**/lib/*-stack.js'
    ];
    
    for (const pattern of patterns) {
      const files = await glob(path.join(this.projectRoot, pattern), {
        ignore: this.config.excludePatterns
      });
      
      for (const file of files) {
        try {
          const content = await fs.promises.readFile(file, 'utf-8');
          
          // Look for stack names with environment suffixes
          const stackMatches = content.matchAll(/['"][\w-]+-(\w+)['"]/g);
          for (const match of stackMatches) {
            if (match[1]) {
              const potential = match[1].toLowerCase();
              if (this.isLikelyEnvironment(potential)) {
                environments.add(potential);
              }
            }
          }
          
          // Look for environment references in code
          const envMatches = content.matchAll(/environment['"]\s*[:=]\s*['"](\w+)['"]/gi);
          for (const match of envMatches) {
            if (match[1]) {
              environments.add(match[1].toLowerCase());
            }
          }
        } catch (error) {
          // Skip files we can't read
        }
      }
    }
  }
  
  private async scanPackageJson(environments: Set<string>): Promise<void> {
    for (const scanPath of this.config.scanPaths!) {
      const pkgPath = path.join(this.projectRoot, scanPath, 'package.json');
      
      try {
        const content = await fs.promises.readFile(pkgPath, 'utf-8');
        const pkg = JSON.parse(content);
        
        if (pkg.scripts) {
          for (const script of Object.keys(pkg.scripts)) {
            // Look for deploy:env or env:deploy patterns
            const match = script.match(/(?:deploy:|:deploy|env:)(\w+)/);
            if (match && match[1] && this.isLikelyEnvironment(match[1])) {
              environments.add(match[1]);
            }
          }
        }
      } catch (error) {
        // Skip if file doesn't exist
      }
    }
  }
  
  private isLikelyEnvironment(name: string): boolean {
    const commonEnvs = [
      'local', 'localhost', 'dev', 'development',
      'test', 'testing', 'qa', 'stage', 'staging',
      'prod', 'production', 'demo', 'sandbox'
    ];
    
    return commonEnvs.includes(name.toLowerCase());
  }
  
  async promptForEnvironments(): Promise<string[]> {
    const found = await this.scanEnvironments();
    
    if (found.length > 0) {
      return found;
    }
    
    // First ask if they want to use common names
    const { useCommon } = await prompt<{ useCommon: boolean }>({
      type: 'confirm',
      name: 'useCommon',
      message: 'Would you like to use common environment names (local, development, staging, production)?',
      initial: true
    });
    
    if (useCommon) {
      return ['local', 'development', 'staging', 'production'];
    }
    
    // Otherwise prompt for custom names
    const { environments } = await prompt<{ environments: string }>({
      type: 'input',
      name: 'environments',
      message: 'No environments found. Please enter environment names (comma-separated):',
      initial: 'local, development, staging, production'
    });
    
    return environments
      .split(',')
      .map((env: string) => env.trim())
      .filter((env: string) => env.length > 0);
  }
  
  async updateConfiguration(environments: string[]): Promise<void> {
    if (!this.orcdkConfig) {
      throw new Error('Configuration not initialized');
    }
    
    // Generate config for new environments
    const envConfigs: Record<string, EnvironmentConfig> = {};
    
    for (const env of environments) {
      if (!this.orcdkConfig.environments[env]) {
        envConfigs[env] = this.generateEnvironmentConfig(env);
      }
    }
    
    // Emit event for config update
    this.eventBus.emitEvent('config:environments:update', {
      environments: envConfigs
    }, this.name);
  }
  
  generateEnvironmentConfig(name: string): EnvironmentConfig {
    const isLocal = name === 'local' || name === 'localhost';
    const displayName = name.charAt(0).toUpperCase() + name.slice(1);
    
    return {
      displayName,
      description: `${displayName} environment`,
      isLocal,
      region: isLocal ? 'us-east-1' : this.getDefaultRegion(name)
    };
  }
  
  private getDefaultRegion(environment: string): string {
    // Map common environments to typical regions
    const regionMap: Record<string, string> = {
      development: 'us-west-2',
      staging: 'us-east-2',
      production: 'us-east-1'
    };
    
    return regionMap[environment] || 'us-east-1';
  }
  
  async cleanup(): Promise<void> {
    // Remove only this plugin's listeners
    this.eventBus.removeAllListeners(EventTypes['cli:command:starting']);
    this.eventBus.removeAllListeners(EventTypes['orchestrator:before:initialization']);
  }
}

// Export as default for easy importing
export default EnvironmentScannerPlugin;