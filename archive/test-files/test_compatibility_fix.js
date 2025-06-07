const { spawn } = require('child_process');

console.log('🧪 Testing MCP TaskGroup Compatibility Fix');
console.log('This tests if adding TaskGroup compatibility resolves the MCP issue\n');

async function testCompatibilityFix() {
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
    let compatibilityAdded = false;
    let taskGroupError = false;

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
              console.log(`✅ Compatibility test init: ${initTime}ms`);
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
              
              console.log('🎉 COMPATIBILITY FIX SUCCESS!');
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
                compatibilityAdded
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
      if (stderrStr.includes('TaskGroup compatibility added')) {
        compatibilityAdded = true;
        console.log('✅ TaskGroup compatibility successfully added!');
      }
      if (stderrStr.includes('COMPATIBILITY TOOL CALL')) {
        toolCallIntercepted = true;
        console.log('🎯 BREAKTHROUGH: Compatibility fix allows tool calls!');
      }
      if (stderrStr.includes('TaskGroup') && stderrStr.includes('error')) {
        taskGroupError = true;
        console.log('❌ TaskGroup error still present');
      }
    });

    serverProcess.on('error', (err) => {
      console.error('❌ Process error:', err);
      reject(err);
    });

    serverProcess.on('exit', (code, signal) => {
      if (!toolResponseReceived) {
        console.log('\n📊 Compatibility Test Diagnostic:');
        console.log(`   Init completed: ${initComplete}`);
        console.log(`   Compatibility added: ${compatibilityAdded}`);
        console.log(`   Tool call intercepted: ${toolCallIntercepted}`);
        console.log(`   TaskGroup error: ${taskGroupError}`);
        
        if (compatibilityAdded && !toolCallIntercepted) {
          console.log('\n❌ DIAGNOSIS: TaskGroup compatibility added but still not working');
          console.log('   May need different MCP library version or approach');
        } else if (!compatibilityAdded) {
          console.log('\n❌ DIAGNOSIS: TaskGroup compatibility not properly added');
        } else if (taskGroupError) {
          console.log('\n❌ DIAGNOSIS: TaskGroup error persists despite compatibility');
        }
        
        reject(new Error(`Compatibility test failed with code ${code}`));
      }
    });

    const initRequest = {
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        clientInfo: { name: 'compatibility-test', version: '0.1.0' }
      },
      id: 1
    };

    console.log('📤 Testing compatibility fix...');
    serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');

    setTimeout(() => {
      if (!toolResponseReceived) {
        console.error('❌ COMPATIBILITY TEST TIMEOUT');
        serverProcess.kill('SIGINT');
        setTimeout(() => {
          reject(new Error('Compatibility test timeout'));
        }, 1000);
      }
    }, 5000);
  });
}

testCompatibilityFix()
  .then(result => {
    console.log('\n🎉 TASKGROUP COMPATIBILITY FIX WORKS!');
    console.log('✅ The issue was Python 3.10 vs MCP library expecting 3.11+');
    console.log('✅ Now we can apply this fix to the memory service!');
    
    console.log('\n🔧 SOLUTION: Add TaskGroup compatibility to memory service');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 COMPATIBILITY FIX FAILED:', error.message);
    console.log('\n🔍 May need to try different approach or MCP library version');
    process.exit(1);
  });
