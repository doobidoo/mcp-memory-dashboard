export interface MCPConfig {
  mcpServers: {
    memory: {
      command: string;
      args: string[];
      env?: {
        MCP_MEMORY_CHROMA_PATH?: string;
        MCP_MEMORY_BACKUPS_PATH?: string;
        [key: string]: string | undefined;
      };
    };
  };
  claude: {
    configPath: string;
    available?: boolean;
  };
}

// Load environment variables from import.meta.env
const MEMORY_CHROMA_PATH = import.meta.env.VITE_MEMORY_CHROMA_PATH || "/Users/hkr/Library/Mobile Documents/com~apple~CloudDocs/AI/claude-memory/chroma_db";
const MEMORY_BACKUPS_PATH = import.meta.env.VITE_MEMORY_BACKUPS_PATH || "/Users/hkr/Library/Mobile Documents/com~apple~CloudDocs/AI/claude-memory/backups";
const CLAUDE_CONFIG_PATH = import.meta.env.VITE_CLAUDE_CONFIG_PATH || "/Users/hkr/Library/Application Support/Claude/claude_desktop_config.json";

export const defaultConfig: MCPConfig = {
  mcpServers: {
    memory: {
      command: "uv",
      args: [
        "run",
        "memory"
      ],
      env: {
        MCP_MEMORY_CHROMA_PATH: MEMORY_CHROMA_PATH,
        MCP_MEMORY_BACKUPS_PATH: MEMORY_BACKUPS_PATH
      }
    }
  },
  claude: {
    configPath: CLAUDE_CONFIG_PATH
  }
};
