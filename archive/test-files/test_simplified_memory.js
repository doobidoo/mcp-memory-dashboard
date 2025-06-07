const { spawn } = require('child_process');

console.log('🧪 Testing Simplified Memory Server');
console.log('This tests a simplified version without complex initialization\n');

async function testSimplifiedMemory() {
  const serverProcess = spawn('uv', ['run', 'python', 'simplified_memory_server.py'], {
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
              console.log(`✅ Simplified memory init: ${initTime}ms`);
              initComplete = true;
              
              setTimeout(() => {
                const toolCall = {
                  jsonrpc: '2.0',
                  method: 'tools/call',
                  params: {
                    name: 'simple_dashboard_check',
                    arguments: {}
                  },
                  id: 2
                };
                
                console.log('📤 Testing simple_dashboard_check...');
                serverProcess.stdin.write(JSON.stringify(toolCall) + '\n');
              }, 200);
              
            } else if (result.id === 2) {
              toolResponseReceived = true;
              const elapsed = Date.now() - startTime;
              
              console.log('🎉 SIMPLIFIED MEMORY SUCCESS!');
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
      if (stderrStr.includes('Handlers registered in simplified server')) {
        handlersRegistered = true;
        console.log('✅ Handlers registered in simplified memory server');
      }
      if (stderrStr.includes('SIMPLIFIED TOOL CALL INTERCEPTED')) {
        toolCallIntercepted = true;
        console.log('🎯 BREAKTHROUGH: Simplified memory server call_tool works!');
      }
    });

    serverProcess.on('error', (err) => {
      console.error('❌ Process error:', err);
      reject(err);
    });

    serverProcess.on('exit', (code, signal) => {
      if (!toolResponseReceived) {
        console.log('\n📊 Simplified Memory Diagnostic:');
        console.log(`   Init completed: ${initComplete}`);
        console.log(`   Handlers registered: ${handlersRegistered}`);
        console.log(`   Tool call intercepted: ${toolCallIntercepted}`);
        
        if (handlersRegistered && !toolCallIntercepted) {
          console.log('\n❌ DIAGNOSIS: Even simplified version has call_tool issues');
        } else if (!handlersRegistered) {
          console.log('\n❌ DIAGNOSIS: Handler registration failed in simplified version');
        }
        
        reject(new Error(`Simplified memory test failed with code ${code}`));
      }
    });

    const initRequest = {
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        clientInfo: { name: 'simplified-memory-test', version: '0.1.0' }
      },
      id: 1
    };

    console.log('📤 Initializing simplified memory server...');
    serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');

    setTimeout(() => {
      if (!toolResponseReceived) {
        console.error('❌ SIMPLIFIED MEMORY TIMEOUT');
        serverProcess.kill('SIGINT');
        setTimeout(() => {
          reject(new Error('Simplified memory test timeout'));
        }, 1000);
      }
    }, 5000);
  });
}

testSimplifiedMemory()
  .then(result => {
    console.log('\n🎉 SIMPLIFIED MEMORY TEST PASSED!');
    console.log('✅ Basic memory server structure works!');
    console.log('✅ Issue is in the complex initialization of full memory service');
    
    console.log('\n🔬 This narrows down the issue to our complex memory service implementation.');
    console.log('The problem is in the initialization complexity, not the basic MCP setup.');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 SIMPLIFIED MEMORY TEST FAILED:', error.message);
    console.log('\n🔍 This suggests even basic memory server structure has issues.');
    process.exit(1);
  });
