#!/bin/bash
cd /Users/hkr/Documents/GitHub/mcp-memory-service

echo 'Testing MCP server communication as persistent process...'

# Set the environment variables
export MCP_MEMORY_CHROMA_PATH="/Users/hkr/Library/Application Support/mcp-memory/chroma_db"
export MCP_MEMORY_BACKUPS_PATH="/Users/hkr/Library/Application Support/mcp-memory/backups"

# Start the server in background and communicate with it
echo 'Starting MCP server...'
uv run memory &
SERVER_PID=$!

# Give the server time to start
sleep 3

echo 'Sending health check request...'
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"dashboard_check_health","arguments":{}},"id":1}' > /tmp/mcp_request.json

# Send the request and capture response
timeout 10s bash -c "cat /tmp/mcp_request.json | nc localhost 12345 2>/dev/null || echo 'Failed to connect'"

# Clean up
kill $SERVER_PID 2>/dev/null
rm -f /tmp/mcp_request.json

echo 'Test completed.'
