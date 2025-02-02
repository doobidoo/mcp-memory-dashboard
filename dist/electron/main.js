"use strict";
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");
app.disableHardwareAcceleration();
app.commandLine.appendSwitch("disable-software-rasterizer");
app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-gpu-compositing");
app.commandLine.appendSwitch("disable-gpu-sandbox");
const waitForFile = async (filePath, timeout = 1e4) => {
  const startTime = Date.now();
  console.log(`Waiting for file: ${filePath}`);
  while (Date.now() - startTime < timeout) {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      console.log(`File found with content: ${content}`);
      return content;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timeout waiting for ${filePath}`);
};
const checkServer = (url) => {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(res.statusCode === 200);
      res.resume();
    });
    req.on("error", () => {
      resolve(false);
    });
    req.end();
  });
};
function createWindow() {
  console.log("Creating window...");
  const preloadPath = process.env.NODE_ENV === "development" ? path.join(process.cwd(), "dist/electron/preload.js") : path.join(__dirname, "preload.js");
  console.log("Preload script path:", preloadPath);
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
  win.webContents.on("did-fail-load", (_event, _errorCode, errorDescription) => {
    console.error("Failed to load page:", errorDescription);
    win.reload();
  });
  win.webContents.on("render-process-gone", (_event, details) => {
    console.error("Render process gone:", details.reason);
    if (details.reason === "crashed") {
      win.destroy();
      createWindow();
    }
  });
  win.webContents.on("did-finish-load", () => {
    console.log("Window finished loading");
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
    `).then((available) => {
      if (!available) {
        console.error("Memory service check failed or service unavailable");
        win.webContents.send("service-status", { memory: available });
      }
    }).catch((error) => {
      console.error("Failed to check memory service:", error);
    });
  });
  if (process.env.NODE_ENV === "development") {
    console.log("Running in development mode");
    const loadDevServer = async () => {
      try {
        const portFile = path.join(process.cwd(), ".vite-port");
        console.log("Looking for port file at:", portFile);
        const port = await waitForFile(portFile);
        const url = `http://localhost:${port.trim()}`;
        console.log("Development server URL:", url);
        const testConnection = async (retries = 5) => {
          while (retries > 0) {
            try {
              console.log(`Attempting to connect to ${url} (${retries} retries left)`);
              const isRunning = await checkServer(url);
              if (isRunning) {
                console.log("Successfully connected to development server");
                return true;
              }
            } catch (err) {
              console.log(`Connection attempt failed:`, err);
            }
            await new Promise((resolve) => setTimeout(resolve, 1e3));
            retries--;
          }
          return false;
        };
        const connected = await testConnection();
        if (!connected) {
          throw new Error("Failed to connect to development server after 5 attempts");
        }
        console.log("Loading URL in window:", url);
        await win.loadURL(url);
        win.webContents.openDevTools();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("Development server connection error:", error);
        if (!win.isDestroyed()) {
          win.webContents.send("dev-server-error", error.message);
        }
        app.quit();
      }
    };
    setTimeout(loadDevServer, 1e3);
  } else {
    console.log("Running in production mode");
    const indexPath = path.join(__dirname, "../index.html");
    console.log("Loading file:", indexPath);
    win.loadFile(indexPath);
  }
  win.on("closed", () => {
    console.log("Window closed");
    win.destroy();
  });
}
ipcMain.handle("mcp:use-tool", async (_event, request) => {
  const { server_name, tool_name, arguments: args } = request;
  console.log(`MCP tool request: ${server_name}/${tool_name}`, args);
  return null;
});
app.whenReady().then(() => {
  console.log("App is ready, creating window...");
  createWindow();
});
app.on("window-all-closed", () => {
  console.log("All windows closed");
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("activate", () => {
  console.log("App activated");
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
