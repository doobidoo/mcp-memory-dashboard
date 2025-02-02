import React, { useState, useEffect } from 'react';
import { 
  DatabaseHealth, 
  DatabaseStats, 
  MemoryResponse, 
  Memory,
  MemoryAPI,
  MemoryMetadata 
} from './types';
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/card';
import { 
  Save, Search, Tag, Database, Settings, 
  RefreshCw, Trash2 
} from 'lucide-react';

interface MemoryDashboardProps {
  mcpServers: {
    memory: {
      command: string;
      args: string[];
      env?: {
        [key: string]: string | undefined;
        MCP_MEMORY_CHROMA_PATH?: string;
        MCP_MEMORY_BACKUPS_PATH?: string;
      };
    };
  };
  claude: {
    configPath: string;
    available: boolean;
  };
}

const MemoryDashboard: React.FC<MemoryDashboardProps> = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('store');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalMemories: 0,
    tagsCount: 0,
    dbHealth: 100,
    avgQueryTime: 0
  });
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      if (!window.electronAPI?.memory) {
        throw new Error('Memory API not available');
      }

      const [healthData, dbStats] = await Promise.all([
        window.electronAPI.memory.check_database_health(),
        window.electronAPI.memory.get_stats()
      ]);
      
      setStats({
        totalMemories: dbStats.total_memories || 0,
        tagsCount: dbStats.unique_tags || 0,
        dbHealth: healthData.health || 100,
        avgQueryTime: healthData.avg_query_time || 0
      });
    } catch (err) {
      setError('Failed to load statistics');
    }
  };

  const handleStoreMemory = async () => {
    if (!content.trim()) {
      setError('Content cannot be empty');
      return;
    }

    setLoading(true);
    try {
      if (!window.electronAPI?.memory) {
        throw new Error('Memory API not available');
      }

      const tagArray = tags.split(',').map(tag => tag.trim()).filter(Boolean);
      await window.electronAPI.memory.store_memory(content.trim(), {
        tags: tagArray,
        type: 'user-input'
      });

      setContent('');
      setTags('');
      setError(null);
      await loadStats();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setError('Failed to store memory: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Search query cannot be empty');
      return;
    }

    setLoading(true);
    try {
      if (!window.electronAPI?.memory) {
        throw new Error('Memory API not available');
      }

      const response = await window.electronAPI.memory.retrieve_memory(searchQuery.trim(), 5);
      setMemories(response.memories || []);
      setError(null);
    } catch (searchError) {
      const err = searchError instanceof Error ? searchError : new Error(String(searchError));
      setError('Search failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    setLoading(true);
    try {
      if (!window.electronAPI?.memory) {
        throw new Error('Memory API not available');
      }

      await window.electronAPI.memory.optimize_db();
      await loadStats();
      setError(null);
    } catch (err) {
      setError('Failed to optimize database performance: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    setLoading(true);
    try {
      if (!window.electronAPI?.memory) {
        throw new Error('Memory API not available');
      }

      await window.electronAPI.memory.create_backup();
      setError(null);
    } catch (err) {
      setError('Failed to create backup: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTag = async (tag: string) => {
    if (!tag.trim()) {
      setError('Tag cannot be empty');
      return;
    }

    setLoading(true);
    try {
      if (!window.electronAPI?.memory) {
        throw new Error('Memory API not available');
      }

      await window.electronAPI.memory.delete_by_tag(tag.trim());
      await loadStats();
      setError(null);
      setSearchQuery('');
    } catch (err) {
      setError('Failed to delete memories by tag: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Database className="w-6 h-6" />
              Memory Service Dashboard
            </CardTitle>
            <div className="flex gap-2">
              <button
                onClick={handleBackup}
                className="p-2 rounded-lg hover:bg-gray-100"
                disabled={loading}
                title="Create Backup"
              >
                <Save className="w-5 h-5" />
              </button>
              <button
                onClick={handleOptimize}
                className="p-2 rounded-lg hover:bg-gray-100"
                disabled={loading}
                title="Optimize Database"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { id: 'store', icon: Save, label: 'Store Memory' },
              { id: 'search', icon: Search, label: 'Search Memories' },
              { id: 'tags', icon: Tag, label: 'Tag Management' }
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setSelectedTab(id)}
                disabled={loading}
                className={`p-4 rounded-lg flex items-center gap-2 ${
                  selectedTab === id ? 'bg-blue-100 text-blue-700' : 'bg-gray-50'
                } disabled:opacity-50`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-blue-100 p-4 rounded-md mb-4">
              <p>{error}</p>
            </div>
          )}

          {selectedTab === 'store' && (
            <div className="space-y-4">
              <textarea 
                className="w-full p-2 border rounded-md h-32"
                placeholder="Enter memory content..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={loading}
              />
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="flex-1 p-2 border rounded-md"
                  placeholder="Add tags (comma separated)"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  disabled={loading}
                />
                <button 
                  onClick={handleStoreMemory}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2 disabled:bg-blue-300"
                >
                  <Save className="w-4 h-4" />
                  Store
                </button>
              </div>
            </div>
          )}

          {selectedTab === 'search' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="flex-1 p-2 border rounded-md"
                  placeholder="Search memories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={loading}
                />
                <button 
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2 disabled:bg-blue-300"
                >
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </div>
              <div className="space-y-2">
                {memories.map((memory, index) => {
                  const timestamp = memory.metadata?.timestamp || new Date().toISOString();
                  const formattedDate = new Date(timestamp).toLocaleString();
                  
                  return (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm text-gray-500">
                            {formattedDate}
                          </div>
                          {memory.similarity && (
                            <div className="text-sm text-gray-500">
                              Similarity: {(memory.similarity * 100).toFixed(1)}%
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-gray-800">
                            {memory.content.length > 200 ? (
                              <>
                                {expandedIndex === index ? memory.content : `${memory.content.slice(0, 200)}...`}
                                <button 
                                  className="text-blue-600 hover:underline ml-2"
                                  onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                                >
                                  {expandedIndex === index ? 'Show less' : 'Show more'}
                                </button>
                              </>
                            ) : memory.content}
                          </div>
                          
                          {memory.tags && memory.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {memory.tags.map((tag, tagIndex) => (
                                <span 
                                  key={tagIndex}
                                  className="px-2 py-1 rounded-md text-sm"
                                  style={{
                                    backgroundColor: `hsl(${tag.charCodeAt(0) % 360}, 70%, 90%)`,
                                    color: `hsl(${tag.charCodeAt(0) % 360}, 70%, 30%)`
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {selectedTab === 'tags' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="flex-1 p-2 border rounded-md"
                  placeholder="Enter tag to delete..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={loading}
                />
                <button 
                  onClick={() => handleDeleteTag(searchQuery)}
                  disabled={loading || !searchQuery.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-md flex items-center gap-2 disabled:bg-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Tag
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-4 mt-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.totalMemories}</div>
            <div className="text-sm text-gray-500">Total Memories</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.tagsCount}</div>
            <div className="text-sm text-gray-500">Unique Tags</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.dbHealth}%</div>
            <div className="text-sm text-gray-500">Health</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.avgQueryTime}</div>
            <div className="text-sm text-gray-500">Avg Query (ms)</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MemoryDashboard;
