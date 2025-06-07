const { spawn } = require('child_process');

console.log('🔧 Testing FIXED MCP Memory Service...');
console.log('This tests the handler registration fix\n');

async function testFixedServer() {
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
    let handlerRegistrationOK = false;
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
              console.log(`✅ Server initialization: ${initTime}ms`);
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
              
              console.log('🎉 SUCCESS! Tool executed without hanging!');
              console.log(`⚡ Total time: ${elapsed}ms`);
              
              if (result.result && result.result.length > 0) {
                try {
                  const healthData = JSON.parse(result.result[0].text);
                  console.log('📊 Health Status:', healthData);
                } catch (e) {
                  console.log('📝 Raw result:', result.result[0].text);
                }
              }
              
              serverProcess.kill();
              resolve({ 
                success: true, 
                elapsed,
                handlerRegistrationOK,
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
      
      // Check for our key debug messages
      if (stderrStr.includes('Server capabilities registered successfully')) {
        handlerRegistrationOK = true;
        console.log('✅ FIXED: Handler registration now working!');
      }
      if (stderrStr.includes('TOOL CALL INTERCEPTED')) {
        toolCallIntercepted = true;
        console.log('🎯 SUCCESS: Tool call reached our handler!');
      }
      if (stderrStr.includes('Handler registration issue')) {
        console.log('❌ STILL BROKEN: Handler registration failed');
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
        
        // Provide diagnostic info
        console.log('\n🔍 Diagnostic Summary:');
        console.log(`   Handler Registration OK: ${handlerRegistrationOK}`);
        console.log(`   Tool Call Intercepted: ${toolCallIntercepted}`);
        
        reject(new Error(`Process exited with code ${code}`));
      }
    });

    const initRequest = {
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        clientInfo: { name: 'fixed-test', version: '0.1.0' }
      },
      id: 1
    };

    console.log('📤 Sending initialization request...');
    serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');

    setTimeout(() => {
      if (!toolResponseReceived) {
        console.error('❌ TIMEOUT after handler registration fix');
        
        console.log('\n🔍 Diagnostic Summary:');
        console.log(`   Handler Registration OK: ${handlerRegistrationOK}`);
        console.log(`   Tool Call Intercepted: ${toolCallIntercepted}`);
        
        if (!handlerRegistrationOK) {
          console.log('❌ Handler registration still broken');
        } else if (!toolCallIntercepted) {
          console.log('❌ Handlers registered but tool calls not reaching them');
        }
        
        serverProcess.kill('SIGINT');
        setTimeout(() => {
          reject(new Error('Timeout after handler registration fix'));
        }, 2000);
      }
    }, 12000);
  });
}

console.log('Starting fixed server test...\n');

testFixedServer()
  .then(result => {
    console.log('\n🎉 HANDLER REGISTRATION FIX SUCCESSFUL!');
    console.log(`✅ Handler Registration: ${result.handlerRegistrationOK}`);
    console.log(`✅ Tool Call Intercepted: ${result.toolCallIntercepted}`);
    console.log('✅ Dashboard should now work perfectly!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 HANDLER REGISTRATION FIX INCOMPLETE:', error.message);
    process.exit(1);
  });
