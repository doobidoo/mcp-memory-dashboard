declare global {
  interface Window {
    fs: {
      readFile: (path: string, options?: { encoding?: string }) => Promise<string>;
      exists?: (path: string) => Promise<boolean>;
    };
    check_database_health: () => Promise<{
      health: number;
      avgQueryTime: number;
    }>;
    get_stats: () => Promise<{
      totalMemories: number;
      uniqueTags: number;
    }>;
    store_memory: (params: {
      content: string;
      metadata: {
        tags: string[];
        type: string;
      };
    }) => Promise<boolean>;
    retrieve_memory: (params: {
      query: string;
      n_results: number;
    }) => Promise<Array<{
      content: string;
      tags?: string[];
      similarity?: number;
    }>>;
    optimize_db: () => Promise<void>;
    create_backup: () => Promise<void>;
    delete_by_tag: (params: { tag: string }) => Promise<void>;
  }
}
