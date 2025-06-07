# MCP Memory Dashboard

A professional desktop application for managing and interacting with the **MCP Memory Service** - a semantic memory system built on the Model Context Protocol (MCP).

## ✨ Features

### 🧠 **Memory Management**
- **Store Memories**: Save content with tags and metadata
- **Semantic Search**: Find memories using natural language queries  
- **Tag Management**: Organize and delete memories by tags
- **Real-time Results**: Instant search and retrieval

### 📊 **Dashboard & Analytics**
- **Live Statistics**: Total memories, unique tags, database health
- **Database Health Monitoring**: Real-time health status (0-100%)
- **Performance Metrics**: Average query time tracking
- **Storage Information**: Database size and path information

### 🔧 **Database Operations**
- **Database Optimization**: Clean up and optimize vector indices
- **Backup Creation**: Create timestamped backups of your memory database
- **Health Checks**: Validate database integrity and performance
- **Auto-initialization**: Seamless ChromaDB setup and configuration

### 🏷️ **Enhanced Tag Management**
- **Multiple Tag Deletion**: Select and delete multiple tags simultaneously
- **Visual Tag Selection**: Interactive tag chips with add/remove functionality
- **Flexible Delete Options**: Support for both single and multiple tag deletion
- **API Consistency**: Consistent interface with search functionality
- **Clear Warnings**: Understand OR vs AND logic for tag operations

### 🎨 **User Experience**
- **Loading Indicators**: Visual feedback during database initialization
- **Progress Tracking**: Step-by-step status updates during startup
- **Professional Interface**: Clean, modern Electron-based desktop app
- **Keyboard Shortcuts**: F12 or Ctrl+Shift+I for developer tools
- **Responsive Design**: Adaptive layout for different window sizes

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **Python** (v3.10 or higher) with UV package manager
- **MCP Memory Service** (compatible installation)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/mcp-memory-dashboard.git
   cd mcp-memory-dashboard
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the project root:
   ```env
   VITE_MEMORY_SERVICE_PATH="/path/to/mcp-memory-service"
   VITE_MEMORY_CHROMA_PATH="/Users/yourusername/Library/Application Support/mcp-memory/chroma_db"
   VITE_MEMORY_BACKUPS_PATH="/Users/yourusername/Library/Application Support/mcp-memory/backups"
   VITE_CLAUDE_CONFIG_PATH="/Users/yourusername/Library/Application Support/Claude/claude_desktop_config.json"
   ```

4. **Start the application**:
   ```bash
   npm start
   ```

## ⚙️ Configuration

### MCP Memory Service Setup

Ensure your MCP Memory Service is properly configured in your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "memory": {
      "command": "uv",
      "args": ["--directory", "/path/to/mcp-memory-service", "run", "memory"],
      "env": {
        "MCP_MEMORY_CHROMA_PATH": "/Users/yourusername/Library/Application Support/mcp-memory/chroma_db",
        "MCP_MEMORY_BACKUPS_PATH": "/Users/yourusername/Library/Application Support/mcp-memory/backups"
      }
    }
  }
}
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_MEMORY_SERVICE_PATH` | Path to MCP Memory Service | `/path/to/mcp-memory-service` |
| `VITE_MEMORY_CHROMA_PATH` | ChromaDB database directory | `~/Library/Application Support/mcp-memory/chroma_db` |
| `VITE_MEMORY_BACKUPS_PATH` | Backup storage directory | `~/Library/Application Support/mcp-memory/backups` |
| `VITE_CLAUDE_CONFIG_PATH` | Claude Desktop config file | `~/Library/Application Support/Claude/claude_desktop_config.json` |

## 🎯 Usage

### Storing Memories
1. Navigate to the **Store Memory** tab
2. Enter your content in the text area
3. Add comma-separated tags (optional)
4. Click **Store** to save

### Searching Memories
1. Navigate to the **Search Memories** tab
2. Enter your search query
3. Click **Search** to find relevant memories
4. Results show content, tags, and relevance scores

### Managing Tags
1. Navigate to the **Tag Management** tab
2. Enter tags one by one in the input field and press Enter or click "Add Tag"
3. Selected tags appear as visual chips with remove (×) buttons
4. Remove unwanted tags by clicking the × on each chip
5. Click **Delete Tags** to remove all memories containing any of the selected tags
6. Use **Clear Selection** to remove all selected tags without deleting
7. ⚠️ **Warning**: Uses OR logic - memories with ANY selected tag will be deleted

### Dashboard Operations
- **Refresh Stats**: Click the settings icon to reload statistics
- **Optimize Database**: Click the refresh icon to optimize performance
- **Create Backup**: Click the save icon to create a timestamped backup

## 🏗️ Technical Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Desktop**: Electron for cross-platform desktop application
- **Styling**: Tailwind CSS with custom components
- **Icons**: Lucide React icon library
- **Build**: Vite for fast development and building

### Backend Integration
- **Protocol**: Model Context Protocol (MCP) over stdin/stdout
- **Communication**: JSON-RPC 2.0 for tool calls
- **Memory Service**: Python-based MCP server with ChromaDB
- **Vector Database**: ChromaDB for semantic search capabilities

### Key Components
- **Memory Service Client**: Handles MCP communication
- **Dashboard Interface**: React-based UI components
- **Electron Main Process**: Desktop app management
- **Preload Scripts**: Secure API exposure to renderer

## 🛠️ Development

### Development Mode
```bash
npm run dev
```
Starts both Vite dev server and Electron in development mode with hot reload.

### Building for Production
```bash
npm run build
```
Creates optimized production build in `dist/` directory.

### Available Scripts
- `npm start` - Build and run production version
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run electron:preview` - Run Electron with built files

