# Weather MCP Server Example

This example demonstrates how to create and use a Model Context Protocol (MCP) server using HTTP transport with GenAIScript.

## Overview

The example consists of three main components:

1. **Weather MCP Server** (`samples/tools/weather-mcp-server.mjs`) - A standalone Node.js server that implements the MCP protocol over HTTP
2. **Programmatic Client** (`samples/sample/genaisrc/weather-mcp-http.genai.mts`) - A GenAIScript that connects to the MCP server using `host.mcpServer()`
3. **Configuration Client** (`samples/sample/genaisrc/weather-mcp-config.genai.mts`) - A very simple GenAIScript demonstrating programmatic MCP connection
4. **MCP Servers Config** (`samples/sample/genaisrc/weather-mcp-servers.genai.mts`) - Shows how `mcpServers` configuration works for process-based servers

## Features

The Weather MCP Server provides three tools:

- `get_current_weather` - Get current weather for a city
- `get_weather_forecast` - Get 3-day weather forecast for a city  
- `compare_weather` - Compare weather between two cities

## Setup and Usage

### 1. Start the Weather MCP Server

Using the launcher script:
```bash
./tools/start-weather-mcp.sh
```

Or directly with Node.js:
```bash
cd /path/to/genaiscript
node tools/weather-mcp-server.mjs
```

The server will start on port 3001 by default. You can change this by setting the `MCP_PORT` environment variable:
```bash
MCP_PORT=3002 node samples/tools/weather-mcp-server.mjs
```

### 2. Test the Server

Health check:
```bash
curl http://localhost:3001/health
```

Test MCP protocol directly:
```bash
# Initialize
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {"name": "test-client", "version": "1.0.0"}
    }
  }'

# List tools
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list"
  }'

# Call weather tool
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "get_current_weather",
      "arguments": {"location": "Paris"}
    }
  }'
```

### 3. Run the GenAIScript Client

With the server running, you can choose between two different client approaches:

#### Option A: Direct MCP Server Connection

Uses `host.mcpServer()` to connect programmatically:
```bash
cd samples/sample
genaiscript run weather-mcp-http --model echo
```

You can also customize the cities to check:
```bash
genaiscript run weather-mcp-http --model echo --vars cities="Berlin, Tokyo, Sydney"
```

#### Option B: Simple Configuration Demo

A very simple example:
```bash
cd samples/sample
genaiscript run weather-mcp-config --model echo
```

#### Option C: MCP Servers Configuration

Shows process-based MCP server configuration:
```bash
cd samples/sample
genaiscript run weather-mcp-servers --model echo
```

## Available Cities

The server includes mock weather data for the following cities:
- Paris
- London
- New York
- Tokyo
- Sydney
- Berlin
- Moscow
- Mumbai
- Cairo
- Vancouver

## Technical Details

### MCP Protocol Implementation

The server implements a simplified version of the MCP protocol with the following capabilities:

- **Transport**: HTTP with JSON-RPC 2.0
- **Methods**: `initialize`, `tools/list`, `tools/call`
- **CORS**: Enabled for cross-origin requests
- **Session Management**: Basic session tracking

### GenAIScript Integration

The GenAIScript uses the `host.mcpServer()` API to connect to the HTTP server:

```typescript
const weatherServer = {
    id: "weather",
    type: "http", 
    url: "http://localhost:3001/mcp"
}

const weather = await host.mcpServer(weatherServer)
const result = await weather.callTool("get_current_weather", { location: "Paris" })
```

## Troubleshooting

### Server Won't Start
- Check if port 3001 is available
- Ensure Node.js version is compatible (v16+)

### GenAIScript Can't Connect
- Verify the server is running (`curl http://localhost:3001/health`)
- Check the URL in the GenAIScript matches the server port
- Ensure no firewall is blocking the connection

### Tool Calls Fail
- Check server logs for error messages
- Verify the tool parameters match the expected schema
- Test tool calls directly with curlith curl