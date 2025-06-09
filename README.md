# MCP Memory Dashboard <img width="60" alt="grafik" src="https://github.com/user-attachments/assets/eab1f341-ca54-445c-905e-273cd9e89555" />

A professional desktop application for managing and interacting with the **[MCP Memory Service](https://github.com/doobidoo/mcp-memory-service)** - a semantic memory system built on the Model Context Protocol (MCP).

## 🚀 **NEW: High-Performance Docker ChromaDB Integration**

**Major Update**: Now supports direct Docker ChromaDB access for **2-3x faster performance** and **zero service conflicts**!

### ⚡ **Docker Mode Benefits**
- **🚀 2-3x Faster**: Direct HTTP access eliminates MCP overhead (50-150ms vs 200-500ms)
- **🔄 Zero Conflicts**: Eliminates MCP service duplication that could interfere with Claude Desktop
- **💾 Zero Data Loss**: Uses your existing database directly via volume mounting
- **🐳 Automatic Management**: Transparent Docker container lifecycle management
- **🛡️ Graceful Fallback**: Automatically falls back to traditional MCP if Docker unavailable

### **Quick Docker Setup**
1. **Install Docker Desktop** (if not already installed)
2. **Enable Docker Mode**: Set `VITE_USE_DIRECT_CHROMA_ACCESS=true` in your `.env` file
3. **Start Dashboard**: `npm start` - Docker container automatically managed!

📖 **[Complete Docker Setup Guide](docs/DOCKER_SETUP_GUIDE.md)** | 🏗️ **[Technical Architecture Details](docs/DOCKER_ARCHITECTURE.md)**

## ✨ Features

### 🧠 **Memory Management**
- **Store Memories**: Save content with tags and metadata
- **Semantic Search**: Find memories using natural language queries with individual delete buttons
- **Time-Based Recall**: Search memories by time expressions ("yesterday", "last week", etc.)
- **Individual Memory Deletion**: Delete specific memories with confirmation dialogs
- **Tag Management**: Organize and delete memories by tags with multiple selection
- **Real-time Results**: Instant search and retrieval with similarity scores

### 📊 **Dashboard & Analytics**
- **Live Statistics**: Total memories, unique tags, database health
- **Database Health Monitoring**: Real-time health status (0-100%)
- **Performance Metrics**: Real average query time tracking (1-3 seconds)
- **Storage Information**: Database size and path information
- **4-Tab Interface**: Dedicated tabs for Store, Search, Recall, and Tag Management

### 🔧 **Database Operations**
- **Database Optimization**: Clean up and optimize vector indices
- **Backup Creation**: Create timestamped backups with detailed feedback (file path, size, timestamp)
- **Health Checks**: Validate database integrity and performance
- **Auto-initialization**: Seamless ChromaDB setup and configuration
- **Real Backup System**: Complete tar.gz compression with success notifications

### 🏷️ **Enhanced Tag Management**
- **Multiple Tag Deletion**: Select and delete multiple tags simultaneously
- **Visual Tag Selection**: Interactive tag chips with add/remove functionality
- **Flexible Delete Options**: Support for both single and multiple tag deletion
- **API Consistency**: Consistent interface with search functionality
- **Clear Warnings**: Understand OR vs AND logic for tag operations

### ⏰ **Time-Based Recall System**
- **Quick Filters**: One-click buttons for [Today] [Yesterday] [Last Week] [Last Month] [Last 3 Months]
- **Natural Language**: Free-text time expressions like "2 days ago", "last summer"
- **Smart Processing**: Combines time filtering with semantic search when appropriate
- **Dedicated Tab**: Separate "Recall by Time" interface for temporal queries

### 🎨 **User Experience**
- **Loading Indicators**: Visual feedback during database initialization
- **Progress Tracking**: Step-by-step status updates during startup
- **Professional Interface**: Clean, modern Electron-based desktop app
- **Keyboard Shortcuts**: F12 or Ctrl+Shift+I for developer tools
- **Responsive Design**: Adaptive layout for different window sizes
- **Rich Feedback**: Detailed success/error messages with dismissible notifications
- **Safety Features**: Confirmation dialogs for destructive operations

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

   **macOS/Linux:**
   ```env
   # Basic Configuration
   VITE_MEMORY_SERVICE_PATH="/path/to/mcp-memory-service"
   VITE_MEMORY_CHROMA_PATH="/Users/yourusername/Library/Application Support/mcp-memory/chroma_db"
   VITE_MEMORY_BACKUPS_PATH="/Users/yourusername/Library/Application Support/mcp-memory/backups"
   VITE_CLAUDE_CONFIG_PATH="/Users/yourusername/Library/Application Support/Claude/claude_desktop_config.json"
   
   # 🚀 NEW: Docker ChromaDB Mode (High Performance)
   VITE_USE_DIRECT_CHROMA_ACCESS=true   # Enable Docker mode for 2-3x faster performance
   # VITE_USE_DIRECT_CHROMA_ACCESS=false  # Traditional MCP mode (stable fallback)
   ```

   **Windows:**
   ```env
   # Basic Configuration
   VITE_MEMORY_SERVICE_PATH="C:\path\to\mcp-memory-service"
   VITE_MEMORY_CHROMA_PATH="C:\Users\%USERNAME%\AppData\Local\mcp-memory\chroma_db"
   VITE_MEMORY_BACKUPS_PATH="C:\Users\%USERNAME%\AppData\Local\mcp-memory\backups"
   VITE_CLAUDE_CONFIG_PATH="C:\Users\%USERNAME%\AppData\Roaming\Claude\claude_desktop_config.json"
   
   # 🚀 NEW: Docker ChromaDB Mode (High Performance)
   VITE_USE_DIRECT_CHROMA_ACCESS=true   # Enable Docker mode for 2-3x faster performance
   # VITE_USE_DIRECT_CHROMA_ACCESS=false  # Traditional MCP mode (stable fallback)
   ```

4. **Start the application**:
   ```bash
   npm start
   ```

## 🪟 Windows-Specific Notes

### Path Configuration
- Use **double backslashes** (`\\`) or **forward slashes** (`/`) in paths
- The `%USERNAME%` environment variable automatically resolves to your Windows username
- Claude Desktop config is stored in `AppData\Roaming\Claude\`
- Memory data is stored in `AppData\Local\mcp-memory\`

### PowerShell Execution Policy
If you encounter script execution errors, you may need to enable script execution:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Common Windows Paths
- **Claude Config**: `C:\Users\<username>\AppData\Roaming\Claude\claude_desktop_config.json`
- **Memory Database**: `C:\Users\<username>\AppData\Local\mcp-memory\chroma_db`
- **Backups**: `C:\Users\<username>\AppData\Local\mcp-memory\backups`

## ⚙️ Configuration

### MCP Memory Service Setup

Ensure your MCP Memory Service is properly configured in your Claude Desktop configuration:

**macOS/Linux:**
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

**Windows:**
```json
{
  "mcpServers": {
    "memory": {
      "command": "uv",
      "args": ["--directory", "C:\\path\\to\\mcp-memory-service", "run", "memory"],
      "env": {
        "MCP_MEMORY_CHROMA_PATH": "C:\\Users\\yourusername\\AppData\\Local\\mcp-memory\\chroma_db",
        "MCP_MEMORY_BACKUPS_PATH": "C:\\Users\\yourusername\\AppData\\Local\\mcp-memory\\backups"
      }
    }
  }
}
```

### Environment Variables

| Variable | Description | macOS/Linux Example | Windows Example |
|----------|-------------|---------------------|-----------------|
| `VITE_MEMORY_SERVICE_PATH` | Path to MCP Memory Service | `/path/to/mcp-memory-service` | `C:\path\to\mcp-memory-service` |
| `VITE_MEMORY_CHROMA_PATH` | ChromaDB database directory | `~/Library/Application Support/mcp-memory/chroma_db` | `C:\Users\%USERNAME%\AppData\Local\mcp-memory\chroma_db` |
| `VITE_MEMORY_BACKUPS_PATH` | Backup storage directory | `~/Library/Application Support/mcp-memory/backups` | `C:\Users\%USERNAME%\AppData\Local\mcp-memory\backups` |
| `VITE_CLAUDE_CONFIG_PATH` | Claude Desktop config file | `~/Library/Application Support/Claude/claude_desktop_config.json` | `C:\Users\%USERNAME%\AppData\Roaming\Claude\claude_desktop_config.json` |
| `VITE_USE_DIRECT_CHROMA_ACCESS` | **🚀 NEW**: Enable Docker ChromaDB mode | `true` (Docker) / `false` (MCP) | `true` (Docker) / `false` (MCP) |

### 🐳 **Docker vs MCP Mode Comparison**

| Feature | Docker Mode (`true`) | MCP Mode (`false`) |
|---------|---------------------|-------------------|
| **Performance** | **2-3x faster** (50-150ms) | Standard (200-500ms) |
| **Service Conflicts** | **None** (eliminates duplication) | Possible (MCP conflicts) |
| **Requirements** | Docker Desktop required | Python + UV required |
| **Data Migration** | **None** (uses existing DB) | **None** (uses existing DB) |
| **Reliability** | Auto-restart, health monitoring | Depends on MCP service |
| **Fallback** | Auto-fallback to MCP | N/A (is the fallback) |

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
4. Results show content, tags, similarity scores, and individual delete buttons (🗑️)
5. Click the delete button on any memory for individual deletion with confirmation

### Time-Based Recall
1. Navigate to the **Recall by Time** tab
2. **Quick Filters**: Click predefined buttons ([Today] [Yesterday] [Last Week] [Last Month] [Last 3 Months])
3. **Free Text**: Enter custom time expressions like "2 days ago", "last summer", "this morning"
4. Click **Recall** to find memories from that time period
5. Results include individual delete buttons and similarity scores when applicable

### Managing Tags
1. Navigate to the **Tag Management** tab
2. Enter tags one by one in the input field and press Enter or click "Add Tag"
3. Selected tags appear as visual chips with remove (×) buttons
4. Remove unwanted tags by clicking the × on each chip
5. Click **Delete [N] Tags** to remove all memories containing any of the selected tags
6. Use **Clear Selection** to remove all selected tags without deleting
7. ⚠️ **Warning**: Uses OR logic - memories with ANY selected tag will be deleted

### Database Operations
- **Refresh Stats**: Click the settings icon to reload statistics and see real query times
- **Optimize Database**: Click the refresh icon to optimize performance
- **Create Backup**: Click the save icon to create a timestamped backup with detailed feedback
  - Success message shows: file path, size in MB, timestamp, and dismissible notification
  - Example: "✅ Backup created successfully! 📁 Location: /path/to/backup_20250607_143025.tar.gz 📊 Size: 2.4 MB"

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

**🐳 Docker Mode Issues (VITE_USE_DIRECT_CHROMA_ACCESS=true)**

**"Docker not available" message**
- Install Docker Desktop from https://www.docker.com/products/docker-desktop
- Ensure Docker Desktop is running (icon should be visible in system tray)
- System automatically falls back to MCP mode if Docker unavailable

**"Using fallback port 8001" message**
- Port 8000 is occupied by another service
- System automatically uses alternative ports (8001, 8002, etc.)
- This is normal behavior and doesn't affect functionality

**Slower initial startup with Docker mode**
- First run downloads ChromaDB Docker image (one-time, ~100MB)
- Subsequent starts are faster than MCP mode
- Progress shown in console logs

**Container health issues**
- System automatically restarts unhealthy containers
- Check Docker Desktop for container status
- Manual restart: `docker restart mcp-memory-chromadb`

**🔄 MCP Mode Issues (VITE_USE_DIRECT_CHROMA_ACCESS=false)**

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
- **Stats retrieval**: 3-5 seconds for large databases with real query time tracking
- **Search operations**: 1-3 seconds with real-time results and accuracy metrics
- **Recall operations**: 1-3 seconds for time-based filtering
- **Backup creation**: 2-10 seconds creating compressed tar.gz files
- **Individual deletion**: Near-instant with confirmation dialogs

### New Features Troubleshooting (v1.2.0)

**Individual delete buttons not appearing**
- Ensure memories have valid IDs (refresh search results if needed)
- Check that you're using the latest version of the memory service
- Individual deletion requires memory service v1.2.0+

**Time-based recall not working**
- Try simpler expressions first: "today", "yesterday", "last week"
- Complex time expressions may require exact phrasing
- Check console logs (F12) for time parsing errors

**Backup feedback not showing**
- Verify backup directory has write permissions
- Check that backup path environment variable is set correctly
- Large databases may take longer to backup (progress is shown)

**Query times still showing 0**
- Perform a few searches to populate the average calculation
- Query time tracking requires at least one search operation
- Restart the application if metrics don't update

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

### v1.3.0 (Current) - 🚀 **Major: Docker ChromaDB Integration**
- ✅ **Docker ChromaDB Mode**: High-performance Docker container integration with automatic management
- ✅ **2-3x Performance Improvement**: Direct HTTP access eliminates MCP overhead (50-150ms response times)
- ✅ **MCP Conflict Resolution**: Eliminates service duplication that interfered with Claude Desktop
- ✅ **Zero Data Migration**: Volume mount preserves all existing memories instantly
- ✅ **Graceful Fallback**: Automatic fallback to MCP mode if Docker unavailable
- ✅ **Container Lifecycle Management**: Health monitoring, auto-restart, graceful shutdown
- ✅ **Port Conflict Resolution**: Automatic port selection with fallback ports
- ✅ **Comprehensive Documentation**: Complete setup guides and technical documentation
- ✅ **Production Ready**: Full test suite with Docker integration validation
- 🔧 **Technical**: Resolves GitHub Issues #11 (MCP duplication) and #12 (JS client limitation)

### v1.2.0 - UX Enhancements & Issue #2 Resolution
- ✅ **Real Query Time Tracking**: Displays actual average query times (1-3 seconds) instead of 0
- ✅ **Complete Backup System**: Real tar.gz backups with detailed feedback (path, size, timestamp)  
- ✅ **Individual Memory Deletion**: Delete buttons (🗑️) on each memory with confirmation dialogs
- ✅ **Time-Based Recall**: New "Recall by Time" tab with quick filter buttons and natural language
- ✅ **4-Tab Interface**: Store → Search → Recall → Tag Management for better organization
- ✅ **Enhanced UX**: Rich notifications, dismissible success messages, and real-time updates
- ✅ **Safety Features**: Confirmation dialogs for destructive operations
- ✅ **Performance Metrics**: Real query time measurement and averaging system

### v1.1.0 - Enhanced Tag Management (Issue #5 Resolution)  
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
- **Search speed**: 1-3 seconds for semantic queries (now accurately tracked)
- **Recall speed**: 1-3 seconds for time-based queries with real metrics
- **Database size**: Scales efficiently with ChromaDB vector storage
- **Startup time**: 10-30 seconds initial, 2-5 seconds subsequent
- **Backup creation**: 2-10 seconds depending on database size

---

**Built with ❤️ for the MCP ecosystem**
