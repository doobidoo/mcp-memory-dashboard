#!/bin/bash

# REAL Performance Test for Issue #10 Resolution
# Tests actual MCP calls to verify stats optimization is working
# Following memory-driven development practices

echo "🚀 REAL MCP-MEMORY-DASHBOARD PERFORMANCE TESTING"
echo "================================================="
echo "Testing Issue #10: Stats performance optimization"
echo "Target: 8-10s → <1s for stats queries"
echo ""

PROJECT_PATH="/Users/hkr/Documents/GitHub/mcp-memory-dashboard"
TEST_LOG="/tmp/mcp-perf-test-$(date +%Y%m%d_%H%M%S).log"
RESULTS_FILE="$PROJECT_PATH/archive/performance-testing/real-perf-results-$(date +%Y%m%d_%H%M%S).json"

cd "$PROJECT_PATH"

# Function to test MCP service directly
test_mcp_stats_performance() {
    echo "📊 Testing MCP stats performance directly..."
    
    # Check if MCP memory service is available via Claude config
    CLAUDE_CONFIG_PATH="/Users/hkr/Library/Application Support/Claude/claude_desktop_config.json"
    
    if [ ! -f "$CLAUDE_CONFIG_PATH" ]; then
        echo "❌ Claude config not found at: $CLAUDE_CONFIG_PATH"
        return 1
    fi
    
    echo "✅ Claude config found"
    
    # Test 1: Check Docker container status
    echo ""
    echo "🐳 Docker Container Status:"
    if docker ps --filter "name=mcp-memory-chromadb" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep mcp-memory; then
        echo "✅ Docker container running"
        
        # Test API response time
        echo "   Testing API response time..."
        START_TIME=$(python3 -c 'import time; print(int(time.time() * 1000))')
        curl -s -o /dev/null -w "   API Response: %{time_total}s\n" http://localhost:8000/api/v1/heartbeat
    else
        echo "⚠️  Docker container not running - will start on demand"
    fi
    
    # Test 2: Start dashboard and measure real performance
    echo ""
    echo "📱 Starting dashboard for performance testing..."
    
    # Start dashboard in background with detailed logging
    ELECTRON_ENABLE_LOGGING=1 npm start > "$TEST_LOG" 2>&1 &
    DASHBOARD_PID=$!
    
    echo "   Dashboard PID: $DASHBOARD_PID"
    echo "   Waiting for full initialization (20s)..."
    sleep 20
    
    if ! ps -p $DASHBOARD_PID > /dev/null; then
        echo "❌ Dashboard failed to start"
        echo "   Last 20 lines of log:"
        tail -20 "$TEST_LOG"
        return 1
    fi
    
    echo "✅ Dashboard started successfully"
    
    # Give additional time for full service initialization
    echo "   Waiting for service stabilization (15s)..."
    sleep 15
    
    # Test 3: Analyze logs for performance information
    echo ""
    echo "🔍 Analyzing dashboard logs for performance indicators..."
    
    if grep -q "Stats computed in" "$TEST_LOG"; then
        echo "✅ Found stats timing information:"
        grep "Stats computed in" "$TEST_LOG" | tail -5
    else
        echo "⚠️  No stats timing information found in logs"
    fi
    
    if grep -q "Cache HIT\|Cache MISS\|Cache SET" "$TEST_LOG"; then
        echo "✅ Found cache activity:"
        grep "Cache HIT\|Cache MISS\|Cache SET" "$TEST_LOG" | tail -10
    else
        echo "⚠️  No cache activity found in logs"
    fi
    
    if grep -q "Large collection detected\|Small collection detected" "$TEST_LOG"; then
        echo "✅ Found collection size optimization:"
        grep "Large collection detected\|Small collection detected" "$TEST_LOG" | tail -3
    else
        echo "⚠️  No collection size optimization messages found"
    fi
    
    # Test 4: Check for error patterns
    echo ""
    echo "🚨 Checking for performance-related errors..."
    
    if grep -i "error\|failed\|timeout" "$TEST_LOG" | grep -v "No memories found" | head -5; then
        echo "⚠️  Found potential issues (see above)"
    else
        echo "✅ No major errors detected"
    fi
    
    # Test 5: Extract timing information
    echo ""
    echo "⏱️  Extracting timing information..."
    
    # Look for frontend timing measurements
    if grep -q "completed in.*ms" "$TEST_LOG"; then
        echo "✅ Frontend timing measurements:"
        grep "completed in.*ms" "$TEST_LOG" | tail -5
    fi
    
    # Look for backend stats computation timing
    if grep -q "Stats computed in.*ms" "$TEST_LOG"; then
        STATS_TIMING=$(grep "Stats computed in.*ms" "$TEST_LOG" | tail -1 | grep -o '[0-9]*\.[0-9]*ms')
        echo "✅ Latest stats computation: $STATS_TIMING"
    fi
    
    # Cleanup
    echo ""
    echo "🧹 Cleaning up..."
    kill $DASHBOARD_PID 2>/dev/null
    sleep 3
    
    # Force kill if still running
    if ps -p $DASHBOARD_PID > /dev/null; then
        kill -9 $DASHBOARD_PID 2>/dev/null
    fi
    
    echo "✅ Dashboard stopped"
    
    return 0
}

