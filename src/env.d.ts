/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MEMORY_SERVICE_PATH: string
  readonly VITE_MEMORY_CHROMA_PATH: string
  readonly VITE_MEMORY_BACKUPS_PATH: string
  readonly VITE_CLAUDE_CONFIG_PATH: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  fs?: {
    readFile(path: string, options?: { encoding?: BufferEncoding }): Promise<string>;
    exists(path: string): Promise<boolean>;
  };
  electronAPI?: {
    memory: {
      store_memory(content: string, metadata?: any): Promise<void>;
      retrieve_memory(query: string, n_results?: number): Promise<any>;
      search_by_tag(tags: string[]): Promise<any>;
      delete_by_tag(tag: string): Promise<void>;
      check_database_health(): Promise<any>;
      get_stats(): Promise<any>;
      optimize_db(): Promise<void>;
      create_backup(): Promise<void>;
    } | null;
  };
}