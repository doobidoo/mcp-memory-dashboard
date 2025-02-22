"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const readFileAsync = (0, util_1.promisify)(fs_1.default.readFile);
const existsAsync = (0, util_1.promisify)(fs_1.default.exists);
console.log('Preload script starting...');
// Create MCP client for memory service
const mcpClient = {
    use_mcp_tool: async ({ server_name, tool_name, arguments: args }) => {
        try {
            console.log(`Calling MCP tool: ${server_name}/${tool_name}`, args);
            const result = await electron_1.ipcRenderer.invoke('mcp:use-tool', {
                server_name,
                tool_name,
                arguments: args
            });
            return result;
        }
        catch (error) {
            console.error(`MCP tool error (${server_name}/${tool_name}):`, error);
            throw error;
        }
    }
};
// Initialize memory service with error handling
let memoryService = null;
try {
    console.log('Initializing memory service...');
    const { MemoryService } = require('../src/services/memory');
    memoryService = new MemoryService(mcpClient);
    console.log('Memory service initialized successfully');
}
catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to initialize memory service:', errorMessage);
    electron_1.ipcRenderer.send('service-error', {
        service: 'memory',
        error: errorMessage
    });
}
// Check if memory service is available
if (!memoryService) {
    console.error('Memory service not available');
    electron_1.ipcRenderer.send('service-status', { memory: false });
}
else {
    electron_1.ipcRenderer.send('service-status', { memory: true });
}
// Expose APIs to renderer
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    memory: memoryService ? {
        store_memory: async (content, metadata) => {
            console.log('Storing memory:', { content, metadata });
            return memoryService.store_memory({ content, metadata });
        },
        retrieve_memory: async (query, n_results) => {
            console.log('Retrieving memory:', { query, n_results });
            return memoryService.retrieve_memory({ query, n_results });
        },
        search_by_tag: async (tags) => {
            console.log('Searching by tags:', tags);
            return memoryService.search_by_tag({ tags });
        },
        delete_by_tag: async (tag) => {
            console.log('Deleting by tag:', tag);
            return memoryService.delete_by_tag({ tag });
        },
        check_database_health: async () => {
            console.log('Checking database health');
            return memoryService.check_database_health();
        },
        get_stats: async () => {
            console.log('Getting stats');
            return memoryService.get_stats();
        },
        optimize_db: async () => {
            console.log('Optimizing database');
            return memoryService.optimize_db();
        },
        create_backup: async () => {
            console.log('Creating backup');
            return memoryService.create_backup();
        }
    } : null,
    fs: {
        readFile: async (path, options) => {
            console.log('readFile called with path:', path);
            try {
                const result = await readFileAsync(path, options);
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
                const exists = await existsAsync(path);
                console.log('exists check result:', exists);
                return exists;
            }
            catch (error) {
                console.error('exists check error:', error);
                return false;
            }
        }
    }
});
console.log('Preload script finished exposing APIs');
//# sourceMappingURL=preload.js.map