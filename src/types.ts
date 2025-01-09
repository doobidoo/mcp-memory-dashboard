export interface MCPConfig {
    mcpServers: {
      memory: {
        args: string[];
      };
    };
    claude: {
      configPath: string;
      available: boolean;
    };
  }

declare global {
  interface Window {
    fs: {
      readFile: (path: string, options: { encoding: BufferEncoding }) => Promise<string>;
      exists: (path: string) => Promise<boolean>;
    };
    [key: string]: any; // allow string indexing
  }
}