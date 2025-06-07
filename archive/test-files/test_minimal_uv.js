const { spawn } = require('child_process');

console.log('🧪 Testing Minimal Server with UV Environment');
console.log('This should have MCP library and test if @call_tool works\n');

async function testMinimalUV() {
  const serverProcess = spawn('uv', ['run', 'python', 'minimal_uv_server.py'], {
    cwd: '/Users/hkr/Documents/GitHub/mcp-memory-service',
    stdio: ['pipe', 'pipe', 'pipe']
  });

  return new Promise((resolve, reject) => {
    let response = '';
    let initComplete = false;
    let toolResponseReceived = false;
    let startTime = Date.now();
    let toolCallIntercepted = false;
    let handlersRegistered = false;

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
              console.log(`✅ Minimal UV init: ${initTime}ms`);
              initComplete = true;
              
              setTimeout(() => {
                const toolCall = {
                  jsonrpc: '2.0',
                  method: 'tools/call',
                  params: {
                    name: 'minimal_test',
                    arguments: {}
                  },
                  id: 2
                };
                
                console.log('📤 Testing minimal_test tool...');
                serverProcess.stdin.write(JSON.stringify(toolCall) + '\n');
              }, 300);
              
            } else if (result.id === 2) {
              toolResponseReceived = true;
              const elapsed = Date.now() - startTime;
              
              console.log('🎉 MINIMAL UV SUCCESS!');
              console.log(`⚡ Response time: ${elapsed}ms`);
              
              if (result.result && result.result.length > 0) {
                try {
                  const testData = JSON.parse(result.result[0].text);
                  console.log('📊 Result:', testData);
                } catch (e) {
                  console.log('📝 Raw result:', result.result[0].text);
                }
              }
              
              serverProcess.kill();
              resolve({ 
                success: true, 
                elapsed,
                toolCallIntercepted,
                handlersRegistered
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
      
      // Look for key messages
      if (stderrStr.includes('Handlers registered')) {
        handlersRegistered = true;
        console.log('✅ Handlers registered in minimal server');
      }
      if (stderrStr.includes('TOOL CALL INTERCEPTED')) {
        toolCallIntercepted = true;
        console.log('🎯 BREAKTHROUGH: @call_tool decorator works in UV!');
      }
    });

    serverProcess.on('error', (err) => {
      console.error('❌ Process error:', err);
      reject(err);
    });

    serverProcess.on('exit', (code, signal) => {
      if (!toolResponseReceived) {
        console.log('\n📊 Minimal UV Diagnostic:');
        console.log(`   Init completed: ${initComplete}`);
        console.log(`   Handlers registered: ${handlersRegistered}`);
        console.log(`   Tool call intercepted: ${toolCallIntercepted}`);
        
        if (handlersRegistered && !toolCallIntercepted) {
          console.log('\n❌ DIAGNOSIS: Handlers register but @call_tool not working');
          console.log('   This suggests an MCP library routing issue in UV environment');
        } else if (!handlersRegistered) {
          console.log('\n❌ DIAGNOSIS: Handler registration failed');
        }
        
        reject(new Error(`Minimal UV test failed with code ${code}`));
      }
    });

    const initRequest = {
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        clientInfo: { name: 'minimal-uv-test', version: '0.1.0' }
      },
      id: 1
    };

    console.log('📤 Initializing minimal UV server...');
    serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');

    setTimeout(() => {
      if (!toolResponseReceived) {
        console.error('❌ MINIMAL UV TIMEOUT');
        
        if (handlersRegistered && !toolCallIntercepted) {
          console.log('\n❌ CRITICAL: MCP call_tool decorator not working in UV environment!');
        }
        
        serverProcess.kill('SIGINT');
        setTimeout(() => {
          reject(new Error('Minimal UV test timeout'));
        }, 1000);
      }
    }, 5000);
  });
}

testMinimalUV()
  .then(result => {
    console.log('\n🎉 MINIMAL UV TEST PASSED!');
    console.log('✅ @call_tool decorator works in UV environment!');
    console.log('✅ This means we can isolate the issue in the memory service');
    
    console.log('\n🔬 Now we know the MCP library works fine in UV.');
    console.log('The issue must be in the complexity of our memory service implementation.');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 MINIMAL UV TEST FAILED:', error.message);
    console.log('\n🔍 This suggests the MCP library has issues even in UV environment.');
    process.exit(1);
  });
