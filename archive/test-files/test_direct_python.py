#!/usr/bin/env python3

import asyncio
import json
import sys
import time
import os

async def test_memory_service_direct():
    """Test the memory service using direct Python execution"""
    
    print("🧪 Testing MCP Memory Service with direct Python...")
    
    # Use the same Python that's running this script
    python_path = sys.executable
    script_path = '/Users/hkr/Documents/GitHub/mcp-memory-service/src/mcp_memory_service/server.py'
    
    print(f"Using Python: {python_path}")
    print(f"Running script: {script_path}")
    
    # Spawn the memory service directly
    proc = await asyncio.create_subprocess_exec(
        python_path, script_path,
        cwd='/Users/hkr/Documents/GitHub/mcp-memory-service',
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        env={
            **os.environ,
            'MCP_MEMORY_CHROMA_PATH': '/Users/hkr/Library/Mobile Documents/com~apple~CloudDocs/AI/claude-memory/chroma_db',
            'MCP_MEMORY_BACKUPS_PATH': '/Users/hkr/Library/Mobile Documents/com~apple~CloudDocs/AI/claude-memory/backups',
            'LOG_LEVEL': 'INFO',
            'PYTHONPATH': '/Users/hkr/Documents/GitHub/mcp-memory-service/src'
        }
    )
    
    print("✅ Process started")
    
    # Read stderr in background to see debug messages
    async def read_stderr():
        while True:
            line = await proc.stderr.readline()
            if not line:
                break
            line_str = line.decode().strip()
            print(f"🔍 {line_str}")
            
            # Look for our key debug messages
            if "TOOL CALL INTERCEPTED" in line_str:
                print("🎯 SUCCESS: Tool call reached our handler!")
            elif "Server capabilities registered successfully" in line_str:
                print("✅ SUCCESS: Handlers registered properly!")
            elif "Handler registration issue" in line_str:
                print("❌ PROBLEM: Handler registration failed!")
    
    stderr_task = asyncio.create_task(read_stderr())
    
    try:
        # Send initialization
        init_request = {
            "jsonrpc": "2.0",
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "clientInfo": {"name": "direct-python-test", "version": "0.1.0"}
            },
            "id": 1
        }
        
        print("📤 Sending initialization...")
        init_json = json.dumps(init_request) + '\n'
        proc.stdin.write(init_json.encode())
        await proc.stdin.drain()
        
        # Wait for init response
        response_line = await asyncio.wait_for(proc.stdout.readline(), timeout=15.0)
        response = response_line.decode().strip()
        print(f"📥 Init response: {response}")
        
        # Parse init response
        try:
            init_response = json.loads(response)
            if init_response.get('id') == 1:
                print("✅ Initialization successful!")
            else:
                print(f"❌ Unexpected init response: {init_response}")
                return False
        except json.JSONDecodeError:
            print(f"❌ Invalid JSON in init response: {response}")
            return False
        
        # Small delay to let initialization complete
        await asyncio.sleep(1.0)
        
        # Send tool call
        tool_request = {
            "jsonrpc": "2.0",
            "method": "tools/call",
            "params": {
                "name": "dashboard_check_health",
                "arguments": {}
            },
            "id": 2
        }
        
        print("📤 Sending dashboard_check_health tool call...")
        tool_json = json.dumps(tool_request) + '\n'
        proc.stdin.write(tool_json.encode())
        await proc.stdin.drain()
        
        # Wait for tool response with timeout
        try:
            print("⏳ Waiting for tool response...")
            tool_response_line = await asyncio.wait_for(proc.stdout.readline(), timeout=10.0)
            tool_response = tool_response_line.decode().strip()
            print(f"📥 Tool response: {tool_response}")
            
            try:
                parsed_response = json.loads(tool_response)
                if parsed_response.get('id') == 2:
                    print("🎉 TOOL CALL SUCCESSFUL!")
                    
                    # Check if we got the expected health data
                    if parsed_response.get('result'):
                        result_data = parsed_response['result'][0]['text']
                        health_data = json.loads(result_data)
                        print(f"📊 Health Status: {health_data}")
                        
                    return True
                else:
                    print(f"❌ Unexpected tool response: {parsed_response}")
                    return False
            except json.JSONDecodeError:
                print(f"❌ Invalid JSON in tool response: {tool_response}")
                return False
                
        except asyncio.TimeoutError:
            print("❌ TIMEOUT waiting for tool response!")
            print("🔍 This means tool calls are NOT reaching our handler")
            return False
            
    except Exception as e:
        print(f"❌ Test error: {str(e)}")
        return False
    finally:
        # Cleanup
        stderr_task.cancel()
        proc.terminate()
        await proc.wait()

if __name__ == "__main__":
    print("🔧 Direct Python MCP Memory Service Test")
    print("This bypasses UV and tests the server directly")
    print("")
    
    result = asyncio.run(test_memory_service_direct())
    
    if result:
        print("\n🎉 DIRECT PYTHON TEST PASSED!")
        print("✅ Tool execution is working!")
        print("✅ Your dashboard integration should work!")
        sys.exit(0)
    else:
        print("\n💥 DIRECT PYTHON TEST FAILED!")
        print("❌ Tool calls are not reaching the handler")
        print("🔧 Check the debug messages above for clues")
        sys.exit(1)
