#!/usr/bin/env node

/**
 * ChromaDB API Investigation
 * =========================
 * 
 * Check what's available in the chromadb package
 */

console.log('🔍 Investigating ChromaDB package exports...');

try {
  const chromadb = require('chromadb');
  
  console.log('📦 Available exports:');
  console.log(Object.keys(chromadb));
  
  console.log('\n🔧 Checking specific constructors:');
  console.log('ChromaClient:', typeof chromadb.ChromaClient);
  console.log('PersistentClient:', typeof chromadb.PersistentClient);
  
  if (chromadb.ChromaApi) {
    console.log('ChromaApi:', typeof chromadb.ChromaApi);
  }
  
  if (chromadb.Client) {
    console.log('Client:', typeof chromadb.Client);
  }
  
  // Check for other possible client types
  for (const key of Object.keys(chromadb)) {
    if (key.toLowerCase().includes('client') || key.toLowerCase().includes('persistent')) {
      console.log(`${key}:`, typeof chromadb[key]);
    }
  }
  
} catch (error) {
  console.error('❌ Error investigating ChromaDB:', error);
}
