#!/usr/bin/env python3
"""
Ultra-minimal MCP server to test basic tool execution without any ChromaDB dependencies
"""

import asyncio
import json
import sys
import logging
from mcp.server.models import InitializationOptions
import mcp.types as types
from mcp.server import NotificationOptions, Server
import mcp.server.stdio

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger(__name__)

class UltraMinimalServer:
    def __init__(self):
        self.server = Server("ultra-minimal-test")
        self.register_handlers()
        logger.info("Ultra-minimal server initialized")

    def register_handlers(self):
        @self.server.list_tools()
        async def handle_list_tools():
            logger.info("=== LIST_TOOLS CALLED ===")
            tools = [
                types.Tool(
                    name="ultra_simple_test",
                    description="Ultra simple test tool with zero dependencies",
                    inputSchema={"type": "object", "properties": {}}
                )
            ]
            logger.info(f"Returning {len(tools)} tools")
            return tools
        
        @self.server.call_tool()
        async def handle_call_tool(name: str, arguments: dict | None):
            logger.info(f"=== TOOL CALL RECEIVED: {name} ===")
            logger.info(f"Arguments: {arguments}")
            
            if name == "ultra_simple_test":
                logger.info("=== EXECUTING ULTRA SIMPLE TEST ===")
                result = {
                    "status": "success",
                    "message": "Ultra simple test executed!",
                    "server": "ultra-minimal"
                }
                response_text = json.dumps(result)
                logger.info(f"Returning: {response_text}")
                return [types.TextContent(type="text", text=response_text)]
            else:
                logger.warning(f"Unknown tool: {name}")
                return [types.TextContent(type="text", text=f"Unknown tool: {name}")]

async def main():
    logger.info("Starting ultra-minimal server...")
    
    server = UltraMinimalServer()
    
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        logger.info("Server started and ready for communication")
        await server.server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="ultra-minimal-test",
                server_version="0.1.0",
                capabilities=server.server.get_capabilities(
                    notification_options=NotificationOptions()
                ),
            ),
        )

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Shutting down...")
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}")
        sys.exit(1)
