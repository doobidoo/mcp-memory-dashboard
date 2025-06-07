const { spawn } = require('child_process');

console.log('🔬 ULTIMATE PROTOCOL DEBUGGING');
console.log('This will show us EXACTLY what happens at the MCP protocol level\n');

async function ultimateProtocolDebug() {
  const serverProcess = spawn('uv', ['run', 'python', 'ultimate_protocol_debug.py'], {
    cwd: '/Users/hkr/Documents/GitHub/mcp-memory-service',
    stdio: ['pipe', 'pipe', 'pipe']
  });

  return new Promise((resolve, reject) => {
    let response = '';
    let initComplete = false;
    let toolResponseReceived = false;
    let startTime = Date.now();
    let toolCallDetectedInStream = false;
    let toolCallHandlerReached = false;
    let protocolMessages = [];

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
              console.log(`✅ Ultimate debug server init: ${initTime}ms`);
              initComplete = true;
              
              setTimeout(() => {
                const toolCall = {
                  jsonrpc: '2.0',
                  method: 'tools/call',
                  params: {
                    name: 'protocol_test',
                    arguments: {}
                  },
                  id: 2
                };
                
                console.log('📤 Sending protocol_test tool call...');
                console.log('📤 Tool call content:', JSON.stringify(toolCall, null, 2));
                serverProcess.stdin.write(JSON.stringify(toolCall) + '\n');
              }, 300);
              
            } else if (result.id === 2) {
              toolResponseReceived = true;
              const elapsed = Date.now() - startTime;
              
              console.log('🎉 ULTIMATE PROTOCOL SUCCESS!');
              console.log(`⚡ Response time: ${elapsed}ms`);
              
              if (result.result && result.result.length > 0) {
                try {
                  const debugData = JSON.parse(result.result[0].text);
                  console.log('📊 Protocol debug result:');
                  console.log(JSON.stringify(debugData, null, 2));
                  
                  if (debugData.handler_reached) {
                    console.log('✅ BREAKTHROUGH: Handler was reached!');
                  }
                } catch (e) {
                  console.log('📝 Raw result:', result.result[0].text);
                }
              }
              
              serverProcess.kill();
              resolve({ 
                success: true, 
                elapsed,
                toolCallDetectedInStream,
                toolCallHandlerReached,
                protocolMessages
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
      
      // Track protocol-level events
      if (stderrStr.includes('INCOMING:')) {
        protocolMessages.push({ type: 'incoming', data: stderrStr });
      }
      if (stderrStr.includes('OUTGOING:')) {
        protocolMessages.push({ type: 'outgoing', data: stderrStr });
      }
      if (stderrStr.includes('TOOL CALL DETECTED IN STREAM')) {
        toolCallDetectedInStream = true;
        console.log('🎯 CONFIRMED: Tool call reaches server stream!');
      }
      if (stderrStr.includes('PROTOCOL DEBUG TOOL CALL')) {
        toolCallHandlerReached = true;
        console.log('🎯 BREAKTHROUGH: Tool call handler executed!');
      }
    });

    serverProcess.on('error', (err) => {
      console.error('❌ Process error:', err);
      reject(err);
    });

    serverProcess.on('exit', (code, signal) => {
      if (!toolResponseReceived) {
        console.log('\n📊 Ultimate Protocol Diagnostic:');
        console.log(`   Init completed: ${initComplete}`);
        console.log(`   Tool call detected in stream: ${toolCallDetectedInStream}`);
        console.log(`   Tool call handler reached: ${toolCallHandlerReached}`);
        console.log(`   Protocol messages captured: ${protocolMessages.length}`);
        
        console.log('\n🔍 DIAGNOSIS:');
        if (!toolCallDetectedInStream) {
          console.log('❌ Tool calls are not reaching the server at all');
          console.log('   This indicates a protocol or client issue');
        } else if (toolCallDetectedInStream && !toolCallHandlerReached) {
          console.log('❌ Tool calls reach server but not the handler');
          console.log('   This indicates an MCP framework routing issue');
        } else if (toolCallHandlerReached && !toolResponseReceived) {
          console.log('❌ Handler executes but response not received');
          console.log('   This indicates a response handling issue');
        }
        
        reject(new Error(`Ultimate protocol debug failed with code ${code}`));
      }
    });

    const initRequest = {
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        clientInfo: { name: 'ultimate-protocol-debug', version: '0.1.0' }
      },
      id: 1
    };

    console.log('📤 Starting ultimate protocol debugging...');
    serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');

    setTimeout(() => {
      if (!toolResponseReceived) {
        console.error('❌ ULTIMATE PROTOCOL DEBUG TIMEOUT');
        
        console.log('\n🔍 FINAL ANALYSIS:');
        console.log(`Stream detection: ${toolCallDetectedInStream}`);
        console.log(`Handler reached: ${toolCallHandlerReached}`);
        
        serverProcess.kill('SIGINT');
        setTimeout(() => {
          reject(new Error('Ultimate protocol debug timeout'));
        }, 1000);
      }
    }, 8000);
  });
}

ultimateProtocolDebug()
  .then(result => {
    console.log('\n🎉 ULTIMATE PROTOCOL DEBUG SUCCESS!');
    console.log('✅ We have identified exactly what happens at the protocol level!');
    
    console.log('\n📊 RESULTS SUMMARY:');
    console.log(`✅ Tool call in stream: ${result.toolCallDetectedInStream}`);
    console.log(`✅ Handler reached: ${result.toolCallHandlerReached}`);
    
    if (result.toolCallDetectedInStream && result.toolCallHandlerReached) {
      console.log('\n🎉 COMPLETE PROTOCOL SUCCESS!');
      console.log('This proves the MCP framework works perfectly!');
      console.log('The issue must be environment-specific or edge case.');
    }
    
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 ULTIMATE PROTOCOL DEBUG FAILED:', error.message);
    console.log('\n🔍 This gives us definitive insight into the protocol issue');
    process.exit(1);
  });
