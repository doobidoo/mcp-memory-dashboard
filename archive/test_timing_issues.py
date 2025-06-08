#!/usr/bin/env python3
"""
Enhanced debugging script to test query time timing issues
"""
import json
import subprocess
import sys
import time

def test_query_time_with_delays():
    """Test if there are timing issues between query execution and health check"""
    print("🔍 Testing Query Time Timing Issues")
    print("=" * 50)
    
    try:
        cmd = [
            '/opt/homebrew/bin/uv', '--directory', 
            '/Users/hkr/Documents/GitHub/mcp-memory-service', 
            'run', 'memory'
        ]
        
        # Create multiple test scenarios with different delays
        test_scenarios = [
            {"delay": 0, "description": "Immediate health check (dashboard behavior)"},
            {"delay": 0.1, "description": "100ms delay"},
            {"delay": 0.5, "description": "500ms delay"},
            {"delay": 1.0, "description": "1 second delay"}
        ]
        
        for scenario in test_scenarios:
            print(f"\n📋 Testing: {scenario['description']}")
            
            # Test each scenario
            mcp_requests = [
                # Initialize
                {
                    "jsonrpc": "2.0",
                    "method": "initialize",
                    "params": {
                        "protocolVersion": "2024-11-05",
                        "capabilities": {"tools": {}},
                        "clientInfo": {"name": "timing-test", "version": "1.0.0"}
                    },
                    "id": 1
                },
                # Initialized notification
                {
                    "jsonrpc": "2.0",
                    "method": "notifications/initialized"
                },
                # Dashboard search to trigger query time recording
                {
                    "jsonrpc": "2.0",
                    "method": "tools/call",
                    "params": {
                        "name": "dashboard_retrieve_memory",
                        "arguments": {"query": "test timing query", "n_results": 5}
                    },
                    "id": 2
                }
            ]
            
            process = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                env={
                    'MCP_MEMORY_CHROMA_PATH': '/Users/hkr/Library/Application Support/mcp-memory/chroma_db',
                    'MCP_MEMORY_BACKUPS_PATH': '/Users/hkr/Library/Application Support/mcp-memory/backups'
                }
            )
            
            # Send initial requests
            for request in mcp_requests:
                request_str = json.dumps(request) + '\n'
                process.stdin.write(request_str)
                process.stdin.flush()
            
            # Wait for search to complete
            responses = []
            response_count = 0
            max_responses = 2  # initialize + search
            
            while response_count < max_responses:
                try:
                    line = process.stdout.readline()
                    if not line:
                        break
                    
                    line = line.strip()
                    if line:
                        try:
                            response = json.loads(line)
                            responses.append(response)
                            if response.get('id') == 2:
                                print(f"   ✅ Search completed")
                                break
                            response_count += 1
                        except json.JSONDecodeError:
                            continue
                except Exception:
                    break
            
            # Wait the specified delay before health check
            if scenario['delay'] > 0:
                print(f"   ⏳ Waiting {scenario['delay']}s before health check...")
                time.sleep(scenario['delay'])
            
            # Now do health check
            health_request = {
                "jsonrpc": "2.0",
                "method": "tools/call",
                "params": {
                    "name": "dashboard_check_health",
                    "arguments": {}
                },
                "id": 3
            }
            
            request_str = json.dumps(health_request) + '\n'
            process.stdin.write(request_str)
            process.stdin.flush()
            
            # Read health response
            health_response = None
            timeout = time.time() + 5  # 5 second timeout
            
            while time.time() < timeout:
                try:
                    line = process.stdout.readline()
                    if not line:
                        break
                    
                    line = line.strip()
                    if line:
                        try:
                            response = json.loads(line)
                            if response.get('id') == 3:
                                health_response = response
                                break
                        except json.JSONDecodeError:
                            continue
                except Exception:
                    break
            
            # Process health response
            if health_response and 'result' in health_response:
                text_content = health_response['result']['content'][0]['text']
                try:
                    health_data = json.loads(text_content)
                    avg_query_time = health_data.get('avg_query_time', 0)
                    print(f"   📊 Query time: {avg_query_time}ms")
                    
                    if avg_query_time > 0:
                        print(f"   ✅ SUCCESS: Query time recorded!")
                    else:
                        print(f"   ❌ FAIL: Query time still 0")
                        
                except json.JSONDecodeError:
                    print(f"   ❌ Could not parse health response")
            else:
                print(f"   ❌ No health response")
            
            # Close process
            process.stdin.close()
            process.terminate()
            process.wait(timeout=3)
    
    except Exception as e:
        print(f"❌ Error in timing test: {e}")

