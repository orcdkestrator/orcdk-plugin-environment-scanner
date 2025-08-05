# Environment Scanner Plugin API Reference

## Plugin Configuration

```typescript
interface EnvironmentScannerConfig {
  enabled: boolean;
  scanPaths?: string[];
  outputFile?: string;
  includeOptional?: boolean;
  excludePatterns?: string[];
}
```

## Lifecycle Hooks

### `beforePatternDetection`
Scans CDK code for environment variable dependencies before pattern detection.

### `afterPatternDetection`
Generates a report of found environment variables.

## Methods

### `initialize(config: PluginConfig, orcdkConfig: OrcdkConfig): Promise<void>`
Initializes the plugin with configuration.

### `scan(): Promise<EnvironmentDependencies>`
Scans the specified paths for environment variable usage.

### `generateReport(dependencies: EnvironmentDependencies): void`
Writes the scan results to the output file.

### `isEnvironmentVariable(node: ts.Node): boolean`
Detects if a TypeScript AST node represents environment variable access.

## Types

```typescript
interface EnvironmentDependencies {
  required: EnvironmentVariable[];
  optional: EnvironmentVariable[];
  byStack: Record<string, EnvironmentVariable[]>;
}

interface EnvironmentVariable {
  name: string;
  locations: FileLocation[];
  defaultValue?: string;
  required: boolean;
}
```