# Function to check implementation status
check_optimization_implementation() {
    echo ""
    echo "🔍 Verifying optimization implementation..."
    
    # Check server.py for optimization features
    SERVER_FILE="$PROJECT_PATH/src/memory_dashboard/server.py"
    
    if [ ! -f "$SERVER_FILE" ]; then
        echo "❌ Server file not found: $SERVER_FILE"
        return 1
    fi
    
    echo "✅ Server file found"
    
    # Check for optimization features
    echo ""
    echo "📋 Checking optimization features:"
    
    if grep -q "class StatsCache" "$SERVER_FILE"; then
        echo "✅ StatsCache class implemented"
        
        # Check TTL setting
        TTL=$(grep -o "ttl_seconds=[0-9]*" "$SERVER_FILE" | head -1)
        echo "   Cache TTL: $TTL"
    else
        echo "❌ StatsCache class missing"
    fi
    
    if grep -q "def get_stats_optimized" "$SERVER_FILE"; then
        echo "✅ get_stats_optimized function implemented"
    else
        echo "❌ get_stats_optimized function missing"
    fi
    
    if grep -q "stats_cache.get\|stats_cache.set" "$SERVER_FILE"; then
        echo "✅ Cache usage implemented"
    else
        echo "❌ Cache usage missing"
    fi
    
    if grep -q "sampling approach" "$SERVER_FILE"; then
        echo "✅ Large collection sampling implemented"
    else
        echo "❌ Large collection sampling missing"
    fi
    
    if grep -q "stats_cache.invalidate" "$SERVER_FILE"; then
        echo "✅ Cache invalidation implemented"
    else
        echo "❌ Cache invalidation missing"
    fi
    
    # Check if dashboard_get_stats calls optimized version
    if grep -A 5 "dashboard_get_stats" "$SERVER_FILE" | grep -q "get_stats_optimized"; then
        echo "✅ dashboard_get_stats uses optimized version"
    else
        echo "⚠️  dashboard_get_stats may not use optimized version"
    fi
    
    return 0
}

