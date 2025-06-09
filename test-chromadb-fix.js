#!/usr/bin/env node

/**
 * Quick Test for ChromaDB PersistentClient Fix
 * ============================================
 * 
 * This script tests the ChromaDB client initialization fix
 * to ensure we can properly connect to local file storage.
 */

const path = require('path');
const fs = require('fs');

async function testChromaDBConnection() {
  console.log('🧪 Testing ChromaDB PersistentClient Fix...');
  console.log('==========================================');
  
  try {
    // Test ChromaDB import
    console.log('📦 Testing ChromaDB import...');
    const { PersistentClient } = require('chromadb');
    console.log('✅ ChromaDB PersistentClient imported successfully');
    
    // Test database path
    const testPath = path.join(__dirname, 'test_chroma_db');
    console.log('📍 Test database path:', testPath);
    
    // Ensure test directory exists
    if (!fs.existsSync(testPath)) {
      fs.mkdirSync(testPath, { recursive: true });
      console.log('✅ Test directory created');
    } else {
      console.log('✅ Test directory already exists');
    }
    
    // Test client initialization
    console.log('🚀 Initializing PersistentClient...');
    const client = new PersistentClient({
      path: testPath
    });
    console.log('✅ PersistentClient initialized successfully');
    
    // Test collection creation
    console.log('📦 Creating test collection...');
    const collection = await client.getOrCreateCollection({
      name: "test_memories",
      metadata: { 
        description: "Test collection for ChromaDB fix verification",
        created: new Date().toISOString()
      }
    });
    console.log('✅ Test collection created:', collection.name);
    
    // Test basic operations
    console.log('💾 Testing basic operations...');
    
    // Add a test document
    await collection.add({
      ids: ['test_1'],
      documents: ['This is a test memory for ChromaDB fix verification'],
      metadatas: [{ tags: ['test'], type: 'verification' }]
    });
    console.log('✅ Test document added');
    
    // Query test document
    const results = await collection.query({
      queryTexts: ['test memory'],
      nResults: 1
    });
    console.log('✅ Test query successful, found', results.ids[0].length, 'documents');
    
    // Get collection info
    const count = await collection.count();
    console.log('✅ Collection count:', count);
    
    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    await collection.delete({ ids: ['test_1'] });
    console.log('✅ Test data cleaned up');
    
    console.log('');
    console.log('🎉 SUCCESS: ChromaDB PersistentClient Fix Verified!');
    console.log('==================================================');
    console.log('✅ PersistentClient initialization: WORKING');
    console.log('✅ Collection creation: WORKING');
    console.log('✅ Document operations: WORKING');
    console.log('✅ Query operations: WORKING');
    console.log('');
    console.log('🚀 The ChromaDB client issue has been resolved!');
    console.log('   Direct access should now work properly in the dashboard.');
    
  } catch (error) {
    console.error('❌ ChromaDB test failed:', error);
    console.error('');
    console.error('🔧 This indicates the fix needs further adjustment.');
    console.error('   Error details:', error.message);
    process.exit(1);
  }
}

// Run the test
testChromaDBConnection();