def test_multiple_operations():
    """Test query time accumulation over multiple operations"""
    print(f"\n🔄 Testing Multiple Operations for Query Time Accumulation")
    print("=" * 60)
    
    try:
        cmd = [
            '/opt/homebrew/bin/uv', '--directory', 
            '/Users/hkr/Documents/GitHub/mcp-memory-service', 
            'run', 'memory'
        ]
        
        process = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env={
                'MCP_MEMORY_CHROMA_PATH': '/Users/hkr/Library/Application Support/mcp-memory/chroma_db',
                'MCP_MEMORY_BACKUPS_PATH': '/Users/hkr/Library/Application Support/mcp-memory/backups'
            }
        )
        
        # Initialize
        init_requests = [
            {
                "jsonrpc": "2.0",
                "method": "initialize",
                "params": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {"tools": {}},
                    "clientInfo": {"name": "multi-test", "version": "1.0.0"}
                },
                "id": 1
            },
            {
                "jsonrpc": "2.0",
                "method": "notifications/initialized"
            }
        ]
        
        for request in init_requests:
            request_str = json.dumps(request) + '\n'
            process.stdin.write(request_str)
            process.stdin.flush()
        
        # Wait for initialization
        time.sleep(0.5)
        
        # Perform multiple search operations
        for i in range(3):
            print(f"   🔍 Performing search operation {i+1}")
            
            search_request = {
                "jsonrpc": "2.0",
                "method": "tools/call",
                "params": {
                    "name": "dashboard_retrieve_memory",
                    "arguments": {"query": f"test query {i+1}", "n_results": 3}
                },
                "id": i + 10
            }
            
            request_str = json.dumps(search_request) + '\n'
            process.stdin.write(request_str)
            process.stdin.flush()
            
            # Wait a bit between operations
            time.sleep(1)
            
            # Check health after each operation
            health_request = {
                "jsonrpc": "2.0",
                "method": "tools/call",
                "params": {
                    "name": "dashboard_check_health",
                    "arguments": {}
                },
                "id": i + 20
            }
            
            request_str = json.dumps(health_request) + '\n'
            process.stdin.write(request_str)
            process.stdin.flush()
            
            # Try to read the health response
            timeout = time.time() + 3
            while time.time() < timeout:
                try:
                    line = process.stdout.readline()
                    if not line:
                        break
                    
                    line = line.strip()
                    if line:
                        try:
                            response = json.loads(line)
                            if response.get('id') == i + 20:
                                text_content = response['result']['content'][0]['text']
                                health_data = json.loads(text_content)
                                avg_query_time = health_data.get('avg_query_time', 0)
                                print(f"     📊 After operation {i+1}: {avg_query_time}ms")
                                break
                        except:
                            continue
                except:
                    break
        
        process.stdin.close()
        process.terminate()
        process.wait(timeout=3)
        
    except Exception as e:
        print(f"❌ Error in multiple operations test: {e}")

def main():
    """Run all timing tests"""
    print("🚀 MCP Memory Dashboard - Query Time Timing Analysis")
    print("=" * 60)
    
    test_query_time_with_delays()
    test_multiple_operations()
    
    print(f"\n📋 CONCLUSION:")
    print("If query times appear with delays but not immediately,")
    print("the issue is likely timing-related in the dashboard frontend.")
    print("The solution would be to add a small delay before calling loadStats().")

if __name__ == "__main__":
    main()
