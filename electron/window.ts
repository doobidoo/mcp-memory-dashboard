import { BrowserWindow, app } from 'electron';
import path from 'path';
import { waitForFile, checkServer } from './utils';

export function createWindow() {
  console.log('🔧 Starting createWindow()...');

  const preloadPath = process.env.NODE_ENV === 'development'
    ? path.join(process.cwd(), 'dist/electron/preload.js')
    : path.join(__dirname, 'preload.js');

  console.log('📄 Preload script path:', preloadPath);
  console.log('📂 Preload file exists:', require('fs').existsSync(preloadPath));

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Memory Dashboard',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
      webSecurity: true,
      sandbox: true,
      webgl: false,
      additionalArguments: [
        `--memory-service-path=${process.env.VITE_MEMORY_SERVICE_PATH}`,
        `--memory-chroma-path=${process.env.VITE_MEMORY_CHROMA_PATH}`,
        `--memory-backups-path=${process.env.VITE_MEMORY_BACKUPS_PATH}`,
        `--claude-config-path=${process.env.VITE_CLAUDE_CONFIG_PATH}`
      ]
    }
  });

  console.log('🪟 BrowserWindow created successfully');

  console.log('Environment variables:', {
    VITE_MEMORY_SERVICE_PATH: process.env.VITE_MEMORY_SERVICE_PATH,
    VITE_MEMORY_CHROMA_PATH: process.env.VITE_MEMORY_CHROMA_PATH,
    VITE_MEMORY_BACKUPS_PATH: process.env.VITE_MEMORY_BACKUPS_PATH,
    VITE_CLAUDE_CONFIG_PATH: process.env.VITE_CLAUDE_CONFIG_PATH,
    MCP_MEMORY_CHROMA_PATH: process.env.MCP_MEMORY_CHROMA_PATH,
    MCP_MEMORY_BACKUPS_PATH: process.env.MCP_MEMORY_BACKUPS_PATH
  });

  win.webContents.on('did-fail-load', (_event, _errorCode, errorDescription) => {
    console.error('Failed to load page:', errorDescription);
    win.reload();
  });

  win.webContents.on('render-process-gone', (_event, details) => {
    console.error('Render process gone:', details.reason);
    if (details.reason === 'crashed') {
      win.destroy();
      createWindow();
    }
  });

  win.webContents.on('did-finish-load', async () => {
    console.log('Window finished loading');
    
    // Add retry logic for memory service connection
    const checkMemoryService = async (retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          console.log(`Attempt ${i + 1} to connect to memory service...`);
          const result = await win.webContents.executeJavaScript(`
            if (window.electronAPI && window.electronAPI.memory) {
              const health = await window.electronAPI.memory.check_database_health();
              console.log('Memory service health:', health);
              return health;
            } else {
              throw new Error('Memory API not available');
            }
          `);
          
          console.log('Memory service connection successful:', result);
          return true;
        } catch (error) {
          console.error(`Memory service connection attempt ${i + 1} failed:`, error);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s between retries
        }
      }
      return false;
    };

    const isConnected = await checkMemoryService();
    if (!isConnected) {
      console.error('Failed to connect to memory service after multiple attempts');
      win.webContents.send('memory-service-error', 'Failed to connect to memory service');
    }
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('Running in development mode');
    const loadDevServer = async () => {
      try {
        const portFile = path.join(process.cwd(), '.vite-port');
        console.log('Looking for port file at:', portFile);
        
        const port = await waitForFile(portFile);
        const url = `http://localhost:${port.trim()}`;
        console.log('Development server URL:', url);
        
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
        // Developer tools removed for cleaner startup - press F12 to open if needed
        // win.webContents.openDevTools();
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('Development server connection error:', error);
        if (!win.isDestroyed()) {
          win.webContents.send('dev-server-error', error.message);
        }
        app.quit();
      }
    };

    setTimeout(loadDevServer, 1000);
  } else {
    console.log('Running in production mode');
    const indexPath = path.join(__dirname, '../index.html');
    console.log('Loading file:', indexPath);
    // Developer tools removed for cleaner startup - press F12 to open if needed
    // win.webContents.openDevTools();
    win.loadFile(indexPath);
  }

  win.on('closed', () => {
    console.log('Window closed');
    win.destroy();
  });

  // Add keyboard shortcut to toggle developer tools
  win.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.shift && input.key.toLowerCase() === 'i') {
      win.webContents.toggleDevTools();
    }
    if (input.key === 'F12') {
      win.webContents.toggleDevTools();
    }
  });
}