/**
 * Direct ChromaDB Service
 * 
 * This service provides direct access to ChromaDB database files,
 * eliminating the need for a separate MCP service process.
 * 
 * Part of GitHub Issue #11 implementation: Architecture improvements
 * to eliminate redundant MCP service spawning and resource conflicts.
 */

interface MemoryMetadata {
  tags?: string[];
  type?: string;
  timestamp?: string;
  [key: string]: any;
}

interface Memory {
  id: string;
  content: string;
  metadata?: MemoryMetadata;
  distance?: number;
}

interface DatabaseStats {
  total_memories: number;
  unique_tags: number;
}

interface HealthStatus {
  health: number;
  avg_query_time: number;
  status: string;
}

export class DirectChromaService {
  private chromaPath: string;
  private isInitialized: boolean = false;
  private collection: any = null;
  
  constructor(chromaPath: string) {
    this.chromaPath = chromaPath;
    console.log('DirectChromaService initialized with path:', chromaPath);
  }

  /**
   * Initialize the ChromaDB connection
   * Uses persistent client to access existing database files
   */
  async initialize(): Promise<void> {
    try {
      // Note: This is a placeholder for direct ChromaDB access
      // In a real implementation, we would use chromadb package here
      // For now, we'll implement this using IPC to main process
      
      console.log('Initializing direct ChromaDB access...');
      this.isInitialized = true;
      
      // TODO: Implement direct ChromaDB client initialization
      // const { ChromaClient } = require('chromadb');
      // this.client = new ChromaClient({
      //   path: this.chromaPath
      // });
      
    } catch (error) {
      console.error('Failed to initialize DirectChromaService:', error);
      throw new Error(`ChromaDB initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Store a memory in the database
   */
  async storeMemory(content: string, metadata?: MemoryMetadata): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // For now, delegate to the main process via IPC
      // This will be replaced with direct ChromaDB access
      const result = await this.delegateToMainProcess('direct-chroma:store', {
        content,
        metadata
      });
      
      return result;
    } catch (error) {
      console.error('Error storing memory:', error);
      throw error;
    }
  }

  /**
   * Retrieve memories using semantic search
   */
  async retrieveMemory(query: string, nResults: number = 5): Promise<{ memories: Memory[] }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const result = await this.delegateToMainProcess('direct-chroma:retrieve', {
        query,
        n_results: nResults
      });
      
      return {
        memories: result.memories || []
      };
    } catch (error) {
      console.error('Error retrieving memory:', error);
      throw error;
    }
  }

  /**
   * Search memories by tags
   */
  async searchByTag(tags: string[]): Promise<{ memories: Memory[] }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const result = await this.delegateToMainProcess('direct-chroma:search-by-tag', {
        tags
      });
      
      return {
        memories: result.memories || []
      };
    } catch (error) {
      console.error('Error searching by tag:', error);
      throw error;
    }
  }

  /**
   * Delete memories by tag
   */
  async deleteByTag(tag: string): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const result = await this.delegateToMainProcess('direct-chroma:delete-by-tag', {
        tag
      });
      
      return result;
    } catch (error) {
      console.error('Error deleting by tag:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<DatabaseStats> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const result = await this.delegateToMainProcess('direct-chroma:get-stats', {});
      
      return {
        total_memories: result.total_memories || 0,
        unique_tags: result.unique_tags || 0
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        total_memories: 0,
        unique_tags: 0
      };
    }
  }

  /**
   * Check database health
   */
  async checkHealth(): Promise<HealthStatus> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const result = await this.delegateToMainProcess('direct-chroma:check-health', {});
      
      return {
        health: result.health || 0,
        avg_query_time: result.avg_query_time || 0,
        status: result.status || 'unknown'
      };
    } catch (error) {
      console.error('Error checking health:', error);
      return {
        health: 0,
        avg_query_time: 0,
        status: 'error'
      };
    }
  }

  /**
   * Optimize database
   */
  async optimizeDb(): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const result = await this.delegateToMainProcess('direct-chroma:optimize', {});
      return result;
    } catch (error) {
      console.error('Error optimizing database:', error);
      throw error;
    }
  }

  /**
   * Create database backup
   */
  async createBackup(): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const result = await this.delegateToMainProcess('direct-chroma:backup', {});
      return result;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  /**
   * Delegate operations to main process via IPC
   * This is a temporary solution until direct ChromaDB access is implemented
   */
  private async delegateToMainProcess(channel: string, data: any): Promise<any> {
    // @ts-ignore - electron will be available in renderer context
    if (typeof window !== 'undefined' && window.electronAPI) {
      // @ts-ignore
      return await window.electronAPI.invoke(channel, data);
    } else {
      throw new Error('Electron IPC not available');
    }
  }
}

export default DirectChromaService;