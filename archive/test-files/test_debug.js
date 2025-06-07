const { spawn } = require('child_process');

async function testWithDebugLogging() {
  console.log('Testing with debug logging enabled...');
  
  const serverProcess = spawn('uv', ['run', 'memory', '--debug'], {
    env: {
      ...process.env,
      MCP_MEMORY_CHROMA_PATH: '/Users/hkr/Library/Application Support/mcp-memory/chroma_db',
      MCP_MEMORY_BACKUPS_PATH: '/Users/hkr/Library/Application Support/mcp-memory/backups',
      LOG_LEVEL: 'DEBUG'  // Enable debug logging
    },
    cwd: '/Users/hkr/Documents/GitHub/mcp-memory-service',
    stdio: ['pipe', 'pipe', 'pipe']
  });

  return new Promise((resolve, reject) => {
    let response = '';
    let initComplete = false;
    let responseReceived = false;
    let toolSent = false;

    serverProcess.stdout.on('data', (data) => {
      const dataStr = data.toString();
      console.log('📤 STDOUT:', dataStr);
      response += dataStr;

      const lines = response.split('\n');
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
          const result = JSON.parse(line);
          if (result.jsonrpc === '2.0' && typeof result.id !== 'undefined') {
            console.log('📨 JSON Response:', result);

            if (result.id === 1 && !initComplete) {
              console.log('✅ Initialization successful!');
              initComplete = true;
              
              // Test a simple tool first
              const toolCall = {
                jsonrpc: '2.0',
                method: 'tools/call',
                params: {
                  name: 'check_embedding_model',
                  arguments: {}
                },
                id: 2
              };
              
              console.log('📤 Sending simple tool call:', toolCall);
              serverProcess.stdin.write(JSON.stringify(toolCall) + '\n');
              toolSent = true;
              
            } else if (result.id === 2 && toolSent) {
              responseReceived = true;
              console.log('🎉 Tool call successful!');
              console.log('Result:', result);
              serverProcess.kill();
              resolve(result);
              return;
            }
          }
        } catch (err) {
          console.log('📝 Non-JSON:', line);
        }
      }
      response = lines[lines.length - 1];
    });

    serverProcess.stderr.on('data', (data) => {
      console.log('🔍 STDERR:', data.toString());
    });

    serverProcess.on('error', (err) => {
      console.error('❌ Process error:', err);
      reject(err);
    });

    serverProcess.on('exit', (code, signal) => {
      console.log(`🏁 Process exited with code ${code}, signal ${signal}`);
      if (!responseReceived) {
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
        clientInfo: { name: 'debug-client', version: '0.1.0' }
      },
      id: 1
    };

    console.log('📤 Sending initialize request');
    serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');

    // Longer timeout for debugging
    setTimeout(() => {
      if (!responseReceived) {
        console.error('❌ Timeout after 30 seconds');
        console.error('Tool sent:', toolSent);
        console.error('Init complete:', initComplete);
        
        // Let's try to see what the server is doing
        console.log('🔍 Sending SIGTERM to see server state...');
        serverProcess.kill('SIGTERM');
        
        setTimeout(() => {
          reject(new Error('Debug timeout'));
        }, 2000);
      }
    }, 30000);
  });
}

testWithDebugLogging()
  .then(result => {
    console.log('🎉 Debug test successful!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Debug test failed:', error.message);
    process.exit(1);
  });
