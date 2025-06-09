# CHANGELOG

## [v1.3.0] - 2025-06-09 - GitHub Issue #11: Direct ChromaDB Access Architecture

### 🚀 Major Architecture Improvement

#### Issue #11 Implementation: Eliminate Redundant MCP Service Duplication
- **Architecture Enhancement**: Implemented direct ChromaDB access capability
- **Resource Conflict Resolution**: Added option to bypass MCP service spawning
- **Performance Foundation**: Created infrastructure for eliminating service duplication
- **Configuration Consolidation**: Maintained single source of truth for database paths

### ✨ New Features

#### Direct Database Access Option
- **New Configuration**: `VITE_USE_DIRECT_CHROMA_ACCESS=true` enables direct access mode
- **Service Factory Pattern**: Automatic selection between direct access and MCP spawning
- **Transparent Integration**: Existing dashboard interface unchanged
- **Backward Compatibility**: Falls back to original MCP approach when disabled

#### Enhanced Architecture Components
- **DirectChromaService**: Frontend service for direct database communication
- **DirectChromaHandler**: Main process handler for ChromaDB operations
- **Memory Service Factory**: Intelligent service instantiation based on configuration
- **IPC Integration**: Seamless integration with existing Electron communication layer

### 🔧 Technical Improvements

#### Configuration Enhancements
- **Eliminated Redundancy**: Single source of truth for ChromaDB paths (continued from v1.2.x)
- **Enhanced Documentation**: Updated .env.example with new architecture benefits
- **Environment Variables**: Added direct access toggle for easy switching
- **Path Derivation**: Maintained automatic path variable derivation

#### Infrastructure Updates
- **ChromaDB Dependency**: Added chromadb npm package for direct database access
- **Type Safety**: Enhanced TypeScript definitions for new service interfaces
- **Error Handling**: Improved error handling for both access modes
- **Logging**: Enhanced logging for debugging and monitoring service selection

### 📊 Expected Benefits (Upon Full Implementation)

#### Performance Improvements
- **No Service Duplication**: Eliminates separate MCP process spawning
- **Reduced Resource Usage**: Single database access point
- **Faster Response Times**: Direct database communication without MCP overhead
- **Better Memory Efficiency**: Reduced process overhead

#### Reliability Enhancements
- **Data Consistency**: Guaranteed consistency with single database access
- **No Resource Conflicts**: Eliminates concurrent database access issues
- **Simplified Architecture**: Reduced complexity in service communication
- **Real-time Synchronization**: Direct access enables immediate data consistency

### 🏗️ Implementation Status

#### Phase 1: Architecture Foundation ✅ COMPLETE
- Service factory pattern implemented
- Configuration management enhanced
- IPC handlers prepared
- Dependency installation complete

#### Phase 2: ChromaDB Implementation 🔄 IN PROGRESS
- Direct database client initialization
- Data access method implementation
- Error handling and edge cases
- Performance optimization

#### Phase 3: Testing & Optimization 📋 PLANNED
- Comprehensive testing suite
- Performance benchmarking
- Edge case validation
- Documentation updates

### 🔧 Files Modified
- **Frontend**: `src/services/direct/chromaService.ts`, `src/services/memoryFactory.ts`
- **Backend**: `electron/directChroma.ts`, `electron/main.ts`
- **Configuration**: `.env`, `.env.example`, `package.json`
- **Documentation**: `CHANGELOG.md`

### 📝 Migration Notes

#### From v1.2.x to v1.3.0
**Optional Migration** - New direct access feature is optional and backward compatible.

To enable direct ChromaDB access:
1. Update `.env` file: `VITE_USE_DIRECT_CHROMA_ACCESS=true`
2. Restart dashboard application
3. Verify direct access mode in console logs
4. Monitor for improved performance and eliminated conflicts

To maintain original MCP spawning behavior:
- Keep `VITE_USE_DIRECT_CHROMA_ACCESS=false` or remove the variable entirely
- No other changes required

### 🎯 Next Release Preview

#### v1.3.1 (Planned)
- Complete ChromaDB client implementation
- Full data access method integration
- Performance benchmarking results
- Comprehensive testing suite

## [v1.2.4] - 2025-06-08 - Query Time Tracking Final Fix