## 🐛 Troubleshooting

### Common Issues

**App shows "Failed to connect to memory service"**
- Verify MCP Memory Service is installed and accessible
- Check that the `VITE_MEMORY_SERVICE_PATH` points to the correct directory
- Ensure UV package manager is installed (`pip install uv`)

**Dashboard operations are slow**
- First run requires ChromaDB initialization (10-30 seconds)
- Subsequent operations are faster (2-5 seconds)
- This is expected behavior for vector database operations

**Enhanced tag management not working**
- Ensure you're using MCP Memory Service v1.1.0+ with Issue 5 fixes
- Verify the enhanced delete_by_tag functionality is available
- Check console logs (F12) for API compatibility messages

**Stats showing 0 despite having memories**
- Wait for full dashboard initialization to complete
- Check that ChromaDB path has proper read/write permissions
- Try clicking the refresh stats button

**Developer tools opening automatically**
- Developer tools are disabled by default
- Use F12 or Ctrl+Shift+I to toggle when needed

### Performance Notes
- **Initial startup**: 10-30 seconds for ChromaDB initialization
- **Memory operations**: 2-10 seconds depending on database size
- **Stats retrieval**: 3-5 seconds for large databases
- **Search operations**: 1-3 seconds with real-time results

### Getting Help
1. Check the console logs (F12) for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure MCP Memory Service is working independently
4. Check file permissions for database and backup directories

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Add proper error handling
- Include JSDoc comments for complex functions
- Test with both development and production builds
- Ensure cross-platform compatibility

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Anthropic** for the Model Context Protocol specification
- **ChromaDB** for the vector database foundation
- **React & Electron** communities for excellent documentation
- **Claude** for assistance in development and debugging

## 📈 Version History

### v1.1.0 (Current) - Enhanced Tag Management
- ✅ **Multiple Tag Deletion**: Select and delete multiple tags simultaneously
- ✅ **Visual Tag Interface**: Interactive tag chips with add/remove functionality  
- ✅ **Enhanced UX**: Consistent interface with search functionality
- ✅ **API Consistency**: Resolved delete tag function ambiguity (Issue 5)
- ✅ **Backward Compatibility**: All existing functionality preserved
- ✅ **Improved Warnings**: Clear explanations of OR vs AND logic
- ✅ **Better Error Handling**: Enhanced user feedback and validation

### v1.0.0 - Core Functionality
- ✅ Complete MCP Memory Service integration
- ✅ Full CRUD operations for memories
- ✅ Real-time statistics and health monitoring  
- ✅ Database backup and optimization tools
- ✅ Professional desktop application with Electron
- ✅ Responsive dashboard interface
- ✅ Cross-platform compatibility (macOS, Windows, Linux)
- ✅ Comprehensive error handling and recovery

### Performance Characteristics
- **Memory capacity**: Supports thousands of memories with semantic search
- **Search speed**: 1-3 seconds for semantic queries
- **Database size**: Scales efficiently with ChromaDB vector storage
- **Startup time**: 10-30 seconds initial, 2-5 seconds subsequent

---

**Built with ❤️ for the MCP ecosystem**