#!/usr/bin/env python3

import asyncio
import json
import sys
import time

async def test_memory_service():
    """Test the memory service directly"""
    
    print("🧪 Testing MCP Memory Service directly...")
    
    # Spawn the memory service
    proc = await asyncio.create_subprocess_exec(
        'uv', 'run', 'memory',
        cwd='/Users/hkr/Documents/GitHub/mcp-memory-service',
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        env={
            'MCP_MEMORY_CHROMA_PATH': '/Users/hkr/Library/Mobile Documents/com~apple~CloudDocs/AI/claude-memory/chroma_db',
            'MCP_MEMORY_BACKUPS_PATH': '/Users/hkr/Library/Mobile Documents/com~apple~CloudDocs/AI/claude-memory/backups',
            'LOG_LEVEL': 'INFO'
        }
    )
    
    print("✅ Process started")
    
    # Read stderr in background
    async def read_stderr():
        while True:
            line = await proc.stderr.readline()
            if not line:
                break
            print(f"🔍 {line.decode().strip()}")
    
    stderr_task = asyncio.create_task(read_stderr())
    
    # Send initialization
    init_request = {
        "jsonrpc": "2.0",
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {"tools": {}},
            "clientInfo": {"name": "direct-test", "version": "0.1.0"}
        },
        "id": 1
    }
    
    print("📤 Sending initialization...")
    init_json = json.dumps(init_request) + '\n'
    proc.stdin.write(init_json.encode())
    await proc.stdin.drain()
    
    # Wait for init response
    response_line = await proc.stdout.readline()
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
    
    # Small delay
    await asyncio.sleep(0.5)
    
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
    
    print("📤 Sending tool call...")
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
                print("🎉 Tool call successful!")
                return True
            else:
                print(f"❌ Unexpected tool response: {parsed_response}")
                return False
        except json.JSONDecodeError:
            print(f"❌ Invalid JSON in tool response: {tool_response}")
            return False
            
    except asyncio.TimeoutError:
        print("❌ TIMEOUT waiting for tool response!")
        print("This indicates tool calls are not being processed")
        return False
    finally:
        # Cleanup
        stderr_task.cancel()
        proc.terminate()
        await proc.wait()

if __name__ == "__main__":
    result = asyncio.run(test_memory_service())
    if result:
        print("\n🎉 DIRECT TEST PASSED!")
        sys.exit(0)
    else:
        print("\n💥 DIRECT TEST FAILED!")
        sys.exit(1)
