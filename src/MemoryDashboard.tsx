interface Memory {
  content: string;
  tags?: string[];
  similarity?: number;
}

//import path from 'path';
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/card';
import { Alert, AlertDescription } from './components/ui/alert';
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

const MemoryDashboard = ({  }: MemoryDashboardProps) => {

  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [config, setConfig] = useState(null);
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


  useEffect(() => {
    const loadConfig = async () => {
      try {
        const configPath = import.meta.env.VITE_CLAUDE_CONFIG_PATH || 
                          "/Users/hkr/Library/Application Support/Claude/claude_desktop_config.json";
        
        console.log('Debug info:', {
          configPath,
          fsAvailable: !!window.fs,
          fsMethods: window.fs ? Object.keys(window.fs) : [],
          envVars: import.meta.env
        });

        // First check if file exists
        if (window.fs.exists) {
          const exists = await window.fs.exists(configPath);
          if (!exists) {
            throw new Error(`Config file does not exist at path: ${configPath}`);
          }
          console.log('Config file exists:', exists);
        }

        // Try to read the file
        const configContent = await window.fs.readFile(configPath, { encoding: 'utf8' });
        console.log('Raw config content:', configContent);

        // Try to parse the content
        const configData = JSON.parse(configContent);
        console.log('Parsed config:', configData);

        if (!configData || !configData.mcpServers?.memory) {
          throw new Error('Memory service configuration not found in config');
        }

        setConfig(configData.mcpServers.memory);
        setConfigError(null);
        await loadStats();
      } catch (err) {
        console.error('Full error details:', {
          error: err,
          message: err.message,
          stack: err.stack
        });
        setConfigError(`Configuration error: ${(err as Error).message}`);
      } finally {
        setConfigLoading(false);
      }
    };

    loadConfig();
  }, []);

  const callMCPTool = async (toolName: string, params = {}) => {
    if (!config) throw new Error('Configuration not loaded');
    try {
      const result = await window[toolName](params);
      return result;
    } catch (error: unknown) {  // Type the error as unknown
      const err = error as Error;  // Type assertion
      console.error(`Error calling ${toolName}:`, err);
      throw err;
    }
  };

  const loadStats = async () => {
    try {
      const [healthData, dbStats] = await Promise.all([
        callMCPTool('check_database_health'),
        callMCPTool('get_stats')
      ]);
      
      setStats({
        totalMemories: dbStats?.totalMemories || 0,
        tagsCount: dbStats?.uniqueTags || 0,
        dbHealth: healthData?.health || 100,
        avgQueryTime: healthData?.avgQueryTime || 0
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
      const tagArray = tags.split(',').map(tag => tag.trim()).filter(Boolean);
      const result = await callMCPTool('store_memory', {
        content: content.trim(),
        metadata: {
          tags: tagArray,
          type: 'user-input'
        }
      });

      if (result) {
        setContent('');
        setTags('');
        setError(null);
        await loadStats();
      }
    } catch (error: unknown) {  // Type the error
      const err = error as Error;
      setError('Failed to store memory: ' + err.message);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Search query cannot be empty');
      return;
    }

    setLoading(true);
    try {
      const results = await callMCPTool('retrieve_memory', {
        query: searchQuery.trim(),
        n_results: 5
      });

      setMemories(results);
      setError(null);
    } catch (err: unknown) {  // Add ': unknown' here
      setError('Search failed: ' + (err as Error).message);  // Add '(err as Error)' here
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    setLoading(true);
    try {
      await callMCPTool('optimize_db');
      await loadStats();
      setError(null);
    } catch (err) {
      setError('Failed to optimize database: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    try {
      await callMCPTool('create_backup');
      setError(null);
    } catch (err) {
      setError('Failed to create backup: ' + (err as Error).message);
    }
  };

  const handleDeleteTag = async (tag: string) => {
    if (!tag.trim()) {
      setError('Tag cannot be empty');
      return;
    }

    setLoading(true);
    try {
      await callMCPTool('delete_by_tag', { tag: tag.trim() });
      await loadStats();
      setError(null);
      setSearchQuery('');
    } catch (err) {
      setError('Failed to delete tag: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (configLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4">
        <Alert variant="default" >
          <AlertDescription>{configError}</AlertDescription>
        </Alert>
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configuration Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Required configuration in claude_desktop_config.json:</p>
            <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto">
{`{
  "mcpServers": {
    "memory": {
      "command": "uv",
      "args": [
        "--directory",
        "/path/to/mcp-memory-service",
        "run",
        "memory-service"
      ]
    }
  }
}`}
            </pre>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <Alert variant="default" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
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
                {memories.map((memory, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <p className="text-gray-800">{memory.content}</p>
                      <div className="flex gap-2 mt-2">
                        {memory.tags?.map((tag, tagIndex) => (
                          <span key={tagIndex} className="px-2 py-1 bg-gray-100 rounded-md text-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                      {memory.similarity && (
                        <div className="mt-2 text-sm text-gray-500">
                          Similarity: {(memory.similarity * 100).toFixed(1)}%
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
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