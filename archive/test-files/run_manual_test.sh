#!/bin/bash

echo "🔧 Manual MCP Memory Service Test"
echo "This will run the memory service and test it step by step"
echo ""

# Test 1: Run the direct Python test
echo "📋 Test 1: Direct Python communication test"
echo "Running: python3 test_direct.py"
echo ""

cd /Users/hkr/Documents/GitHub/mcp-memory-dashboard
python3 test_direct.py

echo ""
echo "📋 Test 2: Enhanced fix test"
echo "Running: node test_enhanced_fix.js"
echo ""

node test_enhanced_fix.js

echo ""
echo "🎯 Analysis:"
echo "- If Test 1 passes: MCP protocol works, issue is in Node.js client"
echo "- If Test 1 fails: Issue is in the MCP server implementation"
echo "- If both fail: Fundamental MCP communication issue"
echo ""
echo "✅ Look for these debug messages:"
echo "   - 'TOOL CALL INTERCEPTED' = Tool calls reach our handler"
echo "   - 'Deferring ChromaDB initialization' = Lazy loading working"
echo "   - 'Server capabilities registered' = Handlers properly registered"
