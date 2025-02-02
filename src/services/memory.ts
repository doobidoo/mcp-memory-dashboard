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
      console.log('Retrieving memory:', { query, n_results });
      return await this.mcpClient.use_mcp_tool({
        server_name: "memory",
        tool_name: "retrieve_memory",
        arguments: { query, n_results }
      });
    } catch (error) {
      console.error('Error retrieving memory:', error);
      throw error;
    }
  }

  async search_by_tag({ tags }: { tags: string[] }) {
    try {
      console.log('Searching by tags:', tags);
      return await this.mcpClient.use_mcp_tool({
        server_name: "memory",
        tool_name: "search_by_tag",
        arguments: { tags }
      });
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
      console.log('Checking database health');
      return await this.mcpClient.use_mcp_tool({
        server_name: "memory",
        tool_name: "check_database_health",
        arguments: {}
      });
    } catch (error) {
      console.error('Error checking database health:', error);
      throw error;
    }
  }

  async get_stats() {
    try {
      console.log('Getting stats');
      return await this.mcpClient.use_mcp_tool({
        server_name: "memory",
        tool_name: "get_stats",
        arguments: {}
      });
    } catch (error) {
      console.error('Error getting stats:', error);
      throw error;
    }
  }

  async optimize_db() {
    try {
      console.log('Optimizing database');
      return await this.mcpClient.use_mcp_tool({
        server_name: "memory",
        tool_name: "optimize_db",
        arguments: {}
      });
    } catch (error) {
      console.error('Error optimizing database:', error);
      throw error;
    }
  }

  async create_backup() {
    try {
      console.log('Creating backup');
      return await this.mcpClient.use_mcp_tool({
        server_name: "memory",
        tool_name: "create_backup",
        arguments: {}
      });
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }
}
