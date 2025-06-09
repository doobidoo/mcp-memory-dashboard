#!/bin/bash

# MCP Memory Dashboard Environment Setup Script
# ==============================================
# This script helps set up the required directories and environment

echo "🔧 MCP Memory Dashboard Environment Setup"
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "📋 Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file to set correct paths:"
    echo "   - VITE_MEMORY_SERVICE_PATH (path to your MCP Memory Service)"
    echo "   - Update username in all paths"
    echo ""
else
    echo "✅ .env file exists"
fi

# Check if MCP memory directories exist
MEMORY_DIR="$HOME/Library/Application Support/mcp-memory"
CHROMA_DIR="$MEMORY_DIR/chroma_db"
BACKUPS_DIR="$MEMORY_DIR/backups"

echo "📁 Checking/creating memory directories..."

if [ ! -d "$MEMORY_DIR" ]; then
    echo "📂 Creating memory directory: $MEMORY_DIR"
    mkdir -p "$MEMORY_DIR"
else
    echo "✅ Memory directory exists: $MEMORY_DIR"
fi

if [ ! -d "$CHROMA_DIR" ]; then
    echo "📂 Creating ChromaDB directory: $CHROMA_DIR"
    mkdir -p "$CHROMA_DIR"
else
    echo "✅ ChromaDB directory exists: $CHROMA_DIR"
fi

if [ ! -d "$BACKUPS_DIR" ]; then
    echo "📂 Creating backups directory: $BACKUPS_DIR"
    mkdir -p "$BACKUPS_DIR"
else
    echo "✅ Backups directory exists: $BACKUPS_DIR"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Edit .env file: nano .env"
echo "2. Set VITE_MEMORY_SERVICE_PATH to your MCP Memory Service location"
echo "3. Update username in paths if different from: $(whoami)"
echo "4. Ensure your Claude Desktop config matches these paths"
echo "5. Run: npm install && npm start"
echo ""

# Check Claude config
CLAUDE_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
if [ -f "$CLAUDE_CONFIG" ]; then
    echo "✅ Claude Desktop config found: $CLAUDE_CONFIG"
    echo "🔍 Checking if memory service is configured..."
    
    if grep -q '"memory"' "$CLAUDE_CONFIG"; then
        echo "✅ Memory service found in Claude config"
    else
        echo "⚠️  Memory service not found in Claude config"
        echo "📋 Add this to your Claude Desktop config:"
        echo '{
  "mcpServers": {
    "memory": {
      "command": "uv",
      "args": ["--directory", "/path/to/mcp-memory-service", "run", "memory"],
      "env": {
        "MCP_MEMORY_CHROMA_PATH": "'$CHROMA_DIR'",
        "MCP_MEMORY_BACKUPS_PATH": "'$BACKUPS_DIR'"
      }
    }
  }
}'
    fi
else
    echo "⚠️  Claude Desktop config not found: $CLAUDE_CONFIG"
fi

echo ""
echo "✅ Setup complete! Don't forget to edit .env with your actual paths."
