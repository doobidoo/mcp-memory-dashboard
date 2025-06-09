"""
ARCHIVED: Original server.py with performance bottleneck
Date: 2025-06-08
Issue: #10 - Stats queries taking 8-10 seconds

BOTTLENECK: get_stats() and dashboard_get_stats() methods call:
collection.get(include=['metadatas']) 
This loads ALL metadata from ALL documents to count unique tags.
"""

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
import time
import shutil
from datetime import datetime
from pathlib import Path
from collections import deque

# Initialize the server
server = Server("memory-dashboard")

# Query time tracking
query_times = deque(maxlen=50)  # Track last 50 query times

CHROMA_PATH = os.environ.get("MCP_MEMORY_CHROMA_PATH")
if not CHROMA_PATH:
    raise ValueError("MCP_MEMORY_CHROMA_PATH environment variable not set.")

# Backup path configuration
BACKUPS_PATH = os.environ.get("MCP_MEMORY_BACKUPS_PATH", os.path.join(os.path.dirname(CHROMA_PATH), "backups"))
os.makedirs(BACKUPS_PATH, exist_ok=True)

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

def track_query_time(func):
    """Decorator to track query execution times"""
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        query_time_ms = (end_time - start_time) * 1000
        query_times.append(query_time_ms)
        return result
    return wrapper

def get_average_query_time():
    """Calculate average query time from recent queries"""
    if not query_times:
        return 0
    return round(sum(query_times) / len(query_times), 2)

# SLOW METHOD - BOTTLENECK:
def get_stats_original():
    """Original slow implementation that causes 8-10 second delays"""
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
        
        return {
            "total_memories": total_memories,
            "unique_tags": len(unique_tags)
        }
    except Exception as e:
        print(f"Error getting stats from ChromaDB: {e}")
        return {
            "total_memories": 0,
            "unique_tags": 0,
            "error": str(e)
        }

# [Rest of the original file would continue here...]
