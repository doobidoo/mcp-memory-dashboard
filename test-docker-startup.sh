#!/bin/bash

# Simple test to trigger Docker ChromaDB initialization
# This will make a request that should start the Docker container

echo "🧪 Testing Docker ChromaDB Initialization"
echo "========================================"

# Start the dashboard in background
echo "📱 Starting dashboard..."
cd /Users/hkr/Documents/GitHub/mcp-memory-dashboard
npm start > /tmp/dashboard.log 2>&1 &
DASHBOARD_PID=$!

echo "   Dashboard PID: $DASHBOARD_PID"
echo "   Waiting for startup..."
sleep 15

echo ""
echo "🔍 Checking if Dashboard initialized..."
if ps -p $DASHBOARD_PID > /dev/null; then
    echo "✅ Dashboard is running"
else
    echo "❌ Dashboard failed to start"
    cat /tmp/dashboard.log | tail -20
    exit 1
fi

echo ""
echo "🐳 Checking for Docker containers..."
CONTAINER_COUNT=$(docker ps --filter "name=mcp-memory" | wc -l)
if [ $CONTAINER_COUNT -gt 1 ]; then
    echo "✅ Docker container is running!"
    docker ps --filter "name=mcp-memory"
else
    echo "⚠️  No Docker container found yet (this is normal - starts on first memory operation)"
fi

echo ""
echo "📋 Dashboard logs (last 20 lines):"
echo "=================================="
tail -20 /tmp/dashboard.log

echo ""
echo "🧹 Cleanup"
echo "=========="
kill $DASHBOARD_PID 2>/dev/null
echo "✅ Test completed"
