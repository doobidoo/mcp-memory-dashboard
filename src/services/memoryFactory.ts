/**
 * Memory Service Factory
 * 
 * This factory creates the appropriate memory service implementation
 * based on configuration, supporting both direct ChromaDB access
 * and traditional MCP service spawning.
 * 
 * Part of GitHub Issue #11 implementation.
 */

import { MemoryService } from './memory';
import DirectChromaService from './direct/chromaService';

interface MCPClient {
  use_mcp_tool: (params: {
    server_name: string;
    tool_name: string;
    arguments: Record<string, unknown>;
  }) => Promise<any>;
}

interface MemoryServiceInterface {
  store_memory: (params: { content: string; metadata?: any }) => Promise<any>;
  retrieve_memory: (params: { query: string; n_results?: number }) => Promise<any>;
  search_by_tag: (params: { tags: string[] }) => Promise<any>;
  delete_by_tag: (params: { tag: string }) => Promise<any>;
  check_database_health: () => Promise<any>;
  get_stats: () => Promise<any>;
  optimize_db: () => Promise<any>;
  create_backup: () => Promise<any>;
}

/**
 * Wrapper to make DirectChromaService compatible with MemoryService interface
 */
class DirectMemoryServiceAdapter implements MemoryServiceInterface {
  private directService: DirectChromaService;

  constructor(directService: DirectChromaService) {
    this.directService = directService;
  }

  async store_memory({ content, metadata }: { content: string; metadata?: any }) {
    return await this.directService.storeMemory(content, metadata);
  }

  async retrieve_memory({ query, n_results = 5 }: { query: string; n_results?: number }) {
    return await this.directService.retrieveMemory(query, n_results);
  }

  async search_by_tag({ tags }: { tags: string[] }) {
    return await this.directService.searchByTag(tags);
  }

  async delete_by_tag({ tag }: { tag: string }) {
    return await this.directService.deleteByTag(tag);
  }

  async check_database_health() {
    return await this.directService.checkHealth();
  }

  async get_stats() {
    return await this.directService.getStats();
  }

  async optimize_db() {
    return await this.directService.optimizeDb();
  }

  async create_backup() {
    return await this.directService.createBackup();
  }
}

/**
 * Factory function to create the appropriate memory service
 */
export function createMemoryService(mcpClient?: MCPClient): MemoryServiceInterface {
  // Check if direct access is enabled
  const useDirectAccess = import.meta.env.VITE_USE_DIRECT_CHROMA_ACCESS === 'true';
  const chromaPath = import.meta.env.VITE_MEMORY_CHROMA_PATH;
  
  console.log('Memory Service Factory:', {
    useDirectAccess,
    chromaPath,
    hasClient: !!mcpClient
  });

  if (useDirectAccess && chromaPath) {
    console.log('🚀 Creating Direct ChromaDB Memory Service (GitHub Issue #11 Solution)');
    const directService = new DirectChromaService(chromaPath);
    return new DirectMemoryServiceAdapter(directService);
  } else {
    console.log('⚠️  Creating Traditional MCP Memory Service (Fallback)');
    if (!mcpClient) {
      throw new Error('MCP Client required for traditional memory service');
    }
    return new MemoryService(mcpClient);
  }
}

export default createMemoryService;