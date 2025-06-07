import { contextBridge, ipcRenderer } from 'electron';

// Get environment variables from renderer process arguments
const getEnvVar = (name: string): string | undefined => {
  const arg = process.argv.find(arg => arg.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : undefined;
};

// Use VITE_ environment variables which are available
const ENV = {
  MEMORY_SERVICE_PATH: getEnvVar('memory-service-path') || process.env.VITE_MEMORY_SERVICE_PATH,
  MEMORY_CHROMA_PATH: getEnvVar('memory-chroma-path') || process.env.VITE_MEMORY_CHROMA_PATH,
  MEMORY_BACKUPS_PATH: getEnvVar('memory-backups-path') || process.env.VITE_MEMORY_BACKUPS_PATH,
  CLAUDE_CONFIG_PATH: getEnvVar('claude-config-path') || process.env.VITE_CLAUDE_CONFIG_PATH
};

console.log('Preload script starting with:', {
  ENV,
  processEnv: {
    VITE_MEMORY_CHROMA_PATH: process.env.VITE_MEMORY_CHROMA_PATH,
    VITE_MEMORY_BACKUPS_PATH: process.env.VITE_MEMORY_BACKUPS_PATH,
    VITE_CLAUDE_CONFIG_PATH: process.env.VITE_CLAUDE_CONFIG_PATH,
    VITE_MEMORY_SERVICE_PATH: process.env.VITE_MEMORY_SERVICE_PATH
  },
  argv: process.argv
});

interface MCPToolRequest {
  server_name: string;
  tool_name: string;
  arguments: Record<string, unknown>;
}

interface DashboardResponse {
  memories?: any[];
  error?: string;
  status?: string;
  message?: string;
  total_memories?: number;
  unique_tags?: number;
  health?: number;
  avg_query_time?: number;
}

// Create MCP client for memory service
const mcpClient = {
  use_mcp_tool: async ({ server_name, tool_name, arguments: args }: MCPToolRequest) => {
    try {
      console.log(`Calling MCP tool: ${server_name}/${tool_name}`, { args, env: ENV });
      
      if (!ENV.CLAUDE_CONFIG_PATH) {
        throw new Error('Claude config path not available');
      }
      if (!ENV.MEMORY_CHROMA_PATH) {
        throw new Error('Memory Chroma DB path not available');
      }

      const result = await ipcRenderer.invoke('mcp:use-tool', {
        server_name,
        tool_name,
        arguments: args
      });
      
      console.log('MCP tool call result:', {
        request: { server_name, tool_name, args },
        result
      });
      
      return result;
    } catch (error) {
      console.error(`MCP tool error (${server_name}/${tool_name}):`, error);
      throw new Error(`MCP tool error (${server_name}/${tool_name}): ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

// Memory service implementation - inline to avoid require() issues in sandbox
const memoryService = {
  async store_memory(content: string, metadata?: any) {
    console.log('Storing memory:', { content, metadata });
    return await mcpClient.use_mcp_tool({
      server_name: "memory",
      tool_name: "store_memory",
      arguments: { content, metadata }
    });
  },

  async retrieve_memory(query: string, n_results = 5) {
    try {
      console.log('Retrieving memory using dashboard endpoint:', { query, n_results });
      
      const response = await mcpClient.use_mcp_tool({
        server_name: "memory",
        tool_name: "dashboard_retrieve_memory",
        arguments: { query, n_results }
      });

      // Parse MCP response format: {content: [{type: "text", text: "JSON"}]}
      let jsonText: string;
      if (response && response.content && response.content[0] && response.content[0].text) {
        jsonText = response.content[0].text;
      } else if (typeof response === 'string') {
        jsonText = response;
      } else {
        jsonText = JSON.stringify(response);
      }

      const parsedResponse: DashboardResponse = JSON.parse(jsonText);

      if (parsedResponse.error) {
        throw new Error(parsedResponse.error);
      }

      return {
        memories: parsedResponse.memories || []
      };
    } catch (error) {
      console.error('Error retrieving memory:', error);
      throw error;
    }
  },

  async search_by_tag(tags: string[]) {
    try {
      console.log('Searching by tags using dashboard endpoint:', tags);
      
      const response = await mcpClient.use_mcp_tool({
        server_name: "memory",
        tool_name: "dashboard_search_by_tag",
        arguments: { tags }
      });

      // Parse MCP response format: {content: [{type: "text", text: "JSON"}]}
      let jsonText: string;
      if (response && response.content && response.content[0] && response.content[0].text) {
        jsonText = response.content[0].text;
      } else if (typeof response === 'string') {
        jsonText = response;
      } else {
        jsonText = JSON.stringify(response);
      }

      const parsedResponse: DashboardResponse = JSON.parse(jsonText);

      if (parsedResponse.error) {
        throw new Error(parsedResponse.error);
      }

      return {
        memories: parsedResponse.memories || []
      };
    } catch (error) {
      console.error('Error searching by tag:', error);
      throw error;
    }
  },

  async delete_by_tag(tagOrTags: string | string[]) {
    console.log('Deleting by tag(s):', tagOrTags);
    return await mcpClient.use_mcp_tool({
      server_name: "memory",
      tool_name: "delete_by_tag",
      arguments: { tag: tagOrTags }
    });
  },

  async delete_memory(memory_id: string) {
    console.log('Deleting individual memory:', memory_id);
    const response = await mcpClient.use_mcp_tool({
      server_name: "memory",
      tool_name: "delete_memory",
      arguments: { memory_id }
    });

    // Parse MCP response format
    let jsonText: string;
    if (response && response.content && response.content[0] && response.content[0].text) {
      jsonText = response.content[0].text;
    } else if (typeof response === 'string') {
      jsonText = response;
    } else {
      jsonText = JSON.stringify(response);
    }

    return JSON.parse(jsonText);
  },

  async recall_memory(query: string, n_results = 5) {
    try {
      console.log('Recalling memory with time expressions using dashboard endpoint:', { query, n_results });
      
      const response = await mcpClient.use_mcp_tool({
        server_name: "memory",
        tool_name: "dashboard_recall_memory",
        arguments: { query, n_results }
      });

      // Parse MCP response format
      let jsonText: string;
      if (response && response.content && response.content[0] && response.content[0].text) {
        jsonText = response.content[0].text;
      } else if (typeof response === 'string') {
        jsonText = response;
      } else {
        jsonText = JSON.stringify(response);
      }

      const parsedResponse: DashboardResponse = JSON.parse(jsonText);

      if (parsedResponse.error) {
        throw new Error(parsedResponse.error);
      }

      return {
        memories: parsedResponse.memories || []
      };
    } catch (error) {
      console.error('Error recalling memory:', error);
      throw error;
    }
  },

  async check_database_health() {
    try {
      console.log('Checking database health using dashboard endpoint');
      
      const response = await mcpClient.use_mcp_tool({
        server_name: "memory",
        tool_name: "dashboard_check_health",
        arguments: {}
      });

      // Parse MCP response format: {content: [{type: "text", text: "JSON"}]}
      let jsonText: string;
      if (response && response.content && response.content[0] && response.content[0].text) {
        jsonText = response.content[0].text;
      } else if (typeof response === 'string') {
        jsonText = response;
      } else {
        jsonText = JSON.stringify(response);
      }

      const healthData: DashboardResponse = JSON.parse(jsonText);

      return {
        health: healthData.health || 0,
        avg_query_time: healthData.avg_query_time || 0,
        status: healthData.status || 'unknown'
      };
    } catch (error) {
      console.error('Error checking database health:', error);
      throw error;
    }
  },

  async get_stats() {
    try {
      console.log('Getting stats using dashboard endpoint');
      
      const response = await mcpClient.use_mcp_tool({
        server_name: "memory",
        tool_name: "dashboard_get_stats",
        arguments: {}
      });

      // Parse MCP response format: {content: [{type: "text", text: "JSON"}]}
      let jsonText: string;
      if (response && response.content && response.content[0] && response.content[0].text) {
        jsonText = response.content[0].text;
      } else if (typeof response === 'string') {
        jsonText = response;
      } else {
        jsonText = JSON.stringify(response);
      }

      const statsData: DashboardResponse = JSON.parse(jsonText);

      if (statsData.error) {
        console.warn('Stats error:', statsData.error);
        return {
          total_memories: 0,
          unique_tags: 0
        };
      }

      return {
        total_memories: statsData.total_memories || 0,
        unique_tags: statsData.unique_tags || 0
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      throw error;
    }
  },

  async optimize_db() {
    try {
      console.log('Optimizing database using dashboard endpoint');
      
      const response = await mcpClient.use_mcp_tool({
        server_name: "memory",
        tool_name: "dashboard_optimize_db",
        arguments: {}
      });

      // Parse MCP response format: {content: [{type: "text", text: "JSON"}]}
      let jsonText: string;
      if (response && response.content && response.content[0] && response.content[0].text) {
        jsonText = response.content[0].text;
      } else if (typeof response === 'string') {
        jsonText = response;
      } else {
        jsonText = JSON.stringify(response);
      }

      const result: DashboardResponse = JSON.parse(jsonText);

      if (result.status === 'not_implemented') {
        console.info('Database optimization not implemented:', result.message);
        return { message: result.message, status: result.status };
      }

      return result;
    } catch (error) {
      console.error('Error optimizing database:', error);
      throw error;
    }
  },

  async create_backup() {
    try {
      console.log('Creating backup using dashboard endpoint');
      
      const response = await mcpClient.use_mcp_tool({
        server_name: "memory",
        tool_name: "dashboard_create_backup",
        arguments: {}
      });

      // Parse MCP response format: {content: [{type: "text", text: "JSON"}]}
      let jsonText: string;
      if (response && response.content && response.content[0] && response.content[0].text) {
        jsonText = response.content[0].text;
      } else if (typeof response === 'string') {
        jsonText = response;
      } else {
        jsonText = JSON.stringify(response);
      }

      const result: DashboardResponse = JSON.parse(jsonText);

      if (result.status === 'not_implemented') {
        console.info('Database backup not implemented:', result.message);
        return { message: result.message, status: result.status };
      }

      return result;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }
};

// Test connection on initialization
const testConnection = async () => {
  try {
    console.log('=== Testing Memory Service Connection ===');
    
    // Validate environment variables
    const requiredEnvVars = ['MEMORY_SERVICE_PATH', 'MEMORY_CHROMA_PATH', 'MEMORY_BACKUPS_PATH', 'CLAUDE_CONFIG_PATH'];
    const missingVars = requiredEnvVars.filter(varName => !ENV[varName as keyof typeof ENV]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Test health check
    const healthResult = await memoryService.check_database_health();
    console.log('Memory service health check successful:', healthResult);
    
    ipcRenderer.send('service-status', { memory: true });
    return true;
  } catch (error) {
    console.error('Memory service connection test failed:', error);
    ipcRenderer.send('service-error', { 
      service: 'memory', 
      error: error instanceof Error ? error.message : String(error)
    });
    ipcRenderer.send('service-status', { memory: false });
    return false;
  }
};

// Perform initial connection test
testConnection();

// Expose APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  memory: memoryService,
  fs: {
    readFile: async (path: string, options?: { encoding?: BufferEncoding }) => {
      console.log('readFile called with path:', path);
      try {
        const result = await ipcRenderer.invoke('fs:readFile', { path, options });
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
        const exists = await ipcRenderer.invoke('fs:exists', { path });
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
