#!/bin/bash

# Debug startup script to see what's happening
echo "🔍 Debug: MCP Memory Dashboard Startup"
echo "======================================"

cd /Users/hkr/Documents/GitHub/mcp-memory-dashboard

echo "📋 Environment check:"
echo "  Node.js: $(node --version)"
echo "  NPM: $(npm --version)"
echo "  Docker: $(docker --version | head -1)"

echo ""
echo "🔧 .env configuration:"
echo "  VITE_USE_DIRECT_CHROMA_ACCESS=$(grep VITE_USE_DIRECT_CHROMA_ACCESS .env | head -1)"
echo "  VITE_MEMORY_CHROMA_PATH=$(grep VITE_MEMORY_CHROMA_PATH .env | head -1)"

echo ""
echo "📦 Building application..."
npm run build > build.log 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed:"
    cat build.log
    exit 1
fi

echo ""
echo "🚀 Starting Electron (first 30 seconds of logs)..."
echo "================================================"

# Start the app and capture initial logs
npm run electron:preview > startup.log 2>&1 &
APP_PID=$!

echo "App PID: $APP_PID"

# Monitor for first 30 seconds
for i in {1..30}; do
    if ps -p $APP_PID > /dev/null; then
        echo "[$i/30] App still running..."
        sleep 1
    else
        echo "[$i/30] App stopped!"
        break
    fi
done

echo ""
echo "📋 Startup logs:"
echo "================"
cat startup.log

echo ""
echo "🐳 Docker container check:"
docker ps --filter "name=mcp-memory"

echo ""
echo "🧹 Cleanup"
kill $APP_PID 2>/dev/null
rm -f build.log startup.log
echo "✅ Debug test completed"
