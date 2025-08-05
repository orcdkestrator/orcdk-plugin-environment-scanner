import { EnvironmentScannerPlugin } from '../index';
import { PluginConfig, OrcdkConfig } from '@orcdkestrator/core';

describe('EnvironmentScannerPlugin', () => {
  let plugin: EnvironmentScannerPlugin;
  let mockConfig: PluginConfig;
  let mockOrcdkConfig: OrcdkConfig;

  beforeEach(() => {
    mockConfig = {
      name: 'environment-scanner',
      enabled: true,
      config: {}
    };

    mockOrcdkConfig = {
      cdkRoot: 'cdk',
      deploymentStrategy: 'auto',
      environments: {
        local: { displayName: 'Local', isLocal: true }
      },
      plugins: []
    };

    plugin = new EnvironmentScannerPlugin();
  });

  it('should have correct name', () => {
    expect(plugin.name).toBe('@orcdkestrator/orcdk-plugin-environment-scanner');
  });

  it('should be defined', () => {
    expect(plugin).toBeDefined();
  });
});
