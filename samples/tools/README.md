# Weather MCP Server

A simple weather Model Context Protocol (MCP) server implementation using HTTP transport.

## Quick Start

1. Start the server:
   ```bash
   ./start-weather-mcp.sh
   ```

2. Test it:
   ```bash
   curl http://localhost:3001/health
   ```

3. Use it with GenAIScript:
   ```bash
   cd ../sample
   # Programmatic approach
   node ../../packages/cli/dist/src/index.js run weather-mcp-http
   # Configuration approach  
   node ../../packages/cli/dist/src/index.js run weather-mcp-config
   ```

## Files

- `weather-mcp-server.mjs` - The MCP server implementation
- `start-weather-mcp.sh` - Launcher script
- `../sample/genaisrc/weather-mcp-http.genai.mts` - Example GenAIScript client (programmatic)
- `../sample/genaisrc/weather-mcp-config.genai.mts` - Example GenAIScript client (configuration)

## Features

- HTTP transport (no stdio required)
- Three weather tools: current weather, forecast, comparison
- Mock data for 10 cities
- CORS enabled
- Health check endpoint

For detailed documentation, see `/docs/weather-mcp-example.md`./samples/weather-mcp-example.md`.