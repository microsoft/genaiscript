# GitHub Copilot MCP Configuration Support

This implementation adds support for reading MCP server configuration from GitHub Copilot's default file location (`.vscode/mcp.json`) and integrating it with GenAIScript's existing mcpServers configuration.

## Example Usage

### GitHub Copilot Configuration (`.vscode/mcp.json`)
```json
{
  "servers": {
    "genaiscript": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "genaiscript", "mcp", "--cwd", "${workspaceFolder}"],
      "envFile": "${workspaceFolder}/.env"
    },
    "filesystem": {
      "type": "stdio", 
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed"]
    },
    "http-server": {
      "type": "http",
      "url": "http://localhost:8080/mcp"
    }
  }
}
```

### GenAIScript Configuration (`genaiscript.config.json`)
```json
{
  "mcpServers": {
    "python-tools": {
      "command": "python",
      "args": ["-m", "mcp_server"],
      "env": {
        "PYTHONPATH": "/custom/path"
      }
    }
  }
}
```

### Final Merged Configuration
The system automatically merges these configurations, making all servers available:

```typescript
// Available in scripts via the merged configuration
const mcpServers = {
  "genaiscript": {
    "type": "stdio",
    "command": "npx", 
    "args": ["-y", "genaiscript", "mcp", "--cwd", "${workspaceFolder}"]
  },
  "filesystem": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed"]
  },
  "http-server": {
    "type": "http", 
    "url": "http://localhost:8080/mcp"
  },
  "python-tools": {
    "command": "python",
    "args": ["-m", "mcp_server"],
    "env": {
      "PYTHONPATH": "/custom/path"
    }
  }
}
```

## Features

- ✅ Automatic detection and reading of `.vscode/mcp.json` files
- ✅ Format conversion from GitHub Copilot to GenAIScript format
- ✅ Intelligent merging of multiple configuration sources
- ✅ JSON schema validation for configuration correctness
- ✅ Graceful error handling for missing or invalid files
- ✅ Full backwards compatibility with existing configurations

## Configuration Resolution Order

1. Load default GenAIScript configuration
2. Merge user's GenAIScript configuration files (`genaiscript.config.json/yaml`)  
3. **Read and merge GitHub Copilot MCP configurations (`.vscode/mcp.json`)**
4. Apply environment variable overrides
5. Validate final configuration against schema

The GitHub Copilot MCP configurations are automatically detected and integrated without any additional setup required.