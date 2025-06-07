#!/usr/bin/env python3

import asyncio
import json
import sys
from mcp.server.models import InitializationOptions
import mcp.types as types
from mcp.server import NotificationOptions, Server
import mcp.server.stdio

# Minimal test server
class TestServer:
    def __init__(self):
        self.server = Server("test-server")
        self.register_handlers()

    def register_handlers(self):
        @self.server.list_tools()
        async def handle_list_tools():
            return [
                types.Tool(
                    name="simple_test",
                    description="Simple test tool",
                    inputSchema={
                        "type": "object",
                        "properties": {},
                    }
                )
            ]
        
        @self.server.call_tool()
        async def handle_call_tool(name: str, arguments: dict | None):
            print(f"Tool call received: {name}", file=sys.stderr)
            
            if name == "simple_test":
                result = {"message": "Hello from test tool!", "timestamp": "2024-01-01"}
                print(f"Returning result: {result}", file=sys.stderr)
                return [types.TextContent(type="text", text=json.dumps(result))]
            else:
                return [types.TextContent(type="text", text=f"Unknown tool: {name}")]

async def main():
    test_server = TestServer()
    
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await test_server.server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="test-server",
                server_version="0.1.0",
                capabilities=test_server.server.get_capabilities(
                    notification_options=NotificationOptions()
                ),
            ),
        )

if __name__ == "__main__":
    asyncio.run(main())
