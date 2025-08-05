# Orcdkestrator Plugin: Environment Scanner

Scans CDK projects for environment variable dependencies

## Installation

```bash
npm install @orcdkestrator/orcdk-plugin-environment-scanner --save-dev
```

## Configuration

Add to your `orcdk.config.json`:

```json
{
  "plugins": [
    {
      "name": "environment-scanner",
      "enabled": true,
      "config": {
        // Plugin-specific configuration
      }
    }
  ]
}
```

## Usage

See configuration section above and examples directory for detailed usage.

## API Reference

See [API Documentation](docs/api.md) for detailed information.

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| enabled | boolean | true | Enable/disable the plugin |



## How It Works

The plugin analyzes your CDK code to identify all environment variables used, helping ensure all required variables are set before deployment.

## Examples

See the [examples directory](docs/examples/) for complete examples.

## Development

```bash
# Clone the repository
git clone https://github.com/orcdkestrator/orcdk-plugin-environment-scanner.git

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## License

MIT - see [LICENSE](LICENSE) for details.
