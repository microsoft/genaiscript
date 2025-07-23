---
title: MCP Server Resolution by ID
description: Reference MCP servers by ID from mcp.json files using Copilot conventions
---

## Overview

GenAIScript now supports referencing MCP servers by ID and automatically resolving their configuration from `mcp.json` files, following the GitHub Copilot Chat conventions.

## Usage

Instead of providing all MCP server configuration inline, you can now reference servers by ID:

```javascript
script({
    title: "Use MCP server by ID",
    system: ["system.mcp"],
    vars: {
        "system.mcp.id": "memory-server", // Only ID needed
        // Command, args, env are resolved from mcp.json
    },
})
```

## MCP JSON File Locations

GenAIScript searches for MCP server configurations in the following order:

1. `.vscode/mcp.json` (GitHub Copilot Chat format)
2. `.ruler/mcp.json` (Ruler format)
3. `mcp.json` (root level)

## Supported Formats

### GitHub Copilot Chat Format

```json
{
  "servers": {
    "memory-server": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {
        "MCP_LOG_LEVEL": "debug"
      }
    }
  }
}
```

### Claude Desktop Format

```json
{
  "mcpServers": {
    "memory-server": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

## Error Handling

When a server ID is not found, GenAIScript provides helpful error messages:

```
MCP server "unknown-server" not found in mcp.json files. Available servers: memory-server, filesystem-server
```

## Benefits

- **Simplified configuration**: Just reference servers by ID
- **Centralized management**: Keep MCP server configs in mcp.json files
- **IDE integration**: Works seamlessly with GitHub Copilot Chat and Claude Desktop
- **Consistent conventions**: Follows established patterns from popular AI coding assistants

## Example

With this `.vscode/mcp.json`:

```json
{
  "servers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"]
    }
  }
}
```

You can use:

```javascript
script({
    title: "Use memory server tools",
    system: ["system.mcp"],
    vars: {
        "system.mcp.id": "memory",
    },
})

$`Store "Hello World" in memory and retrieve it.`
```