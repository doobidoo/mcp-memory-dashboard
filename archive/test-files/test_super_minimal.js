const { spawn } = require('child_process');

console.log('🧪 Testing Super Minimal MCP Server');
console.log('This tests if @server.call_tool() decorator works at all\n');

async function testSuperMinimal() {
  const serverProcess = spawn('python3', ['super_minimal_server.py'], {
    cwd: '/Users/hkr/Documents/GitHub/mcp-memory-dashboard',
    stdio: ['pipe', 'pipe', 'pipe']
  });

  return new Promise((resolve, reject) => {
    let response = '';
    let initComplete = false;
    let toolResponseReceived = false;
    let startTime = Date.now();
    let toolCallIntercepted = false;

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
              console.log(`✅ Super minimal init: ${initTime}ms`);
              initComplete = true;
              
              setTimeout(() => {
                const toolCall = {
                  jsonrpc: '2.0',
                  method: 'tools/call',
                  params: {
                    name: 'super_simple',
                    arguments: {}
                  },
                  id: 2
                };
                
                console.log('📤 Testing super_simple tool...');
                serverProcess.stdin.write(JSON.stringify(toolCall) + '\n');
              }, 200);
              
            } else if (result.id === 2) {
              toolResponseReceived = true;
              const elapsed = Date.now() - startTime;
              
              console.log('🎉 SUPER MINIMAL SUCCESS!');
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
                toolCallIntercepted
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
      
      // Look for the key intercept message
      if (stderrStr.includes('TOOL CALL INTERCEPTED')) {
        toolCallIntercepted = true;
        console.log('🎯 BREAKTHROUGH: call_tool decorator works!');
      }
    });

    serverProcess.on('error', (err) => {
      console.error('❌ Process error:', err);
      reject(err);
    });

    serverProcess.on('exit', (code, signal) => {
      if (!toolResponseReceived) {
        console.log('\n📊 Super Minimal Diagnostic:');
        console.log(`   Init completed: ${initComplete}`);
        console.log(`   Tool call intercepted: ${toolCallIntercepted}`);
        
        if (!toolCallIntercepted) {
          console.log('\n❌ DIAGNOSIS: @server.call_tool() decorator not working');
          console.log('   This indicates a fundamental MCP library issue');
        }
        
        reject(new Error(`Super minimal test failed with code ${code}`));
      }
    });

    const initRequest = {
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        clientInfo: { name: 'super-minimal-test', version: '0.1.0' }
      },
      id: 1
    };

    console.log('📤 Initializing super minimal server...');
    serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');

    setTimeout(() => {
      if (!toolResponseReceived) {
        console.error('❌ SUPER MINIMAL TIMEOUT');
        
        if (!toolCallIntercepted) {
          console.log('\n❌ CRITICAL: @server.call_tool() decorator not working!');
          console.log('This means the MCP library has a fundamental issue.');
        }
        
        serverProcess.kill('SIGINT');
        setTimeout(() => {
          reject(new Error('Super minimal test timeout'));
        }, 1000);
      }
    }, 5000);
  });
}

testSuperMinimal()
  .then(result => {
    console.log('\n🎉 SUPER MINIMAL TEST PASSED!');
    console.log('✅ @server.call_tool() decorator works!');
    console.log('✅ The issue is specific to the memory service implementation');
    
    console.log('\nNow we know the MCP library works - the issue is in our memory service.');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 SUPER MINIMAL TEST FAILED:', error.message);
    console.log('\n🔍 This means the fundamental MCP library has issues.');
    console.log('❌ @server.call_tool() decorator is not working at all.');
    process.exit(1);
  });
