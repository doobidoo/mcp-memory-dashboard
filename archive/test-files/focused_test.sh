#!/bin/bash

echo "🔬 FOCUSED MCP DEBUGGING"
echo "Testing minimal vs complex server to find the exact difference"
echo ""

cd /Users/hkr/Documents/GitHub/mcp-memory-dashboard

echo "📋 Test: Minimal Server with UV Environment"
echo "This tests if @call_tool works in the UV environment that our memory service uses"
echo ""

node test_minimal_uv.js

echo ""
echo "🎯 NEXT STEPS based on results:"
echo ""
echo "If Minimal UV PASSES:"
echo "  ✅ MCP library works perfectly in UV environment"  
echo "  ❌ Issue is in our complex memory service implementation"
echo "  🔧 Need to simplify memory service to match working minimal version"
echo ""
echo "If Minimal UV FAILS:"
echo "  ❌ MCP library has issues even in UV environment"
echo "  🔧 Need to check MCP library version or environment setup"
