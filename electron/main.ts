import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import { createWindow } from './window';
import { promisify } from 'util';
import DirectChromaHandler from './directChroma';

// Load environment variables from .env file
console.log('🔧 Starting main process...');

const envPath = path.join(process.cwd(), '.env');
console.log('Loading environment variables from:', envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
} else {
  console.log('Environment variables loaded successfully');
  // Set MCP environment variables from VITE versions
  process.env.MCP_MEMORY_CHROMA_PATH = process.env.VITE_MEMORY_CHROMA_PATH;
  process.env.MCP_MEMORY_BACKUPS_PATH = process.env.VITE_MEMORY_BACKUPS_PATH;
  console.log('Set MCP environment variables:', {
    MCP_MEMORY_CHROMA_PATH: process.env.MCP_MEMORY_CHROMA_PATH,
    MCP_MEMORY_BACKUPS_PATH: process.env.MCP_MEMORY_BACKUPS_PATH
  });
}

console.log('🎯 App initialization complete, waiting for ready event...');

// Initialize Direct ChromaDB Handler (GitHub Issue #11 Solution)
let directChromaHandler: DirectChromaHandler | null = null;

// Check if direct database access is enabled
const useDirectAccess = process.env.VITE_USE_DIRECT_CHROMA_ACCESS === 'true';
console.log('Direct ChromaDB access enabled:', useDirectAccess);

if (useDirectAccess) {
  const chromaPath = process.env.VITE_MEMORY_CHROMA_PATH || process.env.MCP_MEMORY_CHROMA_PATH;
  const backupsPath = process.env.VITE_MEMORY_BACKUPS_PATH || process.env.MCP_MEMORY_BACKUPS_PATH;
  
  if (chromaPath && backupsPath) {
    directChromaHandler = new DirectChromaHandler({
      chromaPath,
      backupsPath
    });
    
    console.log('✅ Initialized Direct ChromaDB Handler - Eliminates MCP service duplication');
  } else {
    console.warn('⚠️  Direct ChromaDB access requested but paths not configured');
  }
}

console.log('🔧 Setting up app event handlers...');

// Add error handlers to debug what's causing the quit
app.on('will-quit', (event) => {
  console.log('⚠️ App will-quit event triggered');
});

console.log('🔧 Setting up window-all-closed handler...');

// Check if app is already ready
if (app.isReady()) {
  console.log('🎉 App was already ready!');
} else {
  console.log('⏳ App not ready yet, waiting...');
}

// Add more comprehensive error handling
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});

app.on('ready', () => {
  console.log('🎊 App ready event fired!');
});

