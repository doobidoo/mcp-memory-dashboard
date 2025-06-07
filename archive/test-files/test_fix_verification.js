const { spawn } = require('child_process');

console.log('🔧 Testing MCP Memory Service Fix...');
console.log('This will test if tool execution hanging is resolved\n');

async function testFix() {
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
              console.log('✅ Server initialization successful!');
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
              
              console.log('📤 Testing dashboard_check_health tool...');
              serverProcess.stdin.write(JSON.stringify(toolCall) + '\n');
              
            } else if (result.id === 2) {
              toolResponseReceived = true;
              const elapsed = Date.now() - startTime;
              
              console.log('🎉 SUCCESS! Tool executed without hanging!');
              console.log(`⚡ Response time: ${elapsed}ms`);
              
              if (result.result && result.result.length > 0) {
                try {
                  const healthData = JSON.parse(result.result[0].text);
                  console.log('📊 Health status:', healthData);
                  console.log('✅ Dashboard integration should now work!');
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
      
      // Look for our fix message
      if (stderrStr.includes('Skipping database validation')) {
        console.log('✅ Fix applied - database validation skipped');
      }
    });

    serverProcess.on('error', (err) => {
      console.error('❌ Process error:', err);
      reject(err);
    });

    serverProcess.on('exit', (code, signal) => {
      if (!toolResponseReceived) {
        const elapsed = Date.now() - startTime;
        if (elapsed > 10000) {
          console.error('❌ HANGING STILL OCCURS - Fix may not be complete');
        } else {
          console.log('⚠️  Process exited before tool response');
        }
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
        clientInfo: { name: 'fix-test', version: '0.1.0' }
      },
      id: 1
    };

    console.log('📤 Sending initialization request...');
    serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');

    // 15 second timeout - if tools still hang, we'll know
    setTimeout(() => {
      if (!toolResponseReceived) {
        console.error('❌ TIMEOUT - Tools are still hanging!');
        console.error('The fix may not have resolved the issue completely.');
        serverProcess.kill('SIGINT');
        
        setTimeout(() => {
          reject(new Error('Timeout - tools still hanging'));
        }, 2000);
      }
    }, 15000);
  });
}

console.log('Starting test...\n');

testFix()
  .then(result => {
    console.log('\n🎉 TEST PASSED! Tool execution hanging is FIXED!');
    console.log('Your dashboard should now work properly.');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 TEST FAILED:', error.message);
    console.error('The fix may need additional adjustments.');
    process.exit(1);
  });
