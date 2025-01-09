"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
function createWindow() {
    const win = new electron_1.BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true, // Enable Node integration
            contextIsolation: true,
            sandbox: false, // Disable sandbox
            preload: path_1.default.join(__dirname, 'preload.js') // Make sure this path is correct
        }
    });
    // Development
    if (process.env.NODE_ENV === 'development') {
        win.loadURL('http://localhost:5175'); // Note: using your port 5175
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
electron_1.app.whenReady().then(() => {
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
