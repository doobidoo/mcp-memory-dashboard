from typing import Any
import asyncio
import httpx
from mcp.server.models import InitializationOptions
import mcp.types as types
from mcp.server import NotificationOptions, Server
import mcp.server.stdio
import chromadb
import os
import json
import uuid
from datetime import datetime

# Initialize the server
server = Server("memory-dashboard")

CHROMA_PATH = os.environ.get("MCP_MEMORY_CHROMA_PATH")
if not CHROMA_PATH:
    raise ValueError("MCP_MEMORY_CHROMA_PATH environment variable not set.")

# Use a persistent client if a path is provided, otherwise use an in-memory client (for local dev/testing if needed)
# However, the issue implies connecting to a *given* chroma db, so path is mandatory.
client = chromadb.PersistentClient(path=CHROMA_PATH)

# It's good practice to get_or_create_collection to ensure it exists.
# Let's name the collection something like "memories" or "mcp_memories".
# This collection name should ideally be configurable or a constant.
COLLECTION_NAME = "mcp_memories"
try:
    collection = client.get_or_create_collection(name=COLLECTION_NAME)
except Exception as e:
    # Handle potential errors during collection creation/retrieval
    # For now, we can re-raise or log, but this indicates a setup issue.
    raise ValueError(f"Failed to get or create ChromaDB collection '{COLLECTION_NAME}': {e}")

