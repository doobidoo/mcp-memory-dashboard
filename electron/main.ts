import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import { createWindow } from './window';
import { promisify } from 'util';

// Load environment variables from .env file
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
  console.log(`Forwarding MCP tool request: ${server_name}/${tool_name}`, { args, cwd: process.cwd() });
  
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

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
}