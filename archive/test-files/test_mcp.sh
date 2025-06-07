#!/bin/bash
cd /Users/hkr/Documents/GitHub/mcp-memory-service

echo 'Testing direct communication with MCP server...'
echo 'Using UV environment...'

# Set the environment variables
export MCP_MEMORY_CHROMA_PATH="/Users/hkr/Library/Application Support/mcp-memory/chroma_db"
export MCP_MEMORY_BACKUPS_PATH="/Users/hkr/Library/Application Support/mcp-memory/backups"

# Test the health check endpoint using the UV environment
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"dashboard_check_health","arguments":{}},"id":1}' | uv run memory
