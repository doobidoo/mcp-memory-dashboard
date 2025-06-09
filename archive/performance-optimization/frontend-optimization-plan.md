"""
FRONTEND OPTIMIZATION: Reduce Stats Call Frequency
Date: 2025-06-08
Issue: #10 - Performance optimization

CURRENT BEHAVIOR (EXCESSIVE):
- Stats called on init ✓ (keep)
- Stats called after every store operation ❌ (remove)
- Stats called after every search operation ❌ (remove)  
- Stats called after every recall operation ❌ (remove)
- Stats called on manual refresh ✓ (keep)
- Stats called after delete operations ✓ (keep - impacts count)

OPTIMIZED BEHAVIOR:
1. Stats called on init (initial load)
2. Stats called after operations that change data (store, delete)
3. Stats called on manual refresh button
4. NO stats refresh after read operations (search, recall)
5. Add cache status indicator to show freshness

IMPLEMENTATION CHANGES:
- Remove loadStats() calls from handleSearch()
- Remove loadStats() calls from handleRecall()
- Keep loadStats() calls for handleStoreMemory(), handleDeleteMemory(), handleDeleteTag()
- Add cache age indicator in UI
- Add explicit "Refresh Stats" button

EXPECTED IMPROVEMENT:
- Reduce unnecessary network calls by ~60%
- Faster search/recall operations 
- Better user experience
"""