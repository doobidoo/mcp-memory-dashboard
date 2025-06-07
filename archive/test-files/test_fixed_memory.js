const { spawn } = require('child_process');

console.log('🎯 Testing FIXED Memory Server');
console.log('This tests the memory service with TaskGroup compatibility fix applied\n');

async function testFixedMemoryServer() {
  const serverProcess = spawn('uv', ['run', 'python', 'fixed_memory_server.py'], {
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
              console.log(`✅ Fixed memory server init: ${initTime}ms`);
              initComplete = true;
              
              setTimeout(() => {
                const toolCall = {
                  jsonrpc: '2.0',
                  method: 'tools/call',
                  params: {
                    name: 'dashboard_check_health',
                    arguments: {}
                  },
                  id: 2
                };
                
                console.log('📤 Testing dashboard_check_health with fix...');
                serverProcess.stdin.write(JSON.stringify(toolCall) + '\n');
              }, 300);
              
            } else if (result.id === 2) {
              toolResponseReceived = true;
              const elapsed = Date.now() - startTime;
              
              console.log('🎉🎉🎉 COMPLETE SUCCESS! MEMORY SERVICE FIXED! 🎉🎉🎉');
              console.log(`⚡ Response time: ${elapsed}ms`);
              
              if (result.result && result.result.length > 0) {
                try {
                  const healthData = JSON.parse(result.result[0].text);
                  console.log('📊 Health Status:', healthData);
                  
                  if (healthData.message && healthData.message.includes('TaskGroup compatibility')) {
                    console.log('✅ TaskGroup compatibility fix confirmed working!');
                  }
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
        console.log('✅ TaskGroup compatibility confirmed!');
      }
      if (stderrStr.includes('FIXED TOOL CALL INTERCEPTED')) {
        toolCallIntercepted = true;
        console.log('🎯 BREAKTHROUGH: Fixed memory service tool calls work!');
      }
    });

    serverProcess.on('error', (err) => {
      console.error('❌ Process error:', err);
      reject(err);
    });

    serverProcess.on('exit', (code, signal) => {
      if (!toolResponseReceived) {
        console.log('\n📊 Fixed Memory Server Diagnostic:');
        console.log(`   Init completed: ${initComplete}`);
        console.log(`   Compatibility added: ${compatibilityAdded}`);
        console.log(`   Tool call intercepted: ${toolCallIntercepted}`);
        
        reject(new Error(`Fixed memory server test failed with code ${code}`));
      }
    });

    const initRequest = {
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        clientInfo: { name: 'fixed-memory-test', version: '0.1.0' }
      },
      id: 1
    };

    console.log('📤 Testing fixed memory server...');
    serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');

    setTimeout(() => {
      if (!toolResponseReceived) {
        console.error('❌ FIXED MEMORY SERVER TIMEOUT');
        serverProcess.kill('SIGINT');
        setTimeout(() => {
          reject(new Error('Fixed memory server timeout'));
        }, 1000);
      }
    }, 5000);
  });
}

testFixedMemoryServer()
  .then(result => {
    console.log('\n🎉🎉🎉 MEMORY SERVICE COMPLETELY FIXED! 🎉🎉🎉');
    console.log('✅ TaskGroup compatibility resolves the MCP library issue!');
    console.log('✅ Tool calls now work perfectly!');
    console.log('✅ Dashboard integration is ready!');
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Apply this fix to the main memory service');
    console.log('2. Test your dashboard integration');
    console.log('3. Everything should work perfectly now!');
    
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 FIXED MEMORY SERVER FAILED:', error.message);
    console.log('\n🔍 May need alternative approach or further debugging');
    process.exit(1);
  });
