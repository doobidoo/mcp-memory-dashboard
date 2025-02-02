import { contextBridge } from 'electron';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
// Debug that preload is running
console.log('Preload script starting...');
contextBridge.exposeInMainWorld('fs', {
    readFile: async (path, options) => {
        console.log('readFile called with path:', path);
        try {
            const result = await readFile(path, options);
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
            const exists = existsSync(path);
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
