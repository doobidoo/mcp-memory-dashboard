export interface DatabaseHealth {
  health: number;
  avg_query_time: number;
  details?: string;
}

export interface DatabaseStats {
  total_memories: number;
  unique_tags: number;
  storage_size?: string;
}

export interface Memory {
  content: string;
  tags?: string[];
  similarity?: number;
  metadata?: {
    timestamp?: string;
    [key: string]: any;
  };
}

export interface MemoryResponse {
  memories: Memory[];
  status?: string;
}

export interface MemoryMetadata {
  tags?: string[];
  type?: string;
  timestamp?: string;
  [key: string]: any;
}

export interface MemoryAPI {
  store_memory(content: string, metadata?: MemoryMetadata): Promise<void>;
  retrieve_memory(query: string, n_results?: number): Promise<MemoryResponse>;
  search_by_tag(tags: string[]): Promise<MemoryResponse>;
  delete_by_tag(tag: string): Promise<void>;
  check_database_health(): Promise<DatabaseHealth>;
  get_stats(): Promise<DatabaseStats>;
  optimize_db(): Promise<void>;
  create_backup(): Promise<void>;
}