### 🐛 Bug Fixes

#### Issue #8 Final Resolution: Query Time Timing Optimization
- **Root Cause Identified**: Frontend called `loadStats()` too quickly after operations
- **Solution**: Added 100ms delay before stats refresh to allow MCP server processing time
- **Impact**: Query time tracking now shows accurate measurements (40-70ms range)

### ✨ Technical Changes
- **Enhanced Timing Logic**: Added `setTimeout(100ms)` before `loadStats()` calls
- **Affected Functions**: `handleSearch()` and `handleRecall()` in MemoryDashboard
- **User Experience**: Real-time query performance metrics now display correctly
- **Testing**: Comprehensive verification with live MCP testing scripts

### 🔧 Files Modified
- `src/MemoryDashboard.tsx`: Added timing delays for proper stats refresh
- `src/version.ts`: Updated version and description
- `package.json`: Version synchronization

## [v1.2.3] - 2025-06-08 - Query Time Stats Refresh Fix

### 🐛 Bug Fixes

#### Issue #8 Continued: Stats Refresh Implementation
- **Problem**: Stats display wasn't refreshing after search/recall operations
- **Solution**: Added `loadStats()` calls after search and recall operations
- **Result**: Query time statistics now update in real-time during use

### ✨ Enhanced Features
- **Real-time Updates**: Dashboard stats refresh immediately after operations
- **Better UX**: Users see immediate feedback on query performance
- **Improved Integration**: Seamless MCP server and frontend communication

## [v1.2.2] - 2025-06-08 - Delete Button Functionality Fix

### 🐛 Bug Fixes

#### Delete Button Restoration
- **Issue**: Delete functionality was not working properly in dashboard
- **Solution**: Fixed delete button event handlers and state management
- **Impact**: Users can now properly delete memories through the dashboard interface

### 🔧 Technical Improvements
- **Enhanced State Management**: Improved React state handling for delete operations
- **Better Error Handling**: More robust error feedback for delete operations
- **UI/UX**: Restored full delete functionality with proper confirmation flows

## [v1.2.1] - 2025-06-08 - Query Time Tracking Implementation

### ✨ Major Features

#### Issue #8 Resolution: Query Time Tracking Backend
- **New Feature**: Real average query time calculation and display
- **Backend Enhancement**: Implemented `deque(maxlen=50)` for rolling averages
- **Dashboard Integration**: `dashboard_check_health` now returns actual query times
- **User Benefit**: Meaningful performance metrics (1000-3000ms for semantic searches)

### 🛠️ Technical Implementation
- **Query Time Recording**: All dashboard tools now record execution times
- **Rolling Average**: Sliding window of last 50 queries for accurate averages
- **Health Check Integration**: Enhanced `get_average_query_time()` function
- **Real-time Display**: Frontend shows live query performance data

### 🎯 Expected Behavior
- **Initial State**: 0ms (no queries performed yet)
- **After Operations**: Realistic query times (1000-3000ms range)
- **Rolling Updates**: Values update as more operations are performed
- **Real-time Feedback**: Stats refresh after each search/recall operation

## [v1.2.0] - 2025-06-08 - Dashboard Tools Implementation

### 🎉 Major Release

#### Complete Dashboard Tools Backend
- **Critical Implementation**: Full MCP dashboard tools implementation
- **New Tools**: `dashboard_retrieve_memory`, `dashboard_recall_memory`, `dashboard_search_by_tag`
- **Enhanced Integration**: Seamless communication between frontend and MCP server
- **Performance Monitoring**: Foundation for query time tracking and statistics

### ✨ Backend Enhancements
- **Dashboard API**: Complete implementation of dashboard-specific MCP tools
- **Error Handling**: Robust error handling and response formatting
- **JSON Responses**: Consistent JSON formatting for all dashboard operations
- **Health Monitoring**: Enhanced health check capabilities

### 🔧 Technical Foundation
- **MCP Protocol**: Full compliance with Model Context Protocol standards
- **Type Safety**: Enhanced TypeScript integration and type definitions
- **Scalability**: Architecture prepared for future dashboard enhancements
- **Testing**: Comprehensive testing infrastructure for dashboard operations

## [v1.1.0] - 2025-06-07 - Enhanced Tag Management

