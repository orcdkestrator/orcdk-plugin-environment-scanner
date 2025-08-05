# Environment Scanner Plugin Examples

## Basic Configuration

```json
{
  "plugins": {
    "@orcdkestrator/environment-scanner": {
      "enabled": true
    }
  }
}
```

## Custom Scan Paths

```json
{
  "plugins": {
    "@orcdkestrator/environment-scanner": {
      "enabled": true,
      "config": {
        "scanPaths": ["cdk/lib", "cdk/bin", "src"],
        "outputFile": "env-dependencies.json",
        "includeOptional": true
      }
    }
  }
}
```

## With Exclusions

```json
{
  "plugins": {
    "@orcdkestrator/environment-scanner": {
      "enabled": true,
      "config": {
        "scanPaths": ["cdk"],
        "excludePatterns": ["**/test/**", "**/*.test.ts"],
        "outputFile": "required-env-vars.json"
      }
    }
  }
}
```

## Sample Output

```json
{
  "required": [
    {
      "name": "AWS_REGION",
      "locations": [
        {
          "file": "cdk/lib/api-stack.ts",
          "line": 15,
          "column": 32
        }
      ],
      "required": true
    }
  ],
  "optional": [
    {
      "name": "LOG_LEVEL",
      "locations": [
        {
          "file": "cdk/lib/lambda-stack.ts",
          "line": 42,
          "column": 28
        }
      ],
      "defaultValue": "info",
      "required": false
    }
  ]
}
```
