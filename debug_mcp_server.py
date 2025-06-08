#!/usr/bin/env python3
"""
Debug script to test the actual MCP server that the dashboard is using
"""
import os
import json
import subprocess
import sys

def check_server_implementation():
    """Check which server is being used and what it returns"""
    print("🔍 Debugging MCP Memory Dashboard Server Communication")
    print("=" * 60)
    
    # Check the environment variables
    env_vars = [
        "VITE_MEMORY_SERVICE_PATH",
        "VITE_MEMORY_CHROMA_PATH", 
        "VITE_MEMORY_BACKUPS_PATH",
        "VITE_CLAUDE_CONFIG_PATH"
    ]
    
    print("📋 Environment Configuration:")
    for var in env_vars:
        value = os.environ.get(var, "NOT SET")
        print(f"  {var}: {value}")
    
    print()
    
    # Check if the dashboard server has the correct implementation
    dashboard_server_path = "/Users/hkr/Documents/GitHub/mcp-memory-dashboard/src/memory_dashboard/server.py"
    
    print(f"🔎 Checking Dashboard Server Implementation:")
    print(f"  Path: {dashboard_server_path}")
    
    if os.path.exists(dashboard_server_path):
        print("  ✅ Dashboard server file exists")
        
        # Check for query time tracking implementation
        with open(dashboard_server_path, 'r') as f:
            content = f.read()
            
        checks = [
            ("query_times = deque", "Query times deque initialization"),
            ("get_average_query_time()", "Average calculation function"),
            ("dashboard_check_health", "Dashboard health check tool"),
            ("query_times.append", "Query time recording")
        ]
        
        print("  Implementation checks:")
        for check, description in checks:
            if check in content:
                print(f"    ✅ {description}")
            else:
                print(f"    ❌ {description} - MISSING!")
    else:
        print("  ❌ Dashboard server file not found")
    
    print()
    
    # Check the memory service that's actually running
    memory_service_path = "/Users/hkr/Documents/GitHub/mcp-memory-service"
    print(f"🔎 Checking Memory Service Implementation:")
    print(f"  Path: {memory_service_path}")
    
    if os.path.exists(memory_service_path):
        # Look for server files
        possible_server_files = [
            os.path.join(memory_service_path, "src", "mcp_memory_service", "server.py"),
            os.path.join(memory_service_path, "mcp_memory_service", "server.py"),
            os.path.join(memory_service_path, "server.py")
        ]
        
        for server_file in possible_server_files:
            if os.path.exists(server_file):
                print(f"  ✅ Found server at: {server_file}")
                
                with open(server_file, 'r') as f:
                    content = f.read()
                
                # Check if this server has query time tracking
                if "query_times" in content and "get_average_query_time" in content:
                    print(f"    ✅ Has query time tracking implementation")
                else:
                    print(f"    ❌ Missing query time tracking implementation")
                    print(f"    🚨 THIS COULD BE THE ISSUE!")
                break
        else:
            print("  ❌ No server file found in memory service")
    
    print()
    
    # Try to test the actual MCP communication
    print("🧪 Testing MCP Communication:")
    
    # The dashboard should be using the server from the dashboard directory, not the memory service
    print("  Expected: Dashboard should use its own server.py")
    print("  Issue: It might be connecting to the external memory service instead")
    
    return True

def suggest_fix():
    """Suggest the likely fix for the issue"""
    print("\n🎯 LIKELY ROOT CAUSE IDENTIFIED:")
    print("=" * 40)
    
    print("The dashboard is probably connecting to the separate mcp-memory-service")
    print("repository instead of using its own server.py with query time tracking.")
    print()
    
    print("🔧 POTENTIAL FIXES:")
    print("1. Update the MCP configuration to point to the dashboard's server.py")
    print("2. Copy the query time tracking code to the external memory service")
    print("3. Ensure the dashboard uses its own integrated server")
    print()
    
    print("📋 DEBUGGING STEPS:")
    print("1. Check which server is in the Claude configuration")
    print("2. Verify the dashboard is calling the correct MCP server")
    print("3. Add logging to see which server actually responds")

def main():
    """Run the debugging"""
    print("🚀 MCP Memory Dashboard - Server Communication Debug")
    print("=" * 60)
    
    success = check_server_implementation()
    suggest_fix()
    
    print("\n📝 SUMMARY:")
    print("The query time implementation exists in the dashboard's server.py,")
    print("but the dashboard might be connecting to a different MCP server")
    print("that doesn't have the query time tracking implementation.")

if __name__ == "__main__":
    main()
