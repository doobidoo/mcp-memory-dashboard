import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import { createWindow } from './window';

// Load environment variables from .env file
const envPath = path.join(process.cwd(), '.env');
console.log('Loading environment variables from:', envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
} else {
  console.log('Environment variables loaded successfully');
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
        MCP_MEMORY_CHROMA_PATH: process.env.MCP_MEMORY_CHROMA_PATH,
        MCP_MEMORY_BACKUPS_PATH: process.env.MCP_MEMORY_BACKUPS_PATH
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
        MCP_MEMORY_CHROMA_PATH: process.env.MCP_MEMORY_CHROMA_PATH,
        MCP_MEMORY_BACKUPS_PATH: process.env.MCP_MEMORY_BACKUPS_PATH
      }
    });

    const jsonRpcRequest = {
      jsonrpc: '2.0',
      method: 'callTool',
      params: {
        name: tool_name,
        arguments: args
      },
      id: Date.now()
    };

    console.log('Sending JSON-RPC request:', jsonRpcRequest);
    serverProcess.stdin.write(JSON.stringify(jsonRpcRequest) + '\n');

    return new Promise((resolve, reject) => {
      let response = '';
      
      serverProcess.stdout.on('data', (data: Buffer) => {
        console.log('Raw MCP server response:', data.toString());
        response += data.toString();
        if (response.includes('\n')) {
          try {
            const result = JSON.parse(response);
            if (result.error) {
              console.error('MCP server returned error:', result.error);
              reject(new Error(result.error.message));
              serverProcess.kill();
            } else {
              console.log('MCP server returned result:', result.result);
              resolve(result.result);
            }
            serverProcess.kill();
          } catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            console.error('Error parsing MCP server response:', error);
            console.error('Raw response was:', response);
            reject(new Error(`Failed to parse MCP server response: ${error}`));
            serverProcess.kill();
          }
        }
      });

      serverProcess.stderr.on('data', (data: Buffer) => {
        console.error('MCP server stderr:', data.toString());
        reject(new Error(`MCP server error: ${data}`));
        serverProcess.kill();
      });

      serverProcess.on('error', (err: Error) => {
        console.error('Failed to start MCP server:', err);
        reject(new Error(`Failed to start MCP server: ${err.message}`));
        serverProcess.kill();
      });

      setTimeout(() => {
        console.error('MCP server request timed out');
        serverProcess.kill();
        reject(new Error('MCP server request timed out'));
      }, 30000);
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