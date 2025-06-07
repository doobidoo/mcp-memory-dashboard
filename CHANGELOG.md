# CHANGELOG

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
