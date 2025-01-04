import MemoryDashboard from '@/MemoryDashboard';
import { defaultConfig } from './config';

import { useEffect, useState } from 'react';

function App() {
  const [configErrors, setConfigErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState(defaultConfig);

  useEffect(() => {
    const initializeApp = async () => {
      const errors = [];
      const updatedConfig = {
        ...defaultConfig,
        mcpServers: {
          memory: {
            ...defaultConfig.mcpServers.memory,
            args: [
              "--directory",
              import.meta.env.VITE_MEMORY_SERVICE_PATH || "/path/to/mcp-memory-service",
              "run",
              "memory-service"
            ]
          }
        }
      };

      if (!import.meta.env.VITE_MEMORY_SERVICE_PATH) {
        errors.push("VITE_MEMORY_SERVICE_PATH is not set in .env file");
      }

      try {
        await window.fs.readFile(updatedConfig.claude.configPath, { 
          encoding: 'utf-8' 
        });
      } catch (error) {
        errors.push(`Claude configuration not found at ${updatedConfig.claude.configPath}`);
      }

      setConfig(updatedConfig);
      setConfigErrors(errors);
      setIsLoading(false);
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  if (configErrors.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4">Configuration Required</h1>
          <h2 className="text-xl font-semibold mb-4">Configuration Errors</h2>
          <ul className="list-disc list-inside mb-4">
            {configErrors.map((error, index) => (
              <li key={index} className="text-red-600 mb-2">{error}</li>
            ))}
          </ul>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Memory Service Configuration</h3>
              <p className="mb-2">
                Please create a <code>.env</code> file in the root of your project with:
              </p>
              <pre className="bg-gray-100 p-4 rounded mb-2">
                VITE_MEMORY_SERVICE_PATH=/path/to/mcp-memory-service
              </pre>
              <p>
                Current value: {import.meta.env.VITE_MEMORY_SERVICE_PATH || 'Not set'}
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Claude Configuration</h3>
              <p>
                Please ensure Claude Desktop is installed and configured at:
              </p>
              <pre className="bg-gray-100 p-4 rounded mt-2">
                {config.claude.configPath}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MemoryDashboard config={config} />
    </div>
  );
}

export default App;
