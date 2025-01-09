// export interface MCPConfig {
//   mcpServers: {
//     memory: {
//       command: string;
//       args: string[];
//     };
//   };
//   claude: {
//     configPath: string;
//     available?: boolean;
//   };
// }

// export const defaultConfig: MCPConfig = {
//   mcpServers: {
//     memory: {
//       command: "uv",
//       args: [
//         "--directory",
//         import.meta.env.VITE_MEMORY_SERVICE_PATH || "/path/to/mcp-memory-service",
//         "run",
//         "memory-service"
//       ]
//     }
//   },
//   claude: {
//     configPath: "/Users/hkr/Library/Application Support/Claude/claude_desktop_config.json"
//   }
// };

export interface MCPConfig {
  mcpServers: {
    memory: {
      command: string;
      args: string[];
      env?: {  // Add env field to match Claude Desktop config
        MCP_MEMORY_CHROMA_PATH?: string;
        MCP_MEMORY_BACKUPS_PATH?: string;
        [key: string]: string | undefined;  // Allow for additional env variables
      };
    };
  };
  claude: {
    configPath: string;
    available?: boolean;
  };
}

export const defaultConfig: MCPConfig = {
  mcpServers: {
    memory: {
      command: "uv",
      args: [
        "--directory",
        import.meta.env.VITE_MEMORY_SERVICE_PATH || "/path/to/mcp-memory-service",
        "run",
        "memory"
      ],
      env: {
        MCP_MEMORY_CHROMA_PATH: import.meta.env.VITE_MEMORY_CHROMA_PATH || "/Users/hkr/Library/Mobile Documents/com~apple~CloudDocs/AI/claude-memory/chroma_db",
        MCP_MEMORY_BACKUPS_PATH: import.meta.env.VITE_MEMORY_BACKUPS_PATH || "/Users/hkr/Library/Mobile Documents/com~apple~CloudDocs/AI/claude-memory/backups"
      }
    }
  },
  claude: {
    configPath: import.meta.env.VITE_CLAUDE_CONFIG_PATH || "/Users/hkr/Library/Application Support/Claude/claude_desktop_config.json"
  }
};