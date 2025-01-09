"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
// Debug that preload is running
console.log('Preload script starting...');
electron_1.contextBridge.exposeInMainWorld('fs', {
    readFile: async (path, options) => {
        console.log('readFile called with path:', path);
        try {
            const result = await (0, promises_1.readFile)(path, options);
            console.log('readFile successful');
            return result;
        }
        catch (error) {
            console.error('readFile error:', error);
            throw error;
        }
    },
    exists: async (path) => {
        console.log('exists called with path:', path);
        try {
            const exists = (0, fs_1.existsSync)(path);
            console.log('exists check result:', exists);
            return exists;
        }
        catch (error) {
            console.error('exists check error:', error);
            return false;
        }
    }
});
// Debug that preload has finished
console.log('Preload script finished exposing APIs');