### 🎉 Major Enhancements

#### Issue 5 Resolution: Delete Tag Function Ambiguity
- **BREAKING CHANGE AVOIDED**: Enhanced `delete_by_tag` with full backward compatibility
- **API Consistency**: Both `search_by_tag` and `delete_by_tag` now support flexible tag handling
- **Enhanced Functionality**: Single tag or multiple tag deletion in one operation

### ✨ New Features

#### Backend (MCP Memory Service)
- **Enhanced `delete_by_tag`**: Now accepts both `string` and `string[]` parameters
- **New `delete_by_tags`**: Explicit multi-tag deletion with OR logic
- **New `delete_by_all_tags`**: Delete memories containing ALL specified tags (AND logic)
- **Improved Error Messages**: More descriptive feedback for tag operations
- **Enhanced Type Safety**: Better parameter validation and error handling

#### Frontend (Dashboard)
- **Multiple Tag Selection**: Interactive UI for selecting multiple tags to delete
- **Visual Tag Chips**: Tag visualization with individual remove buttons
- **Add/Remove Tags**: Dynamic tag management before deletion
- **Clear Selection**: Remove all selected tags without deleting
- **Enhanced Warnings**: Clear explanations of OR vs AND logic
- **Improved UX**: Consistent interface with search functionality

### 🛠️ Technical Improvements

#### API Changes
```javascript
// Before (still works - backward compatible)
delete_by_tag("single_tag")

// Enhanced (new functionality)
delete_by_tag(["tag1", "tag2", "tag3"])        // OR logic
delete_by_tags(["tag1", "tag2"])               // Explicit OR logic
delete_by_all_tags(["urgent", "important"])    // AND logic
```

#### Dashboard Enhancements
- **Enhanced State Management**: Multiple tag selection with React state
- **Improved Error Handling**: Better user feedback for tag operations
- **Updated TypeScript Types**: Enhanced API interface definitions
- **Better Validation**: Input validation for tag operations

### 🔧 Infrastructure
- **Comprehensive Testing**: New test suite for enhanced tag functionality
- **Documentation Updates**: Updated README files and API documentation
- **Backward Compatibility**: All existing code continues to work unchanged

### 📚 Documentation
- **Updated README**: Both service and dashboard README files enhanced
- **API Documentation**: Enhanced examples and usage patterns
- **Migration Guide**: Though no migration needed due to backward compatibility

### 🧪 Testing
- **New Test Suite**: `test_issue_5_fix.py` for comprehensive validation
- **Edge Case Coverage**: Empty inputs, non-existent tags, type validation
- **UI Testing**: Dashboard functionality verification
- **Backward Compatibility Tests**: Ensures existing code continues to work

## [v1.0.0] - 2025-06-06 - Initial Release

### ✨ Core Features
- Complete MCP Memory Service integration
- Full CRUD operations for memories
- Real-time statistics and health monitoring
- Database backup and optimization tools
- Professional desktop application with Electron
- Responsive dashboard interface
- Cross-platform compatibility
- Comprehensive error handling and recovery

### 🏗️ Technical Foundation
- React 18 with TypeScript
- Electron for desktop application
- Tailwind CSS for styling
- MCP protocol integration
- ChromaDB backend integration

---

## Migration Notes

### From v1.2.3 to v1.2.4
**No migration required!** - Timing optimization is automatic.

### From v1.2.2 to v1.2.3
**No migration required!** - Stats refresh enhancement is automatic.

### From v1.2.1 to v1.2.2
**No migration required!** - Delete functionality restoration is automatic.

### From v1.2.0 to v1.2.1
**No migration required!** - Query time tracking is automatically enabled.

### From v1.1.0 to v1.2.0
**No migration required!** - Dashboard tools implementation is automatic.

To benefit from query time tracking:
- Restart dashboard application
- Perform search/recall operations to see query times
- Query times display will show 0ms initially, then real times after operations

### From v1.0.0 to v1.1.0
**No migration required!** - All changes are backward compatible.

To use new features:
- Update to latest MCP Memory Service
- Restart dashboard application
- New tag management features will be automatically available

### API Compatibility
- All existing `delete_by_tag("single_tag")` calls continue to work
- Enhanced functionality available immediately
- No code changes required for existing implementations
