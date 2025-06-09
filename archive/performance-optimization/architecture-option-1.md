"""
RECOMMENDED ARCHITECTURE: Direct ChromaDB Access

Benefits:
1. No MCP service duplication
2. Direct, fast database access
3. Shared database with Claude Desktop
4. Simpler configuration
5. Better performance
"""

# Simplified .env (Option 1)
# Backend - Only one ChromaDB path needed
MCP_MEMORY_CHROMA_PATH="/Users/hkr/Library/Application Support/mcp-memory/chroma_db"
MCP_MEMORY_BACKUPS_PATH="/Users/hkr/Library/Application Support/mcp-memory/backups"

# Frontend - Direct database access
VITE_CHROMA_PATH="/Users/hkr/Library/Application Support/mcp-memory/chroma_db"
VITE_BACKUPS_PATH="/Users/hkr/Library/Application Support/mcp-memory/backups"

# No need for:
# - VITE_MEMORY_SERVICE_PATH (eliminated)
# - Spawning separate MCP service
# - Duplicate environment variables
