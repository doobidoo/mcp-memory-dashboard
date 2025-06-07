const { spawn } = require('child_process');

console.log('🔧 Testing FINAL Fix - Handler Registration');
console.log('Focus: Does "TOOL CALL INTERCEPTED" appear?\n');

async function testFinalFix() {
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
    let handlerRegistrationFailed = false;

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
              console.log(`✅ Initialization: ${initTime}ms`);
              initComplete = true;
              
              // Wait a moment then send tool call
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
                
                console.log('📤 Sending tool call...');
                serverProcess.stdin.write(JSON.stringify(toolCall) + '\n');
              }, 500);
              
            } else if (result.id === 2) {
              toolResponseReceived = true;
              const elapsed = Date.now() - startTime;
              
              console.log('🎉 COMPLETE SUCCESS!');
              console.log(`⚡ Total time: ${elapsed}ms`);
              
              serverProcess.kill();
              resolve({ 
                success: true, 
                elapsed,
                handlerRegistrationOK,
                toolCallIntercepted,
                handlerRegistrationFailed
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
      
      // Check for specific messages
      if (stderrStr.includes('Server capabilities registered successfully!')) {
        handlerRegistrationOK = true;
        console.log('✅ Handler registration WORKING!');
      }
      if (stderrStr.includes('TOOL CALL INTERCEPTED')) {
        toolCallIntercepted = true;
        console.log('🎯 BREAKTHROUGH: Tool call reached handler!');
      }
      if (stderrStr.includes('Handler registration issue')) {
        handlerRegistrationFailed = true;
        console.log('❌ Handler registration still broken');
      }
    });

    serverProcess.on('error', (err) => {
      console.error('❌ Process error:', err);
      reject(err);
    });

    serverProcess.on('exit', (code, signal) => {
      if (!toolResponseReceived) {
        console.log('\n📊 Final Diagnostic:');
        console.log(`   Init completed: ${initComplete}`);
        console.log(`   Handler registration OK: ${handlerRegistrationOK}`);
        console.log(`   Handler registration failed: ${handlerRegistrationFailed}`);
        console.log(`   Tool call intercepted: ${toolCallIntercepted}`);
        console.log(`   Tool response received: ${toolResponseReceived}`);
        
        if (handlerRegistrationFailed) {
          console.log('\n❌ DIAGNOSIS: Handler registration is still broken');
        } else if (handlerRegistrationOK && !toolCallIntercepted) {
          console.log('\n❌ DIAGNOSIS: Handlers registered but tool calls not reaching them');
          console.log('   This suggests an MCP protocol routing issue');
        } else if (toolCallIntercepted && !toolResponseReceived) {
          console.log('\n❌ DIAGNOSIS: Tool calls reach handler but execution fails');
        } else {
          console.log('\n❌ DIAGNOSIS: Unknown issue - check logs above');
        }
        
        reject(new Error(`Test incomplete - see diagnosis above`));
      }
    });

    const initRequest = {
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        clientInfo: { name: 'final-fix-test', version: '0.1.0' }
      },
      id: 1
    };

    console.log('📤 Initializing...');
    serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');

    setTimeout(() => {
      if (!toolResponseReceived) {
        console.error('\n❌ TIMEOUT');
        serverProcess.kill('SIGINT');
        setTimeout(() => {
          reject(new Error('Test timeout'));
        }, 1000);
      }
    }, 8000);
  });
}

testFinalFix()
  .then(result => {
    console.log('\n🎉 ALL ISSUES RESOLVED!');
    console.log('✅ Your dashboard integration is ready to work!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 STILL DEBUGGING NEEDED');
    process.exit(1);
  });
