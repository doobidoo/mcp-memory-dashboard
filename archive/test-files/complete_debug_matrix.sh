#!/bin/bash

echo "🔬 COMPLETE MCP DEBUGGING MATRIX"
echo "Tests minimal → simplified → complex to pinpoint exact issue"
echo ""

cd /Users/hkr/Documents/GitHub/mcp-memory-dashboard

echo "📋 Test 1/3: Minimal UV Server (baseline)"
echo "Tests if @call_tool decorator works at all in UV environment"
echo ""

node test_minimal_uv.js

echo ""
echo "=" | tr '=' '='  | head -c 60
echo ""

echo "📋 Test 2/3: Simplified Memory Server"  
echo "Tests basic memory server structure without complexity"
echo ""

node test_simplified_memory.js

echo ""
echo "=" | tr '=' '='  | head -c 60
echo ""

echo "📋 Test 3/3: Complex Memory Service (current implementation)"
echo "Tests our full memory service with all features"
echo ""

node test_final_fix.js

echo ""
echo "🎯 DEBUGGING MATRIX ANALYSIS:"
echo ""
echo "Minimal✅ + Simplified✅ + Complex❌ = Issue in complex initialization"
echo "Minimal✅ + Simplified❌ + Complex❌ = Issue in memory server structure"  
echo "Minimal❌ + Simplified❌ + Complex❌ = MCP library issue in UV"
echo "All✅ = Everything works, dashboard ready!"
echo ""
echo "This will definitively identify the exact source of the problem."
