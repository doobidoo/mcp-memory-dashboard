"""
ALTERNATIVE ARCHITECTURE: MCP Service Discovery

Connect to existing Claude Desktop MCP service instead of spawning new one.

Benefits:
1. Single source of truth
2. Consistent data between Claude and dashboard  
3. No resource conflicts
4. Follows MCP protocol properly
"""

# Simplified .env (Option 2)
# Only Claude Desktop configuration needed
CLAUDE_CONFIG_PATH="/Users/hkr/Library/Application Support/Claude/claude_desktop_config.json"

# Dashboard reads memory service config from Claude Desktop config
# No duplication of paths
# No spawning of separate service
