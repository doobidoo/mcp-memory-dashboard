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
  Save,
  Search,
  Tag,
  Database,
  Settings,
  RefreshCw,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { VERSION } from './version';

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
  const [initializing, setInitializing] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [initializationStatus, setInitializationStatus] = useState('Starting Memory Service...');
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('store');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [recallQuery, setRecallQuery] = useState('');
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalMemories: 0,
    tagsCount: 0,
    dbHealth: 100,
    avgQueryTime: 0
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [serviceStatus, setServiceStatus] = useState<'unknown' | 'healthy' | 'unhealthy'>('unknown');

  useEffect(() => {
    const initializeApp = async () => {
      setInitializing(true);
      setInitializationStatus('Connecting to Memory Service...');
      
      // Add a small delay to show the initialization message
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        setInitializationStatus('Loading database statistics...');
        await loadStats();
        setInitializationStatus('Memory Service ready!');
        
        // Show ready status briefly before hiding initialization
        await new Promise(resolve => setTimeout(resolve, 1000));
        setInitializing(false);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setInitializationStatus('Failed to initialize - retrying...');
        
        // Retry after a delay
        setTimeout(() => {
          initializeApp();
        }, 2000);
      }
    };

    initializeApp();
  }, []);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      if (!window.electronAPI?.memory) {
        throw new Error('Memory API not available');
      }

      console.log('Loading dashboard stats...');
      setInitializationStatus('Checking database health...');
      
      const [healthData, dbStats] = await Promise.all([
        window.electronAPI.memory.check_database_health(),
        (async () => {
          setInitializationStatus('Loading memory statistics...');
          return window.electronAPI.memory.get_stats();
        })()
      ]);

      console.log('Health data received:', healthData);
      console.log('Stats data received:', dbStats);

      setStats({
        totalMemories: dbStats.total_memories || 0,
        tagsCount: dbStats.unique_tags || 0,
        dbHealth: healthData.health || 100,
        avgQueryTime: healthData.avg_query_time || 0
      });

      // Update service status based on health
      setServiceStatus(
        healthData.health >= 90
          ? 'healthy'
          : healthData.health > 0
          ? 'unhealthy'
          : 'unknown'
      );

      setError(null);
      setInitializationStatus('Statistics loaded successfully!');
    } catch (err) {
      console.error('Failed to load statistics:', err);
      setError('Failed to load statistics: ' + (err instanceof Error ? err.message : String(err)));
      setServiceStatus('unhealthy');
      setInitializationStatus('Failed to load statistics');
    } finally {
      setStatsLoading(false);
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
      await loadStats(); // Refresh stats after storing
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

      console.log('Searching with query:', searchQuery.trim());
      const response = await window.electronAPI.memory.retrieve_memory(searchQuery.trim(), 5);
      console.log('Search response:', response);
      console.log('Memories with IDs:', response.memories?.map(m => ({ id: m.id, hasId: !!m.id })));

      // Handle the response format from the new dashboard endpoint
      const memoriesArray = response.memories || [];
      setMemories(memoriesArray);
      setError(null);
    } catch (searchError) {
      const err = searchError instanceof Error ? searchError : new Error(String(searchError));
      console.error('Search failed:', err);
      setError('Search failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecall = async (query?: string) => {
    const queryToUse = query || recallQuery;
    if (!queryToUse.trim()) {
      setError('Recall query cannot be empty');
      return;
    }

    setLoading(true);
    try {
      if (!window.electronAPI?.memory) {
        throw new Error('Memory API not available');
      }

      console.log('Recalling with query:', queryToUse.trim());
      const response = await window.electronAPI.memory.recall_memory(queryToUse.trim(), 5);
      console.log('Recall response:', response);

      const memoriesArray = response.memories || [];
      setMemories(memoriesArray);
      setError(null);
      
      // If this was triggered by a button, update the query field
      if (query) {
        setRecallQuery(query);
      }
    } catch (recallError) {
      const err = recallError instanceof Error ? recallError : new Error(String(recallError));
      console.error('Recall failed:', err);
      setError('Recall failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    if (!confirm('Are you sure you want to delete this memory? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      if (!window.electronAPI?.memory) {
        throw new Error('Memory API not available');
      }

      const result = await window.electronAPI.memory.delete_memory(memoryId);
      console.log('Delete result:', result);

      if (result.status === 'success') {
        // Remove the deleted memory from the current view
        setMemories(memories.filter(memory => memory.id !== memoryId));
        await loadStats(); // Refresh stats
        setError(null);
      } else {
        setError(result.message || 'Failed to delete memory');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError('Failed to delete memory: ' + error.message);
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

      const result = await window.electronAPI.memory.optimize_db();
      console.log('Optimize result:', result);

      if (result.status === 'not_implemented') {
        setError('Database optimization feature is not yet implemented');
      } else {
        await loadStats();
        setError(null);
      }
    } catch (err) {
      setError('Failed to optimize database performance: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    setLoading(true);
    setBackupMessage(null);
    try {
      if (!window.electronAPI?.memory) {
        throw new Error('Memory API not available');
      }

      const result = await window.electronAPI.memory.create_backup();
      console.log('Backup result:', result);

      if (result.status === 'success') {
        const message = `✅ Backup created successfully!\n📁 Location: ${result.backup_path}\n📊 Size: ${result.backup_size_mb} MB\n🕒 Timestamp: ${result.timestamp}`;
        setBackupMessage(message);
        setError(null);
      } else if (result.status === 'not_implemented') {
        setError('Database backup feature is not yet implemented');
      } else {
        setError(result.message || 'Failed to create backup');
      }
    } catch (err) {
      setError('Failed to create backup: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTag = async (tags: string | string[]) => {
    const tagArray = Array.isArray(tags) ? tags : [tags];
    const validTags = tagArray.filter(tag => tag && tag.trim());
    
    if (validTags.length === 0) {
      setError('Tag(s) cannot be empty');
      return;
    }

    setLoading(true);
    try {
      if (!window.electronAPI?.memory) {
        throw new Error('Memory API not available');
      }

      // Use the enhanced delete_by_tag method that supports both single and multiple tags
      await window.electronAPI.memory.delete_by_tag(validTags.length === 1 ? validTags[0] : validTags);
      await loadStats();
      setError(null);
      setSearchQuery('');
      setSelectedTags([]);
    } catch (err) {
      setError('Failed to delete memories by tag(s): ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Service status indicator
  const getStatusColor = () => {
    if (statsLoading) return 'text-blue-600';
    switch (serviceStatus) {
      case 'healthy':
        return 'text-green-600';
      case 'unhealthy':
        return 'text-yellow-600';
      default:
        return 'text-red-600';
    }
  };

  const getStatusIcon = () => {
    if (statsLoading) return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
    switch (serviceStatus) {
      case 'healthy':
        return <Database className="w-5 h-5 text-green-600" />;
      case 'unhealthy':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusText = () => {
    if (statsLoading) return 'loading...';
    return serviceStatus;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      {/* Initialization Overlay */}
      {initializing && (
        <div className="fixed inset-0 bg-gray-50 bg-opacity-95 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                Initializing Memory Service
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  {initializationStatus}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`bg-blue-600 h-2 rounded-full transition-all duration-500 ${
                    initializationStatus.includes('Connecting') ? 'w-1/4' :
                    initializationStatus.includes('Loading database') ? 'w-1/2' :
                    initializationStatus.includes('Loading memory') ? 'w-3/4' :
                    initializationStatus.includes('ready') || initializationStatus.includes('successfully') ? 'w-full' :
                    'w-1/8'
                  }`}></div>
                </div>
                <div className="text-xs text-gray-500">
                  Please wait while we initialize the database and load your memory statistics...
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon()}
              Memory Service Dashboard v{VERSION}
              <span className={`text-sm font-normal ${getStatusColor()}`}>
                ({getStatusText()})
              </span>
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
              <button
                onClick={loadStats}
                className="p-2 rounded-lg hover:bg-gray-100"
                disabled={loading || statsLoading}
                title="Refresh Stats"
              >
                <Settings className={`w-5 h-5 ${statsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { id: 'store', icon: Save, label: 'Store Memory' },
              { id: 'search', icon: Search, label: 'Search Memories' },
              { id: 'recall', icon: RefreshCw, label: 'Recall by Time' },
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
            <div className="bg-blue-100 border border-blue-200 text-blue-800 p-4 rounded-md mb-4 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Notice</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {backupMessage && (
            <div className="bg-green-100 border border-green-200 text-green-800 p-4 rounded-md mb-4 flex items-start gap-2">
              <Save className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Backup Success</p>
                <pre className="text-sm mt-1 whitespace-pre-wrap">{backupMessage}</pre>
                <button
                  onClick={() => setBackupMessage(null)}
                  className="text-sm text-green-600 hover:text-green-800 mt-2 underline"
                >
                  Dismiss
                </button>
              </div>
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
                {memories.length === 0 && searchQuery && (
                  <div className="text-gray-500 text-center py-4">
                    No memories found for "{searchQuery}"
                  </div>
                )}
                {memories.map((memory, index) => {
                    // Prefer updated_at, then created_at, then fallback to metadata.timestamp, then fallback to nothing
                    const timestamp =
                      memory.metadata?.updated_at_iso ||
                      (memory.metadata?.updated_at ? new Date(memory.metadata?.updated_at * 1000).toISOString() : null) ||
                      (memory.metadata?.created_at ? new Date(memory.metadata?.created_at * 1000).toISOString() : null) ||
                      memory.metadata?.timestamp ||
                      null;
                    const formattedDate = timestamp
                      ? new Date(timestamp).toLocaleString()
                      : 'Unknown date';

                  return (
                    <Card key={memory.id || index} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm text-gray-500">{formattedDate}</div>
                          <div className="flex items-center gap-2">
                            {memory.similarity && (
                              <div className="text-sm text-gray-500">
                                Similarity: {(memory.similarity * 100).toFixed(1)}%
                              </div>
                            )}
                            {memory.id && (
                              <button
                                onClick={() => handleDeleteMemory(memory.id!)}
                                disabled={loading}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded disabled:opacity-50"
                                title="Delete this memory"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-gray-800">
                            {memory.content.length > 200 ? (
                              <>
                                {expandedIndex === index
                                  ? memory.content
                                  : `${memory.content.slice(0, 200)}...`}
                                <button
                                  className="text-blue-600 hover:underline ml-2"
                                  onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                                >
                                  {expandedIndex === index ? 'Show less' : 'Show more'}
                                </button>
                              </>
                            ) : (
                              memory.content
                            )}
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

          {selectedTab === 'recall' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 p-2 border rounded-md"
                  placeholder="Enter time expression (e.g., 'last week', 'yesterday')..."
                  value={recallQuery}
                  onChange={(e) => setRecallQuery(e.target.value)}
                  disabled={loading}
                />
                <button
                  onClick={() => handleRecall()}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2 disabled:bg-blue-300"
                >
                  <RefreshCw className="w-4 h-4" />
                  Recall
                </button>
              </div>
              
              {/* Quick Filter Buttons */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Quick Filters:</div>
                <div className="flex flex-wrap gap-2">
                  {['today', 'yesterday', 'last week', 'last month', 'last 3 months'].map((timeFilter) => (
                    <button
                      key={timeFilter}
                      onClick={() => handleRecall(timeFilter)}
                      disabled={loading}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm disabled:opacity-50"
                    >
                      {timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {memories.length === 0 && recallQuery && (
                  <div className="text-gray-500 text-center py-4">
                    No memories found for "{recallQuery}"
                  </div>
                )}
                {memories.map((memory, index) => {
                  // Prefer updated_at, then created_at, then fallback to metadata.timestamp, then fallback to nothing
                  const timestamp =
                    memory.metadata?.updated_at_iso ||
                    (memory.metadata?.updated_at ? new Date(memory.metadata?.updated_at * 1000).toISOString() : null) ||
                    (memory.metadata?.created_at ? new Date(memory.metadata?.created_at * 1000).toISOString() : null) ||
                    memory.metadata?.timestamp ||
                    null;
                  const formattedDate = timestamp
                    ? new Date(timestamp).toLocaleString()
                    : 'Unknown date';

                  return (
                    <Card key={memory.id || index} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm text-gray-500">{formattedDate}</div>
                          <div className="flex items-center gap-2">
                            {memory.similarity && (
                              <div className="text-sm text-gray-500">
                                Similarity: {(memory.similarity * 100).toFixed(1)}%
                              </div>
                            )}
                            {memory.id && (
                              <button
                                onClick={() => handleDeleteMemory(memory.id!)}
                                disabled={loading}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded disabled:opacity-50"
                                title="Delete this memory"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-gray-800">
                            {memory.content.length > 200 ? (
                              <>
                                {expandedIndex === index
                                  ? memory.content
                                  : `${memory.content.slice(0, 200)}...`}
                                <button
                                  className="text-blue-600 hover:underline ml-2"
                                  onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                                >
                                  {expandedIndex === index ? 'Show less' : 'Show more'}
                                </button>
                              </>
                            ) : (
                              memory.content
                            )}
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
                  placeholder="Enter tag to add for deletion..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && tagInput.trim()) {
                      const newTag = tagInput.trim();
                      if (!selectedTags.includes(newTag)) {
                        setSelectedTags([...selectedTags, newTag]);
                        setTagInput('');
                      }
                    }
                  }}
                  disabled={loading}
                />
                <button
                  onClick={() => {
                    if (tagInput.trim() && !selectedTags.includes(tagInput.trim())) {
                      setSelectedTags([...selectedTags, tagInput.trim()]);
                      setTagInput('');
                    }
                  }}
                  disabled={loading || !tagInput.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-blue-300"
                >
                  Add Tag
                </button>
              </div>
              
              {/* Selected Tags Display */}
              {selectedTags.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Selected tags to delete:</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-red-100 text-red-800 rounded-md flex items-center gap-2"
                      >
                        {tag}
                        <button
                          onClick={() => setSelectedTags(selectedTags.filter((_, i) => i !== index))}
                          className="text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleDeleteTag(selectedTags.length === 1 ? selectedTags[0] : selectedTags)}
                  disabled={loading || selectedTags.length === 0}
                  className="px-4 py-2 bg-red-600 text-white rounded-md flex items-center gap-2 disabled:bg-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete {selectedTags.length === 1 ? 'Tag' : `${selectedTags.length} Tags`}
                </button>
                <button
                  onClick={() => setSelectedTags([])}
                  disabled={loading || selectedTags.length === 0}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md disabled:bg-gray-300"
                >
                  Clear Selection
                </button>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-md">
                <p className="text-sm">
                  <strong>Warning:</strong> This will permanently delete all memories containing 
                  {selectedTags.length === 1 ? ' the selected tag' : ' any of the selected tags'}.
                  {selectedTags.length > 1 && (
                    <span className="block mt-1">
                      <strong>Note:</strong> Memories with ANY of these tags will be deleted (OR logic).
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-4 mt-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              ) : (
                stats.totalMemories
              )}
            </div>
            <div className="text-sm text-gray-500">Total Memories</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              ) : (
                stats.tagsCount
              )}
            </div>
            <div className="text-sm text-gray-500">Unique Tags</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              ) : (
                `${stats.dbHealth}%`
              )}
            </div>
            <div className="text-sm text-gray-500">Health</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              ) : (
                stats.avgQueryTime
              )}
            </div>
            <div className="text-sm text-gray-500">Avg Query (ms)</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MemoryDashboard;