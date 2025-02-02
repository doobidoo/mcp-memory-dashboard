import { contextBridge, ipcRenderer } from 'electron';
import fs from 'fs';
import { promisify } from 'util';
import type { MemoryService } from '../src/services/memory';

const readFileAsync = promisify(fs.readFile);
const existsAsync = promisify(fs.exists);

interface MCPToolRequest {
  server_name: string;
  tool_name: string;
  arguments: Record<string, unknown>;
}

console.log('Preload script starting...');

// Create MCP client for memory service
const mcpClient = {
  use_mcp_tool: async ({ server_name, tool_name, arguments: args }: MCPToolRequest) => {
    try {
      console.log(`Calling MCP tool: ${server_name}/${tool_name}`, args);
      const result = await ipcRenderer.invoke('mcp:use-tool', {
        server_name,
        tool_name,
        arguments: args
      });
      return result;
    } catch (error) {
      console.error(`MCP tool error (${server_name}/${tool_name}):`, error);
      throw error;
    }
  }
};

// Initialize memory service with error handling
let memoryService: MemoryService | null = null;
try {
  console.log('Initializing memory service...');
  const { MemoryService } = require('../src/services/memory');
  memoryService = new MemoryService(mcpClient);
  console.log('Memory service initialized successfully');
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.error('Failed to initialize memory service:', errorMessage);
  ipcRenderer.send('service-error', { 
    service: 'memory', 
    error: errorMessage 
  });
}

// Check if memory service is available
if (!memoryService) {
  console.error('Memory service not available');
  ipcRenderer.send('service-status', { memory: false });
} else {
  ipcRenderer.send('service-status', { memory: true });
}

// Expose APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  memory: memoryService ? {
    store_memory: async (content: string, metadata?: any) => {
      console.log('Storing memory:', { content, metadata });
      return memoryService!.store_memory({ content, metadata });
    },
    retrieve_memory: async (query: string, n_results?: number) => {
      console.log('Retrieving memory:', { query, n_results });
      return memoryService!.retrieve_memory({ query, n_results });
    },
    search_by_tag: async (tags: string[]) => {
      console.log('Searching by tags:', tags);
      return memoryService!.search_by_tag({ tags });
    },
    delete_by_tag: async (tag: string) => {
      console.log('Deleting by tag:', tag);
      return memoryService!.delete_by_tag({ tag });
    },
    check_database_health: async () => {
      console.log('Checking database health');
      return memoryService!.check_database_health();
    },
    get_stats: async () => {
      console.log('Getting stats');
      return memoryService!.get_stats();
    },
    optimize_db: async () => {
      console.log('Optimizing database');
      return memoryService!.optimize_db();
    },
    create_backup: async () => {
      console.log('Creating backup');
      return memoryService!.create_backup();
    }
  } : null,
  fs: {
    readFile: async (path: string, options?: { encoding?: BufferEncoding }) => {
      console.log('readFile called with path:', path);
      try {
        const result = await readFileAsync(path, options);
        console.log('readFile successful');
        return result;
      } catch (error) {
        console.error('readFile error:', error);
        throw error;
      }
    },
    exists: async (path: string) => {
      console.log('exists called with path:', path);
      try {
        const exists = await existsAsync(path);
        console.log('exists check result:', exists);
        return exists;
      } catch (error) {
        console.error('exists check error:', error);
        return false;
      }
    }
  }
});

console.log('Preload script finished exposing APIs');
