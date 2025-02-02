declare global {
  interface Window {
    electronAPI: {
      memory: {
        storeMemory: (params: {
          content: string;
          metadata: {
            tags: string[] | string;
            type: string;
          };
        }) => Promise<boolean>;
        retrieveMemory: (params: {
          query: string;
          n_results?: number;
        }) => Promise<Array<{
          content: string;
          metadata?: {
            tags?: string[];
            type?: string;
          };
          similarity?: number;
        }>>;
        searchByTag: (params: {
          tags: string[];
        }) => Promise<Array<{
          content: string;
          metadata?: {
            tags?: string[];
            type?: string;
          };
        }>>;
        deleteMemory: (params: {
          content_hash: string;
        }) => Promise<boolean>;
        cleanupDuplicates: () => Promise<void>;
        checkDatabaseHealth: () => Promise<{
          health: number;
          avgQueryTime: number;
        }>;
        getStats: () => Promise<{
          totalMemories: number;
          uniqueTags: number;
        }>;
        createBackup: () => Promise<void>;
      } | null;
      fs: {
        readFile: (path: string, options?: { encoding?: BufferEncoding }) => Promise<string | Buffer>;
        exists: (path: string) => Promise<boolean>;
      };
    };
  }
}
