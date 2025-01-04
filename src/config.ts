export interface MCPConfig {
  mcpServers: {
    memory: {
      command: string;
      args: string[];
    };
  };
  claude: {
    configPath: string;
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
        "memory-service"
      ]
    }
  },
  claude: {
    configPath: "/Users/hkr/Library/Application Support/Claude/claude_desktop_config.json"
  }
};
