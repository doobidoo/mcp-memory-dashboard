#!/usr/bin/env python3
"""
Live test script to debug why query times show 0 in the dashboard
"""
import json
import subprocess
import sys
import time

def test_mcp_dashboard_tools():
    """Test the actual MCP tools that the dashboard should be using"""
    print("🔍 Testing Live MCP Dashboard Tools Communication")
    print("=" * 60)
    
    # Test the dashboard_check_health tool directly
    print("1️⃣ Testing dashboard_check_health...")
    
    try:
        # Try to call the MCP server directly using the same method as the dashboard
        # We'll use the uv command since that's what's in the config
        
        cmd = [
            '/opt/homebrew/bin/uv', '--directory', 
            '/Users/hkr/Documents/GitHub/mcp-memory-service', 
            'run', 'memory'
        ]
        
        print(f"   Command: {' '.join(cmd)}")
        
        # Create the MCP request
        mcp_requests = [
            # Initialize request
            {
                "jsonrpc": "2.0",
                "method": "initialize",
                "params": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {"tools": {}},
                    "clientInfo": {"name": "test-client", "version": "1.0.0"}
                },
                "id": 1
            },
            # Initialized notification
            {
                "jsonrpc": "2.0",
                "method": "notifications/initialized"
            },
            # Health check request
            {
                "jsonrpc": "2.0",
                "method": "tools/call",
                "params": {
                    "name": "dashboard_check_health",
                    "arguments": {}
                },
                "id": 2
            }
        ]
        
        # Start the MCP server process
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
        
        # Send all requests
        for request in mcp_requests:
            request_str = json.dumps(request) + '\n'
            print(f"   Sending: {request.get('method', 'notification')}")
            process.stdin.write(request_str)
            process.stdin.flush()
        
        # Read responses
        responses = []
        response_count = 0
        max_responses = 2  # initialize + tool call
        
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
                        print(f"   Response {response_count + 1}: {json.dumps(response, indent=2)}")
                        response_count += 1
                    except json.JSONDecodeError:
                        print(f"   Non-JSON output: {line}")
            except Exception as e:
                print(f"   Error reading response: {e}")
                break
        
        # Close the process
        process.stdin.close()
        process.terminate()
        process.wait(timeout=5)
        
        # Analyze the health check response
        health_response = None
        for response in responses:
            if response.get('id') == 2 and 'result' in response:
                health_response = response['result']
                break
        
        if health_response:
            print(f"\n✅ Health Check Response Found:")
            print(f"   Raw result: {health_response}")
            
            # Parse the text content
            if 'content' in health_response and len(health_response['content']) > 0:
                text_content = health_response['content'][0].get('text', '')
                try:
                    health_data = json.loads(text_content)
                    print(f"   Parsed health data: {health_data}")
                    
                    avg_query_time = health_data.get('avg_query_time', 'NOT FOUND')
                    print(f"   Average Query Time: {avg_query_time}")
                    
                    if avg_query_time == 0:
                        print(f"   🚨 ISSUE: Query time is 0 - no queries have been recorded yet")
                        return test_dashboard_search_tools()
                    else:
                        print(f"   ✅ Query time tracking is working: {avg_query_time}ms")
                        return True
                        
                except json.JSONDecodeError as e:
                    print(f"   ❌ Could not parse health data as JSON: {e}")
                    print(f"   Raw text: {text_content}")
                    return False
            else:
                print(f"   ❌ No text content in health response")
                return False
        else:
            print(f"   ❌ No health check response found")
            return False
            
    except Exception as e:
        print(f"   ❌ Error testing dashboard_check_health: {e}")
        return False

def test_dashboard_search_tools():
    """Test dashboard search tools to trigger query time recording"""
    print(f"\n2️⃣ Testing dashboard search tools to trigger query time recording...")
    
    try:
        cmd = [
            '/opt/homebrew/bin/uv', '--directory', 
            '/Users/hkr/Documents/GitHub/mcp-memory-service', 
            'run', 'memory'
        ]
        
        # Test a search operation
        mcp_requests = [
            # Initialize
            {
                "jsonrpc": "2.0",
                "method": "initialize",
                "params": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {"tools": {}},
                    "clientInfo": {"name": "test-client", "version": "1.0.0"}
                },
                "id": 1
            },
            # Initialized notification
            {
                "jsonrpc": "2.0",
                "method": "notifications/initialized"
            },
            # Search request to trigger query time recording
            {
                "jsonrpc": "2.0",
                "method": "tools/call",
                "params": {
                    "name": "dashboard_retrieve_memory",
                    "arguments": {"query": "test query", "n_results": 5}
                },
                "id": 2
            },
            # Health check after search
            {
                "jsonrpc": "2.0",
                "method": "tools/call",
                "params": {
                    "name": "dashboard_check_health",
                    "arguments": {}
                },
                "id": 3
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
        
        # Send requests
        for request in mcp_requests:
            request_str = json.dumps(request) + '\n'
            print(f"   Sending: {request.get('method', 'notification')} {request.get('params', {}).get('name', '')}")
            process.stdin.write(request_str)
            process.stdin.flush()
        
        # Read responses
        responses = []
        response_count = 0
        max_responses = 3  # initialize + search + health
        
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
                            print(f"   Search completed (ID 2)")
                        elif response.get('id') == 3:
                            print(f"   Health check after search (ID 3)")
                        
                        response_count += 1
                    except json.JSONDecodeError:
                        print(f"   Non-JSON: {line[:100]}...")
            except Exception as e:
                print(f"   Error: {e}")
                break
        
        process.stdin.close()
        process.terminate()
        process.wait(timeout=5)
        
        # Check the final health response
        final_health = None
        for response in responses:
            if response.get('id') == 3 and 'result' in response:
                final_health = response['result']
                break
        
        if final_health and 'content' in final_health:
            text_content = final_health['content'][0].get('text', '')
            try:
                health_data = json.loads(text_content)
                avg_query_time = health_data.get('avg_query_time', 0)
                print(f"   🎯 Query time after search: {avg_query_time}ms")
                
                if avg_query_time > 0:
                    print(f"   ✅ SUCCESS: Query time tracking is working!")
                    return True
                else:
                    print(f"   ❌ ISSUE: Query time still 0 after search")
                    return False
                    
            except json.JSONDecodeError:
                print(f"   ❌ Could not parse final health response")
                return False
        else:
            print(f"   ❌ No final health response")
            return False
            
    except Exception as e:
        print(f"   ❌ Error testing search tools: {e}")
        return False

def main():
    """Run the live MCP testing"""
    print("🚀 MCP Memory Dashboard - Live Query Time Testing")
    print("=" * 60)
    
    success = test_mcp_dashboard_tools()
    
    print(f"\n📋 CONCLUSION:")
    if success:
        print("✅ Query time tracking is working in the MCP server")
        print("📄 The issue might be:")
        print("   1. Dashboard not calling dashboard_check_health correctly")
        print("   2. Dashboard not refreshing stats after operations")
        print("   3. Frontend not parsing the response correctly")
    else:
        print("❌ Query time tracking is not working in the MCP server")
        print("📄 This confirms the issue is in the MCP server itself")

if __name__ == "__main__":
    main()
