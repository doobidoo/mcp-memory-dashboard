const { spawn } = require('child_process');

console.log('🧪 Testing CORRECTED Compatibility Fix');
console.log('The issue was get_capabilities() missing experimental_capabilities argument!\n');

async function testCorrectedFix() {
  const serverProcess = spawn('uv', ['run', 'python', 'compatibility_test_server.py'], {
    cwd: '/Users/hkr/Documents/GitHub/mcp-memory-service',
    stdio: ['pipe', 'pipe', 'pipe']
  });

  return new Promise((resolve, reject) => {
    let response = '';
    let initComplete = false;
    let toolResponseReceived = false;
    let startTime = Date.now();
    let toolCallIntercepted = false;
    let noTaskGroupError = true;

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
              console.log(`✅ Corrected server init: ${initTime}ms`);
              initComplete = true;
              
              setTimeout(() => {
                const toolCall = {
                  jsonrpc: '2.0',
                  method: 'tools/call',
                  params: {
                    name: 'compatibility_test',
                    arguments: {}
                  },
                  id: 2
                };
                
                console.log('📤 Testing compatibility_test tool...');
                serverProcess.stdin.write(JSON.stringify(toolCall) + '\n');
              }, 200);
              
            } else if (result.id === 2) {
              toolResponseReceived = true;
              const elapsed = Date.now() - startTime;
              
              console.log('🎉🎉🎉 CORRECTED FIX SUCCESS! 🎉🎉🎉');
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
                noTaskGroupError
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
      if (stderrStr.includes('COMPATIBILITY TOOL CALL')) {
        toolCallIntercepted = true;
        console.log('🎯 BREAKTHROUGH: Tool calls work with corrected fix!');
      }
      if (stderrStr.includes('TaskGroup') && stderrStr.includes('error')) {
        noTaskGroupError = false;
        console.log('❌ TaskGroup error still present');
      }
      if (stderrStr.includes('get_capabilities') && stderrStr.includes('missing')) {
        console.log('❌ get_capabilities error still present');
      }
    });

    serverProcess.on('error', (err) => {
      console.error('❌ Process error:', err);
      reject(err);
    });

    serverProcess.on('exit', (code, signal) => {
      if (!toolResponseReceived) {
        console.log('\n📊 Corrected Fix Diagnostic:');
        console.log(`   Init completed: ${initComplete}`);
        console.log(`   Tool call intercepted: ${toolCallIntercepted}`);
        console.log(`   No TaskGroup error: ${noTaskGroupError}`);
        
        if (initComplete && !toolCallIntercepted && noTaskGroupError) {
          console.log('\n🎯 DIAGNOSIS: Server works but tool calls not reaching handler');
          console.log('   This suggests a deeper MCP routing issue');
        }
        
        reject(new Error(`Corrected fix test failed with code ${code}`));
      }
    });

    const initRequest = {
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        clientInfo: { name: 'corrected-test', version: '0.1.0' }
      },
      id: 1
    };

    console.log('📤 Testing corrected compatibility fix...');
    serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');

    setTimeout(() => {
      if (!toolResponseReceived) {
        console.error('❌ CORRECTED FIX TIMEOUT');
        serverProcess.kill('SIGINT');
        setTimeout(() => {
          reject(new Error('Corrected fix timeout'));
        }, 1000);
      }
    }, 5000);
  });
}

testCorrectedFix()
  .then(result => {
    console.log('\n🎉 CORRECTED FIX SUCCESS!');
    console.log('✅ The issue was the get_capabilities() call, not TaskGroup!');
    console.log('✅ Now we can test the full debugging matrix with the correct fix!');
    
    console.log('\n🚀 The original memory service should work with this same fix applied!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 CORRECTED FIX FAILED:', error.message);
    console.log('\n🔍 May need further investigation');
    process.exit(1);
  });
