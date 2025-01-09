/// <reference types="vite/client" />

import * as React from 'react';
import MemoryDashboard from "./MemoryDashboard";
import { defaultConfig } from './config';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from './components/ui/alert';


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

      // Verify Claude configuration
      updatedConfig.claude.available = false;
      try {
        const fileExists = await window.fs.exists(updatedConfig.claude.configPath);
        if (fileExists) {
          const configContent = await window.fs.readFile(updatedConfig.claude.configPath, {
            encoding: 'utf-8'
          });
          // Verify it's valid JSON
          JSON.parse(configContent);
          updatedConfig.claude.available = true;
          console.info(`Claude configuration successfully loaded from ${updatedConfig.claude.configPath}`);
        } else {
          console.info(`Claude integration is optional - configuration not found at ${updatedConfig.claude.configPath}`);
        }
      } catch (error) {
        if (error instanceof SyntaxError) {
          console.error(`Invalid Claude configuration at ${updatedConfig.claude.configPath}:`, error);
        } else {
          console.error(`Error checking Claude configuration:`, error);
        }
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

  const ErrorFallback = ({ error }: { error: Error }) => (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Alert variant="destructive">
          <AlertDescription>
            <p className="font-medium">Something went wrong:</p>
            <p>{error.message}</p>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );

  if (configErrors.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4">Configuration Required</h1>
          <h2 className="text-xl font-semibold mb-4">Configuration Errors</h2>
          {configErrors.length > 0 && (
            <ul className="list-disc list-inside mb-4">
              {configErrors.map((error, index) => (
                <li key={index} className="text-red-600 mb-2">{error}</li>
              ))}
            </ul>
          )}
          
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

            {!config.claude.available && (
              <div>
                <h3 className="font-medium mb-2">Claude Integration (Optional)</h3>
                <p className="mb-2">
                  Claude Desktop configuration path:
                </p>
                <pre className="bg-gray-100 p-4 rounded mb-2">
                  {config.claude.configPath}
                </pre>
                <p className="text-sm text-gray-600">
                  Note: Claude integration is optional. The app will work without it, but some features may be limited.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <MemoryDashboard 
          mcpServers={config.mcpServers} 
          claude={{
            configPath: config.claude.configPath,
            available: config.claude.available ?? false
          }} 
        />
      </ErrorBoundary>
    </div>
  );
}

class ErrorBoundary extends React.Component<
  { 
    children: React.ReactNode;
    FallbackComponent: React.ComponentType<{ error: Error }> 
  },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { 
    children: React.ReactNode;
    FallbackComponent: React.ComponentType<{ error: Error }> 
  }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const { FallbackComponent } = this.props;
      return <FallbackComponent error={this.state.error} />;
    }

    return this.props.children;
  }
}

export default App;
