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
      options: {}
    };

    mockOrcdkConfig = {
      version: '1.0.0',
      environments: {},
      isLocal: true,
      plugins: []
    };

    plugin = new EnvironmentScannerPlugin();
  });

  it('should have correct name', () => {
    expect(plugin.name).toBe('environment-scanner');
  });

  it('should be defined', () => {
    expect(plugin).toBeDefined();
  });
});
