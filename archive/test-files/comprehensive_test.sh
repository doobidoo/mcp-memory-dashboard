#!/bin/bash

echo "🔬 COMPREHENSIVE MCP DEBUGGING TEST"
echo "Tests both super minimal and memory service to find the difference"
echo ""

cd /Users/hkr/Documents/GitHub/mcp-memory-dashboard

echo "📋 Test 1: Super Minimal MCP Server (baseline)"
echo "Testing if @server.call_tool() decorator works at all..."
echo ""

node test_super_minimal.js

echo ""
echo "=" | tr '=' '='  | head -c 60
echo ""
echo ""

echo "📋 Test 2: Memory Service with All Fixes Applied"
echo "Testing our actual memory service..."
echo ""

node test_final_fix.js

echo ""
echo "🎯 ANALYSIS SUMMARY:"
echo ""
echo "If Test 1 PASSES and Test 2 FAILS:"
echo "  ✅ MCP library works fine"
echo "  ❌ Issue is in our memory service implementation"
echo "  🔧 Need to compare working vs non-working code"
echo ""
echo "If BOTH tests FAIL:"
echo "  ❌ Fundamental MCP library issue"
echo "  🔧 Need to check MCP library version/compatibility"
echo ""
echo "If BOTH tests PASS:"
echo "  🎉 Everything is working!"
echo "  ✅ Dashboard integration should work"
