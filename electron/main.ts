const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Import types from Electron
import type { IpcMainInvokeEvent } from 'electron';

interface MCPToolRequest {
  server_name: string;
  tool_name: string;
  arguments: Record<string, unknown>;
}

// Event interfaces
interface LoadFailEvent extends Event {
  errorCode: number;
  errorDescription: string;
}

interface ProcessGoneDetails {
  reason: string;
}

// Disable hardware acceleration to prevent GPU process crashes
app.disableHardwareAcceleration();

// Network service stability improvements
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-gpu-sandbox');

// Function to wait for file to exist and read its content
const waitForFile = async (filePath: string, timeout = 10000): Promise<string> => {
  const startTime = Date.now();
  console.log(`Waiting for file: ${filePath}`);
  
  while (Date.now() - startTime < timeout) {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      console.log(`File found with content: ${content}`);
      return content;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Timeout waiting for ${filePath}`);
};

// Function to check if server is running
const checkServer = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const req = http.get(url, (res: any) => {
      resolve(res.statusCode === 200);
      res.resume();
    });

    req.on('error', () => {
      resolve(false);
    });

    req.end();
  });
};

function createWindow() {
  console.log('Creating window...');

  // Get the correct preload script path based on environment
  const preloadPath = process.env.NODE_ENV === 'development'
    ? path.join(process.cwd(), 'dist/electron/preload.js')
    : path.join(__dirname, 'preload.js');

  console.log('Preload script path:', preloadPath);

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
      webSecurity: true,
      sandbox: true,
      webgl: false
    }
  });

  // Enhanced error handling
  win.webContents.on('did-fail-load', (_event: LoadFailEvent, _errorCode: number, errorDescription: string) => {
    console.error('Failed to load page:', errorDescription);
    win.reload();
  });

  // Handle render process crashes
  win.webContents.on('render-process-gone', (_event: Event, details: ProcessGoneDetails) => {
    console.error('Render process gone:', details.reason);
    if (details.reason === 'crashed') {
      win.destroy();
      createWindow();
    }
  });

  // Handle successful page load
  win.webContents.on('did-finish-load', () => {
    console.log('Window finished loading');
    // Check if the memory service is available
    win.webContents.executeJavaScript(`
      try {
        const memoryServiceAvailable = !!(window.electronAPI && window.electronAPI.memory);
        console.log('Memory service available:', memoryServiceAvailable);
        if (!memoryServiceAvailable) {
          console.error('Memory service not available in renderer process');
        }
        return memoryServiceAvailable;
      } catch (error) {
        console.error('Error checking memory service:', error);
        return false;
      }
    `)
    .then((available: boolean) => {
      if (!available) {
        console.error('Memory service check failed or service unavailable');
        win.webContents.send('service-status', { memory: available });
      }
    })
    .catch((error: Error) => {
      console.error('Failed to check memory service:', error);
    });
  });

  // Development
  if (process.env.NODE_ENV === 'development') {
    console.log('Running in development mode');
    const loadDevServer = async () => {
      try {
        // Look for port file in project root
        const portFile = path.join(process.cwd(), '.vite-port');
        console.log('Looking for port file at:', portFile);
        
        const port = await waitForFile(portFile);
        const url = `http://localhost:${port.trim()}`;
        console.log('Development server URL:', url);
        
        // Test if Vite server is ready
        const testConnection = async (retries = 5): Promise<boolean> => {
          while (retries > 0) {
            try {
              console.log(`Attempting to connect to ${url} (${retries} retries left)`);
              const isRunning = await checkServer(url);
              if (isRunning) {
                console.log('Successfully connected to development server');
                return true;
              }
            } catch (err) {
              console.log(`Connection attempt failed:`, err);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
            retries--;
          }
          return false;
        };

        const connected = await testConnection();
        if (!connected) {
          throw new Error('Failed to connect to development server after 5 attempts');
        }

        console.log('Loading URL in window:', url);
        await win.loadURL(url);
        win.webContents.openDevTools();
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('Development server connection error:', error);
        if (!win.isDestroyed()) {
          win.webContents.send('dev-server-error', error.message);
        }
        app.quit();
      }
    };

    // Wait for Vite to start before attempting to connect
    setTimeout(loadDevServer, 1000);
  } else {
    console.log('Running in production mode');
    const indexPath = path.join(__dirname, '../index.html');
    console.log('Loading file:', indexPath);
    win.loadFile(indexPath);
  }

  win.on('closed', () => {
    console.log('Window closed');
    win.destroy();
  });
}

// Handle IPC messages
ipcMain.handle('mcp:use-tool', async (_event: IpcMainInvokeEvent, request: MCPToolRequest): Promise<unknown> => {
  const { server_name, tool_name, arguments: args } = request;
  console.log(`MCP tool request: ${server_name}/${tool_name}`, args);
  // Forward to appropriate MCP server handler
  // This will be implemented based on the MCP server configuration
  return null;
});

app.whenReady().then(() => {
  console.log('App is ready, creating window...');
  createWindow();
});

app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  console.log('App activated');
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});