// Single instance lock check
console.log('🔒 Requesting single instance lock...');
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.log('❌ Failed to get single instance lock, quitting...');
  app.quit();
} else {
  console.log('✅ Got single instance lock');
  
  app.on('second-instance', () => {
    console.log('🔄 Second instance detected');
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
}

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

// Handle file system operations
const readFileAsync = promisify(fs.readFile);
const existsAsync = promisify(fs.exists);

ipcMain.handle('fs:readFile', async (_event: IpcMainInvokeEvent, { path, options }: { path: string, options?: { encoding?: BufferEncoding } }) => {
  try {
    console.log('Main process reading file:', path);
    const result = await readFileAsync(path, options);
    return result;
  } catch (error) {
    console.error('Main process readFile error:', error);
    throw error;
  }
});

ipcMain.handle('fs:exists', async (_event: IpcMainInvokeEvent, { path }: { path: string }) => {
  try {
    console.log('Main process checking file exists:', path);
    const exists = await existsAsync(path);
    return exists;
  } catch (error) {
    console.error('Main process exists error:', error);
    return false;
  }
});

// Handle IPC messages
ipcMain.handle('mcp:use-tool', async (_event: IpcMainInvokeEvent, request: MCPToolRequest): Promise<unknown> => {
  const { server_name, tool_name, arguments: args } = request;
  console.log(`Handling MCP tool request: ${server_name}/${tool_name}`, { args, useDirectAccess });
  
  // GitHub Issue #11 Solution: Use direct ChromaDB access if enabled
  if (useDirectAccess && directChromaHandler && server_name === 'memory') {
    console.log('🚀 Using Direct ChromaDB Access - No MCP service spawning');
    
    try {
      // Map MCP tool names to direct handler methods
      switch (tool_name) {
        case 'store_memory':
          return await directChromaHandler.handleDirectRequest('direct-chroma:store', args);
        case 'dashboard_retrieve_memory':
        case 'retrieve_memory':
          return await directChromaHandler.handleDirectRequest('direct-chroma:retrieve', args);
        case 'dashboard_search_by_tag':
        case 'search_by_tag':
          return await directChromaHandler.handleDirectRequest('direct-chroma:search-by-tag', args);
        case 'delete_by_tag':
          return await directChromaHandler.handleDirectRequest('direct-chroma:delete-by-tag', args);
        case 'dashboard_get_stats':
        case 'get_stats':
          return await directChromaHandler.handleDirectRequest('direct-chroma:get-stats', args);
        case 'dashboard_check_health':
        case 'check_database_health':
          return await directChromaHandler.handleDirectRequest('direct-chroma:check-health', args);
        case 'dashboard_optimize_db':
        case 'optimize_db':
          return await directChromaHandler.handleDirectRequest('direct-chroma:optimize', args);
        case 'dashboard_create_backup':
        case 'create_backup':
          return await directChromaHandler.handleDirectRequest('direct-chroma:backup', args);
        default:
          throw new Error(`Unsupported tool: ${tool_name}`);
      }
    } catch (error) {
      console.error('Direct ChromaDB access error, falling back to MCP:', error);
      // Fall through to MCP approach below
    }
  }
  
  // Fallback to original MCP spawning approach (GitHub Issue #11 - Option 3)
  console.log('⚠️  Using MCP service spawning approach');
  
  try {
    const configPath = process.env.VITE_CLAUDE_CONFIG_PATH;
    if (!configPath) {
      throw new Error(`VITE_CLAUDE_CONFIG_PATH environment variable not set. Available env vars: ${Object.keys(process.env).filter(key => key.startsWith('VITE_')).join(', ')}`);
    }

    console.log('Reading MCP config from:', configPath);
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    console.log('Available MCP servers:', Object.keys(config.mcpServers));
    const serverConfig = config.mcpServers[server_name];
    
    if (!serverConfig) {
      throw new Error(`MCP server "${server_name}" not found in configuration. Available servers: ${Object.keys(config.mcpServers).join(', ')}`);
    }

    const { spawn } = require('child_process');
    console.log(`Spawning MCP server process:`, {
      command: serverConfig.command,
      args: serverConfig.args,
      cwd: process.env.VITE_MEMORY_SERVICE_PATH,
      env: Object.keys({ ...process.env, ...serverConfig.env })
    });

    const serverProcess = spawn(serverConfig.command, serverConfig.args, {
      env: { 
        ...process.env, 
        ...serverConfig.env,
        PYTHONPATH: process.env.VITE_MEMORY_SERVICE_PATH,
        MCP_MEMORY_CHROMA_PATH: process.env.MCP_MEMORY_CHROMA_PATH || process.env.VITE_MEMORY_CHROMA_PATH,
        MCP_MEMORY_BACKUPS_PATH: process.env.MCP_MEMORY_BACKUPS_PATH || process.env.VITE_MEMORY_BACKUPS_PATH
      },
      cwd: process.env.VITE_MEMORY_SERVICE_PATH,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    console.log('MCP server process spawned with:', {
      pid: serverProcess.pid,
      command: serverConfig.command,
      args: serverConfig.args,
      cwd: process.env.VITE_MEMORY_SERVICE_PATH,
      env: {
        PYTHONPATH: process.env.VITE_MEMORY_SERVICE_PATH,
        MCP_MEMORY_CHROMA_PATH: process.env.MCP_MEMORY_CHROMA_PATH || process.env.VITE_MEMORY_CHROMA_PATH,
        MCP_MEMORY_BACKUPS_PATH: process.env.MCP_MEMORY_BACKUPS_PATH || process.env.VITE_MEMORY_BACKUPS_PATH
      }
    });

    // Initialize the MCP server with proper handshake
    const initRequest = {
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        clientInfo: {
          name: 'mcp-memory-dashboard',
          version: '0.1.0'
        }
      },
      id: 1
    };

    console.log('Sending MCP initialize request:', initRequest);
    serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');

    return new Promise((resolve, reject) => {
      let response = '';
      let initComplete = false;
      let responseReceived = false;
      
      const toolRequest = {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: tool_name,
          arguments: args
        },
        id: 2
      };
      
      serverProcess.stdout.on('data', (data: Buffer) => {
        const dataStr = data.toString();
        console.log('Raw MCP server response:', dataStr);
        response += dataStr;
        
        // Look for complete JSON responses
        const lines = response.split('\n');
        
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (!line || responseReceived) continue;
          
          try {
            const result = JSON.parse(line);
            console.log('Parsed MCP response:', result);
            
            if (result.jsonrpc === '2.0' && typeof result.id !== 'undefined') {
              // Handle initialization response
              if (result.id === 1 && !initComplete) {
                if (result.error) {
                  console.error('MCP initialization failed:', result.error);
                  reject(new Error(result.error.message || JSON.stringify(result.error)));
                  serverProcess.kill();
                  return;
                }
                
                console.log('MCP initialization successful:', result.result);
                initComplete = true;
                
                // Send the initialized notification (required by MCP protocol)
                const initializedNotification = {
                  jsonrpc: '2.0',
                  method: 'notifications/initialized'
                };
                
                console.log('Sending initialized notification:', initializedNotification);
                serverProcess.stdin.write(JSON.stringify(initializedNotification) + '\n');
                
                // Send the actual tool call
                console.log('Sending tool request:', toolRequest);
                serverProcess.stdin.write(JSON.stringify(toolRequest) + '\n');
                continue;
              }
              
              // Handle tool call response
              if (result.id === 2 && initComplete) {
                responseReceived = true;
                
                if (result.error) {
                  console.error('MCP tool call failed:', result.error);
                  reject(new Error(result.error.message || JSON.stringify(result.error)));
                } else {
                  console.log('MCP tool call successful:', result.result);
                  resolve(result.result);
                }
                serverProcess.kill();
                return;
              }
            }
          } catch (err) {
            console.log('Non-JSON line (probably diagnostic):', line);
            // Continue processing, this might just be diagnostic output
          }
        }
        
        // Keep the last incomplete line
        response = lines[lines.length - 1];
      });

      serverProcess.stderr.on('data', (data: Buffer) => {
        console.error('MCP server stderr:', data.toString());
        // Don't reject immediately on stderr, wait for process to exit
      });

      serverProcess.on('error', (err: Error) => {
        console.error('Failed to start MCP server:', err);
        reject(new Error(`Failed to start MCP server: ${err.message}`));
      });

      serverProcess.on('exit', (code: number | null, signal: string | null) => {
        if (code !== 0 && code !== null) {
          console.error(`MCP server exited with code ${code}, signal ${signal}`);
          reject(new Error(`MCP server exited with code ${code}`));
        }
      });

      setTimeout(() => {
        if (!responseReceived) {
          console.error('MCP server request timed out after 60 seconds');
          console.error('Init complete:', initComplete);
          console.error('Final accumulated response:', response);
          serverProcess.kill();
          reject(new Error('MCP server request timed out'));
        }
      }, 60000);
    });
  } catch (error) {
    console.error('Error handling MCP tool request:', error instanceof Error ? error.message : error);
    throw error;
  }
});

app.whenReady().then(() => {
  console.log('🎉 App is ready, creating window...');
  
  // Initialize Direct ChromaDB Handler IPC if enabled
  if (directChromaHandler) {
    directChromaHandler.setupIpcHandlers();
    console.log('✅ Direct ChromaDB IPC handlers initialized');
  }
  
  console.log('📱 Calling createWindow()...');
  createWindow();
  console.log('✅ createWindow() completed');
}).catch(error => {
  console.error('❌ Error in app.whenReady():', error);
});

app.on('window-all-closed', async () => {
  console.log('All windows closed');
  
  // Cleanup DirectChromaHandler resources (Docker containers, etc.)
  if (directChromaHandler) {
    console.log('🧹 Cleaning up Direct ChromaDB Handler...');
    try {
      await directChromaHandler.cleanup();
      console.log('✅ Direct ChromaDB cleanup completed');
    } catch (error) {
      console.error('❌ Error during DirectChromaHandler cleanup:', error);
    }
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

let isQuitting = false;

app.on('before-quit', async (event) => {
  console.log('App is about to quit, cleaning up resources...');
  
  // Prevent infinite cleanup loop
  if (isQuitting) {
    console.log('🔄 Already quitting, allowing immediate exit');
    return;
  }
  
  // Cleanup DirectChromaHandler resources before quitting
  if (directChromaHandler) {
    event.preventDefault(); // Prevent immediate quit only once
    isQuitting = true;
    
    console.log('🧹 Performing cleanup before quit...');
    try {
      await directChromaHandler.cleanup();
      console.log('✅ Cleanup completed, quitting app');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    } finally {
      app.quit(); // Always quit after cleanup attempt
    }
  }
});

app.on('activate', () => {
  console.log('App activated');
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

