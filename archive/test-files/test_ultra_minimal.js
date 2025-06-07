const { spawn } = require('child_process');

console.log('🧪 Testing Ultra-Minimal MCP Server...');
console.log('This tests if basic MCP tool execution works at all\n');

async function testUltraMinimal() {
  // Test the ultra-minimal server without any ChromaDB dependencies
  const serverProcess = spawn('python3', ['ultra_minimal_server.py'], {
    cwd: '/Users/hkr/Documents/GitHub/mcp-memory-dashboard',
    stdio: ['pipe', 'pipe', 'pipe']
  });

  return new Promise((resolve, reject) => {
    let response = '';
    let initComplete = false;
    let toolResponseReceived = false;
    let startTime = Date.now();

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
              const initTime = Date.now() - startTime;
              console.log(`✅ Ultra-minimal server init: ${initTime}ms`);
              initComplete = true;
              
              // Test the ultra-simple tool
              const toolCall = {
                jsonrpc: '2.0',
                method: 'tools/call',
                params: {
                  name: 'ultra_simple_test',
                  arguments: {}
                },
                id: 2
              };
              
              console.log('📤 Testing ultra_simple_test tool...');
              serverProcess.stdin.write(JSON.stringify(toolCall) + '\n');
              
            } else if (result.id === 2) {
              toolResponseReceived = true;
              const elapsed = Date.now() - startTime;
              
              console.log('🎉 ULTRA-MINIMAL TOOL EXECUTED!');
              console.log(`⚡ Response time: ${elapsed}ms`);
              
              if (result.result && result.result.length > 0) {
                try {
                  const testData = JSON.parse(result.result[0].text);
                  console.log('📊 Test result:', testData);
                } catch (e) {
                  console.log('📝 Raw result:', result.result[0].text);
                }
              }
              
              serverProcess.kill();
              resolve({ success: true, elapsed });
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
      
      // Look for our tool execution logs
      if (stderrStr.includes('TOOL CALL RECEIVED')) {
        console.log('✅ Tool call reached the handler!');
      }
      if (stderrStr.includes('EXECUTING ULTRA SIMPLE TEST')) {
        console.log('✅ Tool execution started!');
      }
    });

    serverProcess.on('error', (err) => {
      console.error('❌ Process error:', err);
      reject(err);
    });

    serverProcess.on('exit', (code, signal) => {
      if (!toolResponseReceived) {
        const elapsed = Date.now() - startTime;
        console.error(`❌ Ultra-minimal test failed after ${elapsed}ms`);
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
        clientInfo: { name: 'ultra-minimal-test', version: '0.1.0' }
      },
      id: 1
    };

    console.log('📤 Sending initialization request...');
    serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');

    // 5 second timeout for ultra-minimal test
    setTimeout(() => {
      if (!toolResponseReceived) {
        console.error('❌ ULTRA-MINIMAL TEST TIMEOUT');
        console.error('This indicates a fundamental MCP protocol issue!');
        serverProcess.kill('SIGINT');
        
        setTimeout(() => {
          reject(new Error('Ultra-minimal test timeout - MCP protocol issue'));
        }, 2000);
      }
    }, 5000);
  });
}

console.log('Starting ultra-minimal test...\n');

testUltraMinimal()
  .then(result => {
    console.log('\n✅ ULTRA-MINIMAL TEST PASSED!');
    console.log('MCP protocol is working - the issue is in the memory service implementation');
    
    // Now test our memory service
    console.log('\nNow testing our memory service...');
    return testMemoryService();
  })
  .then(() => {
    console.log('🎉 BOTH TESTS PASSED!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 TEST FAILED:', error.message);
    if (error.message.includes('Ultra-minimal')) {
      console.error('❌ Fundamental MCP protocol issue detected!');
      console.error('The problem is not in ChromaDB or our implementation.');
    } else {
      console.error('❌ Issue is specific to our memory service implementation.');
    }
    process.exit(1);
  });

async function testMemoryService() {
  console.log('\n🔧 Testing Memory Service...');
  
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
              const initTime = Date.now() - startTime;
              console.log(`✅ Memory service init: ${initTime}ms`);
              initComplete = true;
              
              const toolCall = {
                jsonrpc: '2.0',
                method: 'tools/call',
                params: {
                  name: 'dashboard_check_health',
                  arguments: {}
                },
                id: 2
              };
              
              console.log('📤 Testing dashboard_check_health...');
              serverProcess.stdin.write(JSON.stringify(toolCall) + '\n');
              
            } else if (result.id === 2) {
              toolResponseReceived = true;
              const elapsed = Date.now() - startTime;
              
              console.log('✅ Memory service tool executed!');
              console.log(`⚡ Response time: ${elapsed}ms`);
              
              serverProcess.kill();
              resolve({ success: true, elapsed });
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
    });

    serverProcess.on('error', (err) => {
      reject(err);
    });

    serverProcess.on('exit', (code, signal) => {
      if (!toolResponseReceived) {
        reject(new Error(`Memory service test failed with code ${code}`));
      }
    });

    const initRequest = {
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        clientInfo: { name: 'memory-service-test', version: '0.1.0' }
      },
      id: 1
    };

    serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');

    setTimeout(() => {
      if (!toolResponseReceived) {
        console.error('❌ Memory service test timeout');
        serverProcess.kill('SIGINT');
        reject(new Error('Memory service test timeout'));
      }
    }, 8000);
  });
}