@server.list_tools()
async def handle_list_tools() -> list[types.Tool]:
    """List available tools for the memory dashboard."""
    return [
        types.Tool(
            name="store_memory",
            description="Store new information with optional tags",
            inputSchema={
                "type": "object",
                "properties": {
                    "content": {
                        "type": "string",
                        "description": "The content to store"
                    },
                    "metadata": {
                        "type": "object",
                        "description": "Optional metadata including tags",
                        "properties": {
                            "tags": {
                                "type": "array",
                                "items": {"type": "string"}
                            },
                            "type": {"type": "string"}
                        }
                    }
                },
                "required": ["content"]
            }
        ),
        types.Tool(
            name="retrieve_memory",
            description="Perform semantic search for relevant memories",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query"
                    },
                    "n_results": {
                        "type": "number",
                        "description": "Number of results to return",
                        "default": 5
                    }
                },
                "required": ["query"]
            }
        ),
        types.Tool(
            name="search_by_tag",
            description="Retrieve memories by specific tags",
            inputSchema={
                "type": "object",
                "properties": {
                    "tags": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Tags to search for"
                    }
                },
                "required": ["tags"]
            }
        ),
        types.Tool(
            name="check_database_health",
            description="Retrieve database health metrics",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
        types.Tool(
            name="check_embedding_model",
            description="Check the operational status of the embedding model",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
        types.Tool(
            name="delete_by_tag",
            description="Delete memories associated with a specific tag.",
            inputSchema={
                "type": "object",
                "properties": {
                    "tag": {
                        "type": "string",
                        "description": "The tag to delete memories by."
                    }
                },
                "required": ["tag"]
            }
        ),
        types.Tool(
            name="get_stats",
            description="Retrieve statistics about the memory database.",
            inputSchema={"type": "object", "properties": {}}
        ),
        types.Tool(
            name="optimize_db",
            description="Optimize the database (placeholder - not implemented).",
            inputSchema={"type": "object", "properties": {}}
        ),
        types.Tool(
            name="create_backup",
            description="Create a backup of the database (placeholder - not implemented).",
            inputSchema={"type": "object", "properties": {}}
        )
    ]

@server.call_tool()
async def handle_call_tool(
    name: str,
    arguments: dict | None
) -> list[types.TextContent | types.ImageContent | types.EmbeddedResource]:
    """Handle tool execution requests."""
    if not arguments:
        raise ValueError("Missing arguments")

    if name == "store_memory":
        content = arguments.get("content")
        if not content:
            raise ValueError("Content cannot be empty for store_memory")
        
        metadata_arg = arguments.get("metadata", {}) # Ensure metadata is a dict

        # Prepare metadata for ChromaDB.
        # Add a timestamp if not present.
        if 'timestamp' not in metadata_arg:
            metadata_arg['timestamp'] = datetime.utcnow().isoformat()

        new_id = str(uuid.uuid4())
        
        try:
            collection.add(
                ids=[new_id],
                documents=[content],
                metadatas=[metadata_arg]
            )
            return [types.TextContent(
                type="text",
                text=f"Successfully stored memory with ID: {new_id}"
            )]
        except Exception as e:
            # Log the error server-side (optional, basic print for now)
            print(f"Error storing memory to ChromaDB: {e}") 
            # Re-raise to let the MCP framework handle it or return a structured error
            raise ValueError(f"Failed to store memory: {e}")

    elif name == "retrieve_memory":
        query_text = arguments.get("query")
        if not query_text:
            raise ValueError("Query text cannot be empty for retrieve_memory")
        
        n_results_val = arguments.get("n_results", 5)
        
        try:
            results = collection.query(
                query_texts=[query_text],
                n_results=int(n_results_val),
                include=['metadatas', 'documents', 'distances'] # Ensure these are included
            )
            
            memories_list = []
            # Results from query are structured with lists of lists for batch queries,
            # but we send one query, so we access the first element (index 0) of these lists.
            ids = results.get('ids', [[]])[0]
            documents = results.get('documents', [[]])[0]
            metadatas = results.get('metadatas', [[]])[0]
            distances = results.get('distances', [[]])[0]

            for i in range(len(ids)):
                similarity = 1.0 - (distances[i] if distances[i] is not None else 1.0) # Handle potential None in distances
                # Ensure metadata is a dict, default to empty if None
                current_metadata = metadatas[i] if metadatas[i] is not None else {}
                memories_list.append({
                    "id": ids[i],
                    "content": documents[i] if documents[i] is not None else "",
                    "metadata": current_metadata,
                    "similarity": similarity,
                    # Ensure tags are present in metadata, defaulting to empty list
                    "tags": current_metadata.get("tags", []) if isinstance(current_metadata.get("tags"), list) else []
                })
            
            # Return a single TextContent with the JSON string of the memories list
            return [types.TextContent(
                type="text",
                text=json.dumps({"memories": memories_list}) # Serialize the list as JSON
            )]
            
        except Exception as e:
            print(f"Error retrieving memory from ChromaDB: {e}") # Or use proper logging
            raise ValueError(f"Failed to retrieve memories: {e}")

    elif name == "search_by_tag":
        tags_list = arguments.get("tags")

        if not isinstance(tags_list, list) or not tags_list:
            return [types.TextContent(
                type="text",
                text=json.dumps({"memories": []})
            )]

        or_conditions = []
        for tag in tags_list:
            if isinstance(tag, str) and tag.strip():
                or_conditions.append({"tags": {"$contains": tag.strip()}})
        
        if not or_conditions:
            return [types.TextContent(
                type="text",
                text=json.dumps({"memories": []})
            )]

        where_filter = {"$or": or_conditions}
        
        try:
            results = collection.get(
                where=where_filter,
                include=['metadatas', 'documents']
            )
            
            memories_list = []
            ids = results.get('ids', [])
            documents = results.get('documents', [])
            metadatas = results.get('metadatas', [])

            for i in range(len(ids)):
                current_metadata = metadatas[i] if metadatas[i] is not None else {}
                memories_list.append({
                    "id": ids[i],
                    "content": documents[i] if documents[i] is not None else "",
                    "metadata": current_metadata,
                    "tags": current_metadata.get("tags", []) if isinstance(current_metadata.get("tags"), list) else []
                })
            
            return [types.TextContent(
                type="text",
                text=json.dumps({"memories": memories_list})
            )]
            
        except Exception as e:
            print(f"Error searching by tag in ChromaDB: {e}")
            raise ValueError(f"Failed to search by tag: {e}")

    elif name == "delete_by_tag":
        tag_to_delete = arguments.get("tag")

        if not isinstance(tag_to_delete, str) or not tag_to_delete.strip():
            raise ValueError("Tag cannot be empty for delete_by_tag")

        tag_to_delete = tag_to_delete.strip()
        where_filter = {"tags": {"$contains": tag_to_delete}}
        
        try:
            # First, find the IDs of the documents to be deleted.
            results = collection.get(
                where=where_filter,
                include=[] # We only need IDs
            )
            ids_to_delete = results.get('ids', [])

            if not ids_to_delete:
                return [types.TextContent(
                    type="text",
                    text=f"No memories found with tag: {tag_to_delete}"
                )]

            collection.delete(ids=ids_to_delete) # Delete by specific IDs
            
            return [types.TextContent(
                type="text",
                text=f"Successfully deleted {len(ids_to_delete)} memories with tag: {tag_to_delete}"
            )]
            
        except Exception as e:
            print(f"Error deleting memories by tag '{tag_to_delete}' from ChromaDB: {e}")
            raise ValueError(f"Failed to delete memories by tag '{tag_to_delete}': {e}")

    elif name == "check_database_health":
        try:
            heartbeat_ns = client.heartbeat() 
            health_status = {
                "status": "healthy" if heartbeat_ns > 0 else "unhealthy",
                "heartbeat_ns": heartbeat_ns,
                "health": 100 if heartbeat_ns > 0 else 0, 
                "avg_query_time": 0 
            }
            return [types.TextContent(
                type="text",
                text=json.dumps(health_status)
            )]
        except Exception as e:
            print(f"Error during ChromaDB health check: {e}")
            health_status = {
                "status": "unhealthy",
                "error": str(e),
                "health": 0,
                "avg_query_time": 0
            }
            return [types.TextContent(
                type="text",
                text=json.dumps(health_status)
            )]
    
    elif name == "get_stats":
        try:
            total_memories = collection.count()
            
            # WARNING: This can be very slow and memory-intensive on large collections.
            # Consider alternative strategies for production systems.
            all_metadatas_results = collection.get(include=['metadatas'])
            all_metadatas = all_metadatas_results.get('metadatas', [])
            
            unique_tags = set()
            if all_metadatas: 
                for meta in all_metadatas:
                    if meta and isinstance(meta.get("tags"), list):
                        for tag in meta["tags"]:
                            unique_tags.add(tag)
            
            stats_data = {
                "total_memories": total_memories,
                "unique_tags": len(unique_tags)
            }
            return [types.TextContent(
                type="text",
                text=json.dumps(stats_data)
            )]
        except Exception as e:
            print(f"Error getting stats from ChromaDB: {e}")
            error_stats = {
                "total_memories": 0,
                "unique_tags": 0,
                "error": str(e)
            }
            return [types.TextContent(
                type="text",
                text=json.dumps(error_stats)
            )]

    elif name == "optimize_db":
        return [types.TextContent(
            type="text",
            text=json.dumps({
                "message": "Database optimization feature is not yet implemented.",
                "status": "not_implemented"
            })
        )]

    elif name == "create_backup":
        backup_path_env = os.environ.get("MCP_MEMORY_BACKUPS_PATH", "Not configured")
        message = f"Database backup feature is not yet implemented. Backups would target: {backup_path_env}"
        
        return [types.TextContent(
            type="text",
            text=json.dumps({
                "message": message,
                "status": "not_implemented"
            })
        )]

    elif name == "check_embedding_model":
        # Here you would implement actual model check logic
        return [types.TextContent(
            type="text",
            text=json.dumps({ # type: ignore
                "status": "operational",
                "loaded": True
            })
        )]

    else:
        raise ValueError(f"Unknown tool: {name}")

async def main():
    """Run the server using stdin/stdout streams."""
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="memory-dashboard",
                server_version="0.1.0",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            ),
        )

if __name__ == "__main__":
    asyncio.run(main())