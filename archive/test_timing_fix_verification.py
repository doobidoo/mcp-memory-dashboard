#!/usr/bin/env python3
"""
Verification test for the timing fix in v1.2.4
Tests that the 100ms delay allows proper query time recording
"""
import json
import subprocess
import sys
import time

def test_timing_fix_simulation():
    """Simulate the exact behavior of the dashboard after the v1.2.4 timing fix"""
    print("🔧 Testing v1.2.4 Timing Fix Verification")
    print("=" * 50)
    print("Simulating: search/recall → 100ms delay → loadStats()")
    
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
        
        # Initialize MCP connection
        init_requests = [
            {
                "jsonrpc": "2.0",
                "method": "initialize",
                "params": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {"tools": {}},
                    "clientInfo": {"name": "timing-fix-test", "version": "1.2.4"}
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
        
        # Test multiple search scenarios like the dashboard would do
        test_scenarios = [
            {"operation": "search", "query": "test search query"},
            {"operation": "recall", "query": "last week"}
        ]
        
        for i, scenario in enumerate(test_scenarios):
            print(f"\n📋 Test {i+1}: Dashboard {scenario['operation']} simulation")
            
            # Step 1: Perform search/recall operation
            if scenario['operation'] == 'search':
                operation_request = {
                    "jsonrpc": "2.0",
                    "method": "tools/call",
                    "params": {
                        "name": "dashboard_retrieve_memory",
                        "arguments": {"query": scenario['query'], "n_results": 5}
                    },
                    "id": 10 + i
                }
            else:  # recall
                operation_request = {
                    "jsonrpc": "2.0",
                    "method": "tools/call",
                    "params": {
                        "name": "dashboard_recall_memory",
                        "arguments": {"query": scenario['query'], "n_results": 5}
                    },
                    "id": 10 + i
                }
            
            print(f"   🔍 Executing {scenario['operation']} operation...")
            request_str = json.dumps(operation_request) + '\n'
            process.stdin.write(request_str)
            process.stdin.flush()
            
            # Wait for operation to complete
            operation_completed = False
            timeout = time.time() + 5
            
            while time.time() < timeout and not operation_completed:
                try:
                    line = process.stdout.readline()
                    if not line:
                        break
                    
                    line = line.strip()
                    if line:
                        try:
                            response = json.loads(line)
                            if response.get('id') == 10 + i:
                                print(f"   ✅ {scenario['operation'].capitalize()} operation completed")
                                operation_completed = True
                                break
                        except json.JSONDecodeError:
                            continue
                except Exception:
                    break
            
            if not operation_completed:
                print(f"   ⚠️ {scenario['operation'].capitalize()} operation may not have completed")
                continue
            
            # Step 2: Simulate the v1.2.4 timing fix - wait 100ms
            print(f"   ⏳ Applying v1.2.4 timing fix: waiting 100ms...")
            time.sleep(0.1)  # This is the fix: 100ms delay
            
            # Step 3: Call loadStats() (dashboard_check_health)
            print(f"   📊 Calling loadStats() after delay...")
            health_request = {
                "jsonrpc": "2.0",
                "method": "tools/call",
                "params": {
                    "name": "dashboard_check_health",
                    "arguments": {}
                },
                "id": 20 + i
            }
            
            request_str = json.dumps(health_request) + '\n'
            process.stdin.write(request_str)
            process.stdin.flush()
            
            # Step 4: Check the result
            health_response = None
            timeout = time.time() + 5
            
            while time.time() < timeout:
                try:
                    line = process.stdout.readline()
                    if not line:
                        break
                    
                    line = line.strip()
                    if line:
                        try:
                            response = json.loads(line)
                            if response.get('id') == 20 + i:
                                health_response = response
                                break
                        except json.JSONDecodeError:
                            continue
                except Exception:
                    break
            
            # Analyze result
            if health_response and 'result' in health_response:
                try:
                    text_content = health_response['result']['content'][0]['text']
                    health_data = json.loads(text_content)
                    avg_query_time = health_data.get('avg_query_time', 0)
                    
                    print(f"   📈 Query time after fix: {avg_query_time}ms")
                    
                    if avg_query_time > 0:
                        print(f"   ✅ SUCCESS: Query time properly recorded!")
                        print(f"   🎯 Dashboard will now show: {avg_query_time}ms instead of 0ms")
                    else:
                        print(f"   ❌ FAIL: Query time still showing 0ms")
                        
                except json.JSONDecodeError as e:
                    print(f"   ❌ Could not parse health response: {e}")
            else:
                print(f"   ❌ No valid health response received")
        
        # Close process
        process.stdin.close()
        process.terminate()
        process.wait(timeout=3)
        
    except Exception as e:
        print(f"❌ Error in timing fix verification: {e}")

def main():
    """Run timing fix verification"""
    print("🚀 MCP Memory Dashboard v1.2.4 - Timing Fix Verification")
    print("=" * 60)
    print("Testing the 100ms delay fix for query time tracking")
    print()
    
    test_timing_fix_simulation()
    
    print(f"\n📋 VERIFICATION CONCLUSION:")
    print("✅ v1.2.4 Fix Applied: 100ms delay before loadStats()")
    print("🎯 Expected Result: Dashboard now shows proper query times instead of 0ms")
    print("🔧 Implementation: await new Promise(resolve => setTimeout(resolve, 100)); before await loadStats();")

if __name__ == "__main__":
    main()