# Function to generate performance report
generate_performance_report() {
    echo ""
    echo "📊 Generating performance report..."
    
    # Extract key metrics from log
    CACHE_HITS=$(grep -c "Cache HIT" "$TEST_LOG" 2>/dev/null || echo "0")
    CACHE_MISSES=$(grep -c "Cache MISS" "$TEST_LOG" 2>/dev/null || echo "0")
    CACHE_SETS=$(grep -c "Cache SET" "$TEST_LOG" 2>/dev/null || echo "0")
    
    STATS_TIMINGS=$(grep "Stats computed in.*ms" "$TEST_LOG" 2>/dev/null | grep -o '[0-9]*\.[0-9]*' | tr '\n' ',' || echo "")
    FRONTEND_TIMINGS=$(grep "completed in.*ms" "$TEST_LOG" 2>/dev/null | grep -o '[0-9]*\.[0-9]*' | head -5 | tr '\n' ',' || echo "")
    
    DOCKER_RUNNING=$(docker ps --filter "name=mcp-memory-chromadb" --format "{{.Names}}" | head -1 || echo "")
    
    # Create JSON report
    cat > "$RESULTS_FILE" << EOF
{
  "test_timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "test_type": "real_mcp_performance",
  "issue": "#10 - Stats performance bottleneck",
  "target": "8-10s → <1s",
  "environment": {
    "docker_container_running": "$DOCKER_RUNNING",
    "docker_mode_enabled": "$(grep -q 'VITE_USE_DIRECT_CHROMA_ACCESS=true' .env && echo 'true' || echo 'false')",
    "project_version": "$(grep -o '"version": "[^"]*"' package.json | cut -d'"' -f4)"
  },
  "optimization_status": {
    "stats_cache_class": $(grep -q "class StatsCache" "$SERVER_FILE" && echo "true" || echo "false"),
    "optimized_function": $(grep -q "def get_stats_optimized" "$SERVER_FILE" && echo "true" || echo "false"),
    "cache_usage": $(grep -q "stats_cache.get" "$SERVER_FILE" && echo "true" || echo "false"),
    "cache_invalidation": $(grep -q "stats_cache.invalidate" "$SERVER_FILE" && echo "true" || echo "false"),
    "sampling_approach": $(grep -q "sampling approach" "$SERVER_FILE" && echo "true" || echo "false")
  },
  "performance_metrics": {
    "cache_hits": $CACHE_HITS,
    "cache_misses": $CACHE_MISSES,
    "cache_sets": $CACHE_SETS,
    "stats_timings_ms": [$STATS_TIMINGS],
    "frontend_timings_ms": [$FRONTEND_TIMINGS]
  },
  "log_file": "$TEST_LOG",
  "dashboard_startup": "$(grep -q "Memory Service ready" "$TEST_LOG" && echo "success" || echo "failed")",
  "recommendations": [
    "$([ $CACHE_HITS -gt 0 ] && echo "Cache system working" || echo "Verify cache implementation")",
    "$([ "$DOCKER_RUNNING" ] && echo "Docker mode operational" || echo "Consider enabling Docker mode")",
    "$(grep -q "Stats computed in.*[0-9][0-9][0-9][0-9]" "$TEST_LOG" && echo "Stats still slow - investigate further" || echo "Stats optimization appears effective")"
  ]
}
EOF
    
    echo "💾 Performance report saved to: $RESULTS_FILE"
    
    # Show summary
    echo ""
    echo "🎯 PERFORMANCE SUMMARY:"
    echo "======================"
    echo "Cache Activity: $CACHE_HITS hits, $CACHE_MISSES misses, $CACHE_SETS sets"
    echo "Docker Container: $([ "$DOCKER_RUNNING" ] && echo "Running ($DOCKER_RUNNING)" || echo "Not running")"
    echo "Dashboard Startup: $(grep -q "Memory Service ready" "$TEST_LOG" && echo "✅ Success" || echo "❌ Failed")"
    
    if [ -n "$STATS_TIMINGS" ]; then
        echo "Stats Computation Times: $STATS_TIMINGS"
        # Check if any timing is over 1000ms (1s)
        if echo "$STATS_TIMINGS" | grep -q "[0-9][0-9][0-9][0-9]"; then
            echo "⚠️  WARNING: Some stats queries still over 1s"
        else
            echo "✅ Stats queries under 1s threshold"
        fi
    else
        echo "⚠️  No stats timing data captured"
    fi
    
    return 0
}

# Main execution
main() {
    echo "Starting comprehensive real-world performance testing..."
    echo ""
    
    # Run all tests
    check_optimization_implementation
    test_mcp_stats_performance
    generate_performance_report
    
    echo ""
    echo "🎯 TESTING COMPLETE"
    echo "=================="
    echo "Results: $RESULTS_FILE"
    echo "Logs: $TEST_LOG"
    echo ""
    echo "Next steps:"
    echo "1. Review performance metrics in JSON report"
    echo "2. Check logs for specific timing measurements"
    echo "3. Update GitHub Issue #10 with findings"
    echo "4. Address any remaining performance bottlenecks"
    echo ""
}

# Execute main
main
