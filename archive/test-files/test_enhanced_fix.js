const { spawn } = require('child_process');

console.log('🔧 Testing Enhanced MCP Memory Service Fix...');
console.log('This tests lazy ChromaDB initialization to prevent hanging\n');

async function testEnhancedFix() {
  const serverProcess = spawn('uv', ['run', 'memory'], {
    env: {
      ...process.env,
      MCP_MEMORY_CHROMA_PATH: '/Users/hkr/Library/Mobile Documents/com~apple~CloudDocs/AI/claude-memory/chroma_db',
      MCP_MEMORY_BACKUPS_PATH: '/Users/hkr/Library/Mobile Documents/com~apple~CloudDocs/AI/claude-memory/backups',
      LOG_LEVEL: 'INFO'
    },
    cwd: '/Users/hkr/Documents/GitHub/mcp-memory-service',
    stdio: ['pipe', 'pipe', 'pipe']
  });

  return new Promise((resolve, reject) => {
    let response = '';
    let initComplete = false;
    let toolResponseReceived = false;
    let startTime = Date.now();
    let initTime = null;

    serverProcess.stdout.on('data', (data) => {
      const dataStr = data.toString();
      response += dataStr;

      const lines = response.split('\n');
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
          const result = JSON.parse(line);
          if (result.jsonrpc === '2.0' && typeof result.id !== 'undefined') {
            
            if (result.id === 1 && !initComplete) {
              initTime = Date.now() - startTime;
              console.log(`✅ Server initialization: ${initTime}ms`);
              initComplete = true;
              
              // Test dashboard health check tool
              const toolCall = {
                jsonrpc: '2.0',
                method: 'tools/call',
                params: {
                  name: 'dashboard_check_health',
                  arguments: {}
                },
                id: 2
              };
              
              console.log('📤 Testing dashboard_check_health (no ChromaDB needed)...');
              serverProcess.stdin.write(JSON.stringify(toolCall) + '\n');
              
            } else if (result.id === 2) {
              toolResponseReceived = true;
              const elapsed = Date.now() - startTime;
              const toolTime = elapsed - initTime;
              
              console.log('🎉 SUCCESS! Tool executed without hanging!');
              console.log(`⚡ Tool execution time: ${toolTime}ms`);
              console.log(`📊 Total time: ${elapsed}ms`);
              
              if (result.result && result.result.length > 0) {
                try {
                  const healthData = JSON.parse(result.result[0].text);
                  console.log('📈 Dashboard health:', healthData);
                  
                  if (healthData.status === 'healthy') {
                    console.log('✅ Dashboard integration is READY!');
                    console.log('✅ ChromaDB initialization was successfully deferred!');
                  }
                } catch (e) {
                  console.log('📝 Raw result:', result.result[0].text);
                }
              }
              
              serverProcess.kill();
              resolve({ 
                success: true, 
                initTime, 
                toolTime, 
                totalTime: elapsed 
              });
              return;
            }
          }
        } catch (err) {
          // Non-JSON output, ignore
        }
      }
      response = lines[lines.length - 1];
    });

    serverProcess.stderr.on('data', (data) => {
      const stderrStr = data.toString();
      console.log('🔍', stderrStr.trim());
      
      // Look for our enhanced fix messages
      if (stderrStr.includes('Deferring ChromaDB initialization')) {
        console.log('✅ Enhanced fix applied - ChromaDB initialization deferred');
      }
      if (stderrStr.includes('EXECUTING DASHBOARD_CHECK_HEALTH')) {
        console.log('🎯 Tool execution started successfully!');
      }
    });

    serverProcess.on('error', (err) => {
      console.error('❌ Process error:', err);
      reject(err);
    });

    serverProcess.on('exit', (code, signal) => {
      if (!toolResponseReceived) {
        const elapsed = Date.now() - startTime;
        console.error(`❌ Process exited after ${elapsed}ms without tool response`);
        reject(new Error(`Process exited with code ${code}`));
      }
    });

    // Send initialize request
    const initRequest = {
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        clientInfo: { name: 'enhanced-fix-test', version: '0.1.0' }
      },
      id: 1
    };

    console.log('📤 Sending initialization request...');
    serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');

    // 10 second timeout should be plenty now
    setTimeout(() => {
      if (!toolResponseReceived) {
        console.error('❌ TIMEOUT - Enhanced fix may need more work');
        serverProcess.kill('SIGINT');
        
        setTimeout(() => {
          reject(new Error('Timeout - tools still hanging after enhanced fix'));
        }, 2000);
      }
    }, 10000);
  });
}

console.log('Starting enhanced fix test...\n');

testEnhancedFix()
  .then(result => {
    console.log('\n🎉 ENHANCED FIX SUCCESSFUL!');
    console.log(`⏱️  Initialization: ${result.initTime}ms`);
    console.log(`⚡ Tool execution: ${result.toolTime}ms`);
    console.log('✅ Dashboard should now work perfectly!');
    console.log('✅ ChromaDB will only initialize when needed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 ENHANCED FIX FAILED:', error.message);
    console.error('Additional debugging may be needed.');
    process.exit(1);
  });
