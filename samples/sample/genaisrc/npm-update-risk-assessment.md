# NPM Update Risk Assessment Script

This GenAI script detects outdated npm packages in your Node.js project and provides comprehensive risk assessment with security and functionality analysis.

## Features

- 🔍 **Automatic Detection**: Scans your project for outdated npm packages
- 📊 **Risk Assessment**: Analyzes security and functionality risks for each update
- 🔄 **Version Analysis**: Identifies major vs minor/patch version changes
- 🛡️ **Security Focus**: Special attention to authentication and security-critical packages
- 📦 **Package Intelligence**: Retrieves maintainer info, release dates, and metadata
- 🧩 **Context Chunking**: Optimized for GitHub models' 8k token limit

## Usage

### Basic Usage
```bash
genaiscript run npm-update-risk-assessment
```

### With Specific Model
```bash
genaiscript run npm-update-risk-assessment --model github:gpt-4o-mini
```

### With Output File
```bash
genaiscript run npm-update-risk-assessment -o npm-risk-report.md
```

## Example Output

The script generates a comprehensive report including:

### Package Summary
- **@azure/identity**: 4.10.2 → 4.11.0 (minor/patch)
- **@langchain/langgraph**: 0.2.74 → 0.4.2 (minor/patch)

### Risk Assessment Framework
- Security risk analysis (LOW/MEDIUM/HIGH)
- Functionality impact assessment
- Breaking change detection
- Maintenance status evaluation

### Recommendations
- Priority order for updates
- Testing recommendations
- Security considerations
- Specific precautions

## Requirements

- Node.js project with `package.json`
- npm installed and accessible
- GitHub Models API access (for AI analysis)

## Model Compatibility

- **Optimized for**: GitHub Models (gpt-4o-mini, gpt-4o)
- **Token Limit**: Designed for 8k context window
- **Chunking**: Automatically processes large dependency lists
- **Fallback**: Can work with any OpenAI-compatible model

## How It Works

1. **Detection**: Runs `npm outdated --json` to find outdated packages
2. **Metadata**: Fetches package information from npm registry
3. **Analysis**: Uses AI to assess security and functionality risks
4. **Reporting**: Generates actionable recommendations

## Configuration

The script automatically adapts to your project structure and can be customized by:
- Modifying the `chunkSize` for different token limits
- Adjusting the `maxTokens` for package information
- Changing the `temperature` for more/less conservative analysis

## Best Practices

1. **Run Regularly**: Check for updates weekly or before releases
2. **Test Updates**: Always test in development environment first
3. **Security Priority**: Address security-related updates promptly
4. **Staged Rollout**: Update packages incrementally, not all at once
5. **Documentation**: Review package changelogs before major updates