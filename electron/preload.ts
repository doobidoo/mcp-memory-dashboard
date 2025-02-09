import { contextBridge, ipcRenderer } from 'electron';
import fs from 'fs';
import { promisify } from 'util';
import type { MemoryService } from '../src/services/memory';

const readFileAsync = promisify(fs.readFile);
const existsAsync = promisify(fs.exists);

// Get environment variables from renderer process arguments
const getEnvVar = (name: string): string | undefined => {
  const arg = process.argv.find(arg => arg.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : undefined;
};

const ENV = {
  MEMORY_SERVICE_PATH: getEnvVar('memory-service-path'),
  MEMORY_CHROMA_PATH: process.env.MCP_MEMORY_CHROMA_PATH,
  MEMORY_BACKUPS_PATH: process.env.MCP_MEMORY_BACKUPS_PATH,
  CLAUDE_CONFIG_PATH: getEnvVar('claude-config-path')
};

console.log('Preload script starting with:', {
  ENV,
  processEnv: {
    MCP_MEMORY_CHROMA_PATH: process.env.MCP_MEMORY_CHROMA_PATH,
    MCP_MEMORY_BACKUPS_PATH: process.env.MCP_MEMORY_BACKUPS_PATH
  }
});

interface MCPToolRequest {
  server_name: string;
  tool_name: string;
  arguments: Record<string, unknown>;
}

// Create MCP client for memory service
const mcpClient = {
  use_mcp_tool: async ({ server_name, tool_name, arguments: args }: MCPToolRequest) => {
    try {
      console.log('MCP tool request environment:', process.env);
      if (!ENV.CLAUDE_CONFIG_PATH) {
        throw new Error('Claude config path not available');
      }
      if (!ENV.MEMORY_CHROMA_PATH) {
        throw new Error('Memory Chroma DB path not available');
      }

      console.log(`Calling MCP tool: ${server_name}/${tool_name}`, { args, env: ENV });
      const result = await ipcRenderer.invoke('mcp:use-tool', {
        server_name,
        tool_name,
        arguments: args
      });
      
      // Log detailed information about the MCP tool call
      console.log('MCP tool call details:', {
        request: { server_name, tool_name, args },
        result,
        env: { MCP_MEMORY_CHROMA_PATH: process.env.MCP_MEMORY_CHROMA_PATH }
      });
      
      return result;
    } catch (error) {
      console.error(`MCP tool error (${server_name}/${tool_name}):`, error);
      console.error('Error details:', error instanceof Error ? error.stack : error);
      throw new Error(`MCP tool error (${server_name}/${tool_name}): ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

// Initialize memory service with error handling
let memoryService: MemoryService | null = null;

// Enhanced memory service initialization
try {
  console.log('=== Starting Memory Service Initialization ===');
  const envVars = {
    MEMORY_SERVICE_PATH: ENV.MEMORY_SERVICE_PATH,
    MEMORY_CHROMA_PATH: ENV.MEMORY_CHROMA_PATH,
    MEMORY_BACKUPS_PATH: ENV.MEMORY_BACKUPS_PATH,
    CLAUDE_CONFIG_PATH: ENV.CLAUDE_CONFIG_PATH
  };
  
  Object.entries(envVars).forEach(([key, value]) => {
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    console.log(`${key}: ${value}`);
  });

  const { MemoryService } = require('../src/services/memory');
  memoryService = new MemoryService(mcpClient);
  
  // Immediate health check
  mcpClient.use_mcp_tool({
    server_name: "memory",
    tool_name: "check_database_health",
    arguments: {}
  }).then(result => {
    console.log('Memory service initialized successfully:', result);
    ipcRenderer.send('service-status', { memory: true });
  }).catch(error => {
    console.error('Memory service initialization failed:', error);
    ipcRenderer.send('service-status', { memory: false });
    throw error;
  });

} catch (error) {
  console.error('Memory service initialization error:', error);
  ipcRenderer.send('service-error', { 
    service: 'memory', 
    error: error instanceof Error ? error.message : String(error)
  });
}

// Check if memory service is available
if (!memoryService) {
  console.error('Memory service not available');
  ipcRenderer.send('service-status', { memory: false });
} else {
  console.log('Memory service is available');
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
