import MemoryDashboard from '@/MemoryDashboard';
import { defaultConfig } from './config';

function App() {
  // Check if configuration is valid
  if (!import.meta.env.VITE_MEMORY_SERVICE_PATH) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4">Configuration Required</h1>
          <p className="mb-4">
            Please create a <code>.env</code> file in the root of your project with:
          </p>
          <pre className="bg-gray-100 p-4 rounded mb-4">
            VITE_MEMORY_SERVICE_PATH=/path/to/mcp-memory-service
          </pre>
          <p className="mb-4">
            Current value: {import.meta.env.VITE_MEMORY_SERVICE_PATH || 'Not set'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MemoryDashboard config={defaultConfig} />
    </div>
  );
}

export default App;
