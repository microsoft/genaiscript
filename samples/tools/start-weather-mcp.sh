#!/bin/bash

# Weather MCP Server Launcher
# This script launches the weather MCP server using HTTP transport

set -e

echo "🌤️  Starting Weather MCP Server..."

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    exit 1
fi

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Set default port if not specified
export MCP_PORT=${MCP_PORT:-3001}

echo "📍 Project root: $PROJECT_ROOT"
echo "🚀 Starting server on port $MCP_PORT"
echo "🔗 MCP endpoint: http://localhost:$MCP_PORT/mcp"
echo "❤️  Health check: http://localhost:$MCP_PORT/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Change to project root to ensure dependencies are found
cd "$PROJECT_ROOT"

# Start the weather MCP server
exec node samples/tools/weather-mcp-server.mjs