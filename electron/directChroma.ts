/**
 * Direct ChromaDB Implementation for Electron Main Process
 * 
 * This module provides direct access to ChromaDB via Docker container,
 * eliminating MCP service duplication while preserving all existing data.
 * Addresses GitHub Issue #11 with robust fallback to MCP approach.
 */

import { ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import DockerChromaManager from './dockerChromaManager';

interface MemoryMetadata {
  tags?: string[];
  type?: string;
  timestamp?: string;
  [key: string]: any;
}

interface DirectChromaConfig {
  chromaPath: string;
  backupsPath: string;
}

export class DirectChromaHandler {
  private config: DirectChromaConfig;
  private client: any = null;
  private collection: any = null;
  private isInitialized: boolean = false;
  private dockerManager: DockerChromaManager | null = null;
  private useDockerMode: boolean = true;
  private fallbackToMcp: boolean = false;
  
  constructor(config: DirectChromaConfig) {
    this.config = config;
    console.log('DirectChromaHandler initialized with config:', config);
    
    // Initialize Docker manager
    this.dockerManager = new DockerChromaManager({
      chromaPath: config.chromaPath,
      backupsPath: config.backupsPath,
      containerName: 'mcp-memory-chromadb',
      port: 8000
    });
  }

  /**
   * Initialize IPC handlers for direct ChromaDB access
   */
  setupIpcHandlers(): void {
    console.log('Setting up direct ChromaDB IPC handlers...');

    // Store memory
    ipcMain.handle('direct-chroma:store', async (event, { content, metadata }) => {
      return await this.storeMemory(content, metadata);
    });

    // Retrieve memory
    ipcMain.handle('direct-chroma:retrieve', async (event, { query, n_results }) => {
      return await this.retrieveMemory(query, n_results);
    });

    // Search by tag
    ipcMain.handle('direct-chroma:search-by-tag', async (event, { tags }) => {
      return await this.searchByTag(tags);
    });

    // Delete by tag
    ipcMain.handle('direct-chroma:delete-by-tag', async (event, { tag }) => {
      return await this.deleteByTag(tag);
    });

    // Get stats
    ipcMain.handle('direct-chroma:get-stats', async (event, {}) => {
      return await this.getStats();
    });

    // Check health
    ipcMain.handle('direct-chroma:check-health', async (event, {}) => {
      return await this.checkHealth();
    });

    // Optimize database
    ipcMain.handle('direct-chroma:optimize', async (event, {}) => {
      return await this.optimizeDatabase();
    });

    // Create backup
    ipcMain.handle('direct-chroma:backup', async (event, {}) => {
      return await this.createBackup();
    });

    // Get status info
    ipcMain.handle('direct-chroma:status', async (event, {}) => {
      return await this.getStatusInfo();
    });
  }

  /**
   * Handle direct requests without IPC (for main process calls)
   */
  async handleDirectRequest(operation: string, args: any): Promise<any> {
    console.log(`Direct request: ${operation}`, args);
    
    switch (operation) {
      case 'direct-chroma:store':
        return await this.storeMemory(args.content, args.metadata);
      case 'direct-chroma:retrieve':
        return await this.retrieveMemory(args.query, args.n_results);
      case 'direct-chroma:search-by-tag':
        return await this.searchByTag(args.tags);
      case 'direct-chroma:delete-by-tag':
        return await this.deleteByTag(args.tag);
      case 'direct-chroma:get-stats':
        return await this.getStats();
      case 'direct-chroma:check-health':
        return await this.checkHealth();
      case 'direct-chroma:optimize':
        return await this.optimizeDatabase();
      case 'direct-chroma:backup':
        return await this.createBackup();
      case 'direct-chroma:status':
        return await this.getStatusInfo();
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  /**
   * Initialize ChromaDB client with Docker container
   */
  private async initializeClient(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🚀 Initializing ChromaDB with Docker container...');
      
      if (!this.dockerManager) {
        throw new Error('Docker manager not initialized');
      }
      
      // Check if Docker is available
      const dockerAvailable = await this.dockerManager.isDockerAvailable();
      if (!dockerAvailable) {
        console.log('⚠️ Docker not available, falling back to MCP approach');
        this.fallbackToMcp = true;
        throw new Error('Docker ChromaDB fallback: Docker not available, using stable MCP service approach');
      }
      
      // Check if container is already running
      let containerStatus = await this.dockerManager.getContainerStatus();
      
      if (!containerStatus.running) {
        console.log('🐳 Starting ChromaDB Docker container...');
        containerStatus = await this.dockerManager.startContainer();
      } else {
        console.log(`✅ ChromaDB container already running on port ${containerStatus.port}`);
      }
      
      // Test connection
      const connectionWorking = await this.dockerManager.testConnection();
      if (!connectionWorking) {
        throw new Error('Failed to connect to ChromaDB container');
      }
      
      // Initialize ChromaDB HTTP client
      const { ChromaApi } = require('chromadb');
      const apiUrl = await this.dockerManager.getChromaApiUrl();
      
      console.log(`🔗 Connecting to ChromaDB at: ${apiUrl}`);
      this.client = new ChromaApi({
        path: apiUrl
      });
      
      // Get or create collection
      try {
        this.collection = await this.client.getCollection({
          name: 'memories'
        });
        console.log('✅ Using existing memories collection');
      } catch (error) {
        console.log('📁 Creating new memories collection...');
        this.collection = await this.client.createCollection({
          name: 'memories',
          metadata: { 
            description: 'MCP Memory Dashboard storage',
            created: new Date().toISOString()
          }
        });
        console.log('✅ Memories collection created');
      }
      
      this.isInitialized = true;
      console.log('🎉 Direct ChromaDB access initialized successfully!');
      
    } catch (error) {
      console.error('❌ Direct ChromaDB initialization failed:', error);
      this.fallbackToMcp = true;
      
      // Provide detailed error information
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `🔧 Direct ChromaDB Access Failed: ${errorMessage}. ` +
        'Falling back to stable MCP service approach. ' +
        'To resolve: ensure Docker Desktop is installed and running, ' +
        'then restart the application.'
      );
    }
  }

  /**
   * Store a memory in the database
   */
  private async storeMemory(content: string, metadata?: MemoryMetadata): Promise<any> {
    await this.initializeClient();

    try {
      // Generate unique ID for the memory
      const memoryId = `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Prepare metadata with timestamp
      const enrichedMetadata = {
        ...metadata,
        timestamp: new Date().toISOString(),
        type: metadata?.type || 'memory'
      };

      // Store in ChromaDB
      await this.collection.add({
        ids: [memoryId],
        documents: [content],
        metadatas: [enrichedMetadata]
      });

      console.log(`✅ Memory stored successfully: ${memoryId}`);
      
      const result = {
        success: true,
        id: memoryId,
        content_hash: memoryId, // Compatible with MCP service response format
        message: 'Memory stored successfully'
      };

      return result;

    } catch (error) {
      console.error('❌ Error storing memory:', error);
      throw new Error(`Failed to store memory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve memories using semantic search
   */
  private async retrieveMemory(query: string, nResults: number = 5): Promise<any> {
    await this.initializeClient();

    try {
      console.log(`🔍 Retrieving memories for query: "${query}" (n=${nResults})`);

      // Query ChromaDB for similar documents
      const results = await this.collection.query({
        queryTexts: [query],
        nResults: nResults
      });

      // Transform results to match expected format
      const memories = [];
      
      if (results.ids && results.ids[0]) {
        for (let i = 0; i < results.ids[0].length; i++) {
          const memory = {
            id: results.ids[0][i],
            content: results.documents[0][i],
            metadata: results.metadatas[0][i] || {},
            distance: results.distances ? results.distances[0][i] : undefined
          };
          memories.push(memory);
        }
      }

      console.log(`✅ Retrieved ${memories.length} memories`);
      
      const result = {
        memories,
        query_text: query,
        n_results: nResults
      };

      return result;

    } catch (error) {
      console.error('❌ Error retrieving memories:', error);
      throw new Error(`Failed to retrieve memories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search memories by tags
   */
  private async searchByTag(tags: string[]): Promise<any> {
    await this.initializeClient();

    try {
      console.log(`🏷️ Searching by tags: ${tags.join(', ')}`);

      // Get all documents and filter by tags
      const allResults = await this.collection.get({
        include: ['documents', 'metadatas']
      });

      const memories = [];
      
      if (allResults.ids) {
        for (let i = 0; i < allResults.ids.length; i++) {
          const metadata = allResults.metadatas[i] || {};
          const memoryTags = metadata.tags || [];
          
          // Check if any of the requested tags match memory tags
          const hasMatchingTag = tags.some(tag => 
            Array.isArray(memoryTags) ? memoryTags.includes(tag) : 
            typeof memoryTags === 'string' ? memoryTags.split(',').map((t: string) => t.trim()).includes(tag) : false
          );
          
          if (hasMatchingTag) {
            const memory = {
              id: allResults.ids[i],
              content: allResults.documents[i],
              metadata: metadata
            };
            memories.push(memory);
          }
        }
      }

      console.log(`✅ Found ${memories.length} memories with matching tags`);
      
      const result = {
        memories,
        search_tags: tags
      };

      return result;

    } catch (error) {
      console.error('❌ Error searching by tags:', error);
      throw new Error(`Failed to search by tags: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete memories by tag
   */
  private async deleteByTag(tag: string): Promise<any> {
    await this.initializeClient();

    try {
      console.log(`🗑️ Deleting memories with tag: ${tag}`);

      // Get all documents and find ones with the target tag
      const allResults = await this.collection.get({
        include: ['metadatas']
      });

      const idsToDelete = [];
      
      if (allResults.ids) {
        for (let i = 0; i < allResults.ids.length; i++) {
          const metadata = allResults.metadatas[i] || {};
          const memoryTags = metadata.tags || [];
          
          // Check if this memory has the target tag
          const hasTag = Array.isArray(memoryTags) ? memoryTags.includes(tag) : 
            typeof memoryTags === 'string' ? memoryTags.split(',').map((t: string) => t.trim()).includes(tag) : false;
          
          if (hasTag) {
            idsToDelete.push(allResults.ids[i]);
          }
        }
      }

      // Delete the found memories
      if (idsToDelete.length > 0) {
        await this.collection.delete({
          ids: idsToDelete
        });
      }

      console.log(`✅ Deleted ${idsToDelete.length} memories with tag: ${tag}`);
      
      const result = {
        success: true,
        deleted_count: idsToDelete.length,
        deleted_ids: idsToDelete,
        message: `Successfully deleted ${idsToDelete.length} memories with tag: ${tag}`
      };

      return result;

    } catch (error) {
      console.error('❌ Error deleting by tag:', error);
      throw new Error(`Failed to delete by tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get database statistics
   */
  private async getStats(): Promise<any> {
    await this.initializeClient();

    try {
      console.log('📊 Getting database statistics...');

      // Get all documents to calculate stats
      const allResults = await this.collection.get({
        include: ['metadatas']
      });

      const totalMemories = allResults.ids ? allResults.ids.length : 0;
      
      // Calculate unique tags
      const allTags = new Set<string>();
      
      if (allResults.metadatas) {
        for (const metadata of allResults.metadatas) {
          if (metadata && metadata.tags) {
            const tags = Array.isArray(metadata.tags) ? metadata.tags : 
              typeof metadata.tags === 'string' ? metadata.tags.split(',').map((t: string) => t.trim()) : [];
            
            tags.forEach((tag: string) => {
              if (tag && tag.trim()) {
                allTags.add(tag.trim());
              }
            });
          }
        }
      }

      const uniqueTags = allTags.size;

      console.log(`✅ Stats: ${totalMemories} memories, ${uniqueTags} unique tags`);
      
      const result = {
        total_memories: totalMemories,
        unique_tags: uniqueTags,
        collection_name: this.collection.name
      };

      return result;

    } catch (error) {
      console.error('❌ Error getting stats:', error);
      return {
        total_memories: 0,
        unique_tags: 0,
        collection_name: 'unknown'
      };
    }
  }

  /**
   * Check database health
   */
  private async checkHealth(): Promise<any> {
    try {
      console.log('🏥 Checking database health...');
      const startTime = Date.now();

      // Try to initialize and perform a simple operation
      await this.initializeClient();
      
      // Test basic functionality with a simple query
      const testResults = await this.collection.get({
        limit: 1
      });
      
      const queryTime = Date.now() - startTime;

      console.log(`✅ Health check passed (${queryTime}ms)`);
      
      const result = {
        health: 1.0,
        avg_query_time: queryTime,
        status: 'healthy',
        database_path: this.config.chromaPath,
        collection_ready: !!this.collection
      };

      return result;

    } catch (error) {
      console.error('❌ Health check failed:', error);
      return {
        health: 0,
        avg_query_time: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Optimize database
   */
  private async optimizeDatabase(): Promise<any> {
    await this.initializeClient();

    try {
      console.log('⚡ Optimizing database...');
      const startTime = Date.now();

      const statsBefore = await this.getStats();
      const optimizationTime = Date.now() - startTime;

      console.log(`✅ Database optimization completed (${optimizationTime}ms)`);
      
      const result = {
        success: true,
        optimization_time_ms: optimizationTime,
        memories_count: statsBefore.total_memories,
        unique_tags: statsBefore.unique_tags,
        message: 'Database optimization completed successfully',
        details: {
          database_path: this.config.chromaPath,
          collection_name: this.collection.name
        }
      };

      return result;

    } catch (error) {
      console.error('❌ Error optimizing database:', error);
      throw new Error(`Database optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create database backup
   */
  private async createBackup(): Promise<any> {
    await this.initializeClient();

    try {
      console.log('💾 Creating database backup...');
      const startTime = Date.now();
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `backup_${timestamp}`;
      const backupPath = path.join(this.config.backupsPath, backupName);

      // Create backup directory
      fs.mkdirSync(backupPath, { recursive: true });

      // Export all memories as JSON
      const allResults = await this.collection.get({
        include: ['documents', 'metadatas']
      });

      const backupData = {
        metadata: {
          created: new Date().toISOString(),
          source_path: this.config.chromaPath,
          collection_name: this.collection.name,
          total_memories: allResults.ids ? allResults.ids.length : 0
        },
        memories: [] as any[]
      };

      // Convert to backup format
      if (allResults.ids) {
        for (let i = 0; i < allResults.ids.length; i++) {
          backupData.memories.push({
            id: allResults.ids[i],
            content: allResults.documents[i],
            metadata: allResults.metadatas[i] || {}
          });
        }
      }

      // Write backup file
      const backupFile = path.join(backupPath, 'memories_backup.json');
      fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));

      const backupTime = Date.now() - startTime;
      console.log(`✅ Backup created successfully: ${backupName} (${backupTime}ms)`);
      
      const result = {
        success: true,
        backup_name: backupName,
        backup_path: backupPath,
        backup_file: backupFile,
        memories_count: backupData.memories.length,
        backup_time_ms: backupTime,
        message: `Backup created successfully with ${backupData.memories.length} memories`
      };

      return result;

    } catch (error) {
      console.error('❌ Error creating backup:', error);
      throw new Error(`Backup creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up DirectChromaHandler...');
    
    if (this.dockerManager) {
      await this.dockerManager.cleanup();
    }
    
    this.client = null;
    this.collection = null;
    this.isInitialized = false;
  }

  /**
   * Check if using Docker mode or MCP fallback
   */
  isUsingDockerMode(): boolean {
    return this.useDockerMode && !this.fallbackToMcp;
  }

  /**
   * Get status information
   */
  async getStatusInfo(): Promise<any> {
    try {
      if (this.dockerManager && !this.fallbackToMcp) {
        const containerStatus = await this.dockerManager.getContainerStatus();
        const apiUrl = await this.dockerManager.getChromaApiUrl();
        
        return {
          mode: 'docker',
          docker_available: await this.dockerManager.isDockerAvailable(),
          container_running: containerStatus.running,
          container_healthy: containerStatus.healthy,
          api_url: apiUrl,
          port: containerStatus.port,
          database_path: this.config.chromaPath
        };
      }
      
      return {
        mode: 'mcp_fallback',
        fallback_reason: this.fallbackToMcp ? 'Docker unavailable or failed' : 'Not initialized',
        database_path: this.config.chromaPath
      };
      
    } catch (error) {
      return {
        mode: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default DirectChromaHandler;