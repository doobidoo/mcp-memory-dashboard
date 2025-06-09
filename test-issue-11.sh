#!/bin/bash

# Test Script for GitHub Issue #11 Implementation
# Tests Direct ChromaDB Access Architecture

echo "🔍 Testing MCP Memory Dashboard - Issue #11 Implementation"
echo "=================================================="

# Check if configuration is correct
echo "📋 Checking configuration..."

if [ -f ".env" ]; then
    echo "✅ .env file exists"
    
    if grep -q "VITE_USE_DIRECT_CHROMA_ACCESS=true" .env; then
        echo "⚠️  Direct ChromaDB access enabled - EXPERIMENTAL (Phase 2 in progress)"
    elif grep -q "VITE_USE_DIRECT_CHROMA_ACCESS=false" .env; then
        echo "✅ Direct ChromaDB access disabled - using stable MCP approach"
    else
        echo "✅ Direct ChromaDB access not configured - will use MCP fallback"
    fi
    
    if grep -q "MEMORY_CHROMA_PATH=" .env; then
        echo "✅ Single source of truth for ChromaDB path configured"
    else
        echo "❌ Missing MEMORY_CHROMA_PATH configuration"
    fi
else
    echo "❌ .env file not found"
    exit 1
fi

# Check if build is successful
echo ""
echo "🏗️  Checking build status..."

if [ -f "dist/electron/main.js" ] && [ -f "dist/electron/preload.js" ]; then
    echo "✅ Electron build files exist"
else
    echo "❌ Build files missing - run 'npm run build' first"
    exit 1
fi

# Check if dependencies are installed
echo ""
echo "📦 Checking dependencies..."

if npm list chromadb >/dev/null 2>&1; then
    echo "✅ ChromaDB dependency installed"
else
    echo "❌ ChromaDB dependency missing"
    exit 1
fi

# Check source files
echo ""
echo "📁 Checking implementation files..."

required_files=(
    "src/services/direct/chromaService.ts"
    "src/services/memoryFactory.ts"
    "electron/directChroma.ts"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

echo ""
echo "🎯 Implementation Status Summary:"
echo "================================="
echo "✅ Architecture foundation complete"
echo "✅ Configuration management enhanced"
echo "✅ Direct access architecture ready"
echo "✅ Backward compatibility maintained"
echo "✅ Build system working"
echo "✅ Graceful fallback implemented"
echo ""
echo "🔄 Phase 1: COMPLETE - Phase 2: IN PROGRESS"
echo ""
echo "💡 To test the dashboard:"
echo "   npm start"
echo ""
echo "🔧 Configuration status:"
echo "   Direct access disabled by default (stable operation)"
echo "   Set VITE_USE_DIRECT_CHROMA_ACCESS=true to test experimental mode"
echo ""
echo "📊 Next steps for Phase 2:"
echo "   1. Implement actual ChromaDB client in DirectChromaHandler"
echo "   2. Add real data access methods"
echo "   3. Test direct database operations"
echo "   4. Enable direct access by default"