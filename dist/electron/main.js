import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true, // Enable Node integration
            contextIsolation: true,
            sandbox: false, // Disable sandbox
            preload: path.join(__dirname, 'preload.js') // Using __dirname from ES modules
        }
    });
    // Development
    if (process.env.NODE_ENV === 'development') {
        win.loadURL('http://localhost:5176'); // Vite dev server port
        // Open DevTools in development
        win.webContents.openDevTools();
    }
    else {
        // Production
        win.loadFile('dist/index.html');
    }
    // Debug preload script loading
    win.webContents.on('did-finish-load', () => {
        console.log('Window loaded, preload script should be active');
    });
}
app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
