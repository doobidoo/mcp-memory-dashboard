interface MCPClient {
  use_mcp_tool: (params: {
    server_name: string;
    tool_name: string;
    arguments: Record<string, unknown>;
  }) => Promise<any>;
}

interface MemoryMetadata {
  tags?: string[];
  type?: string;
  timestamp?: string;
  [key: string]: any;
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

export class MemoryService {
  private mcpClient: MCPClient;

  constructor(mcpClient: MCPClient) {
    console.log('Initializing MemoryService with client:', mcpClient);
    this.mcpClient = mcpClient;
  }

  async store_memory({ content, metadata }: { content: string; metadata?: MemoryMetadata }) {
    try {
      console.log('Storing memory:', { content, metadata });
      return await this.mcpClient.use_mcp_tool({
        server_name: "memory",
        tool_name: "store_memory",
        arguments: { content, metadata }
      });
    } catch (error) {
      console.error('Error storing memory:', error);
      throw error;
    }
  }

  async retrieve_memory({ query, n_results = 5 }: { query: string; n_results?: number }) {
    try {
      console.log('Retrieving memory using dashboard endpoint:', { query, n_results });
      
      // Use the new dashboard endpoint that returns JSON
      const response = await this.mcpClient.use_mcp_tool({
        server_name: "memory",
        tool_name: "dashboard_retrieve_memory",
        arguments: { query, n_results }
      });

      // Parse the JSON response
      let parsedResponse: DashboardResponse;
      if (typeof response === 'string') {
        parsedResponse = JSON.parse(response);
      } else {
        parsedResponse = response;
      }

      if (parsedResponse.error) {
        throw new Error(parsedResponse.error);
      }

      // Return in the format expected by the dashboard
      return {
        memories: parsedResponse.memories || []
      };
    } catch (error) {
      console.error('Error retrieving memory:', error);
      throw error;
    }
  }

  async search_by_tag({ tags }: { tags: string[] }) {
    try {
      console.log('Searching by tags using dashboard endpoint:', tags);
      
      // Use the new dashboard endpoint that returns JSON
      const response = await this.mcpClient.use_mcp_tool({
        server_name: "memory",
        tool_name: "dashboard_search_by_tag",
        arguments: { tags }
      });

      // Parse the JSON response
      let parsedResponse: DashboardResponse;
      if (typeof response === 'string') {
        parsedResponse = JSON.parse(response);
      } else {
        parsedResponse = response;
      }

      if (parsedResponse.error) {
        throw new Error(parsedResponse.error);
      }

      // Return in the format expected by the dashboard
      return {
        memories: parsedResponse.memories || []
      };
    } catch (error) {
      console.error('Error searching by tag:', error);
      throw error;
    }
  }

  async delete_by_tag({ tag }: { tag: string }) {
    try {
      console.log('Deleting by tag:', tag);
      return await this.mcpClient.use_mcp_tool({
        server_name: "memory",
        tool_name: "delete_by_tag",
        arguments: { tag }
      });
    } catch (error) {
      console.error('Error deleting by tag:', error);
      throw error;
    }
  }

  async check_database_health() {
    try {
      console.log('Checking database health using dashboard endpoint');
      
      // Use the new dashboard endpoint that returns JSON
      const response = await this.mcpClient.use_mcp_tool({
        server_name: "memory",
        tool_name: "dashboard_check_health",
        arguments: {}
      });

      // Parse the JSON response
      let healthData: DashboardResponse;
      if (typeof response === 'string') {
        healthData = JSON.parse(response);
      } else {
        healthData = response;
      }

      // Return in the format expected by the dashboard
      return {
        health: healthData.health || 0,
        avg_query_time: healthData.avg_query_time || 0,
        status: healthData.status || 'unknown'
      };
    } catch (error) {
      console.error('Error checking database health:', error);
      throw error;
    }
  }

  async get_stats() {
    try {
      console.log('Getting stats using dashboard endpoint');
      
      // Use the new dashboard endpoint that returns JSON
      const response = await this.mcpClient.use_mcp_tool({
        server_name: "memory",
        tool_name: "dashboard_get_stats",
        arguments: {}
      });

      // Parse the JSON response
      let statsData: DashboardResponse;
      if (typeof response === 'string') {
        statsData = JSON.parse(response);
      } else {
        statsData = response;
      }

      if (statsData.error) {
        console.warn('Stats error:', statsData.error);
        // Return default values if there's an error
        return {
          total_memories: 0,
          unique_tags: 0
        };
      }

      // Return in the format expected by the dashboard
      return {
        total_memories: statsData.total_memories || 0,
        unique_tags: statsData.unique_tags || 0
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      throw error;
    }
  }

  async optimize_db() {
    try {
      console.log('Optimizing database using dashboard endpoint');
      
      // Use the new dashboard endpoint
      const response = await this.mcpClient.use_mcp_tool({
        server_name: "memory",
        tool_name: "dashboard_optimize_db",
        arguments: {}
      });

      // Parse the JSON response
      let result: DashboardResponse;
      if (typeof response === 'string') {
        result = JSON.parse(response);
      } else {
        result = response;
      }

      if (result.status === 'not_implemented') {
        console.info('Database optimization not implemented:', result.message);
        return { message: result.message, status: result.status };
      }

      return result;
    } catch (error) {
      console.error('Error optimizing database:', error);
      throw error;
    }
  }

  async create_backup() {
    try {
      console.log('Creating backup using dashboard endpoint');
      
      // Use the new dashboard endpoint
      const response = await this.mcpClient.use_mcp_tool({
        server_name: "memory",
        tool_name: "dashboard_create_backup",
        arguments: {}
      });

      // Parse the JSON response
      let result: DashboardResponse;
      if (typeof response === 'string') {
        result = JSON.parse(response);
      } else {
        result = response;
      }

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
}