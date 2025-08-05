import { EnvironmentScannerPlugin } from '../index';

describe('EnvironmentScannerPlugin Unit Tests', () => {
  let plugin: EnvironmentScannerPlugin;

  beforeEach(() => {
    plugin = new EnvironmentScannerPlugin();
  });

  describe('generateEnvironmentConfig', () => {
    it('should generate config for local environment', () => {
      const config = plugin.generateEnvironmentConfig('local');

      expect(config).toEqual({
        displayName: 'Local',
        description: 'Local environment',
        isLocal: true,
        region: 'us-east-1'
      });
    });

    it('should generate config for localhost environment', () => {
      const config = plugin.generateEnvironmentConfig('localhost');

      expect(config).toEqual({
        displayName: 'Localhost',
        description: 'Localhost environment',
        isLocal: true,
        region: 'us-east-1'
      });
    });

    it('should generate config for production environment', () => {
      const config = plugin.generateEnvironmentConfig('production');

      expect(config).toEqual({
        displayName: 'Production',
        description: 'Production environment',
        isLocal: false,
        region: 'us-east-1'
      });
    });

    it('should use region mapping for known environments', () => {
      const devConfig = plugin.generateEnvironmentConfig('development');
      const stagingConfig = plugin.generateEnvironmentConfig('staging');

      expect(devConfig.region).toBe('us-west-2');
      expect(stagingConfig.region).toBe('us-east-2');
      expect(devConfig.isLocal).toBe(false);
      expect(stagingConfig.isLocal).toBe(false);
    });

    it('should capitalize display name correctly', () => {
      const config = plugin.generateEnvironmentConfig('my-custom-env');

      expect(config.displayName).toBe('My-custom-env');
      expect(config.description).toBe('My-custom-env environment');
    });

    it('should default to us-east-1 for unknown environments', () => {
      const config = plugin.generateEnvironmentConfig('unknown-env');

      expect(config.region).toBe('us-east-1');
      expect(config.isLocal).toBe(false);
    });
  });

  describe('plugin metadata', () => {
    it('should have correct name', () => {
      expect(plugin.name).toBe('@orcdkestrator/environment-scanner');
    });

    it('should have a version', () => {
      expect(plugin.version).toBeDefined();
      expect(typeof plugin.version).toBe('string');
    });
  });
});