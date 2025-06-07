const { spawn } = require('child_process');

async function testSimpleTool() {
  console.log('Testing simplest possible tool...');
  
  const serverProcess = spawn('uv', ['run', 'memory'], {
    env: {
      ...process.env,
      MCP_MEMORY_CHROMA_PATH: '/Users/hkr/Library/Application Support/mcp-memory/chroma_db',
      MCP_MEMORY_BACKUPS_PATH: '/Users/hkr/Library/Application Support/mcp-memory/backups',
      LOG_LEVEL: 'DEBUG'
    },
    cwd: '/Users/hkr/Documents/GitHub/mcp-memory-service',
    stdio: ['pipe', 'pipe', 'pipe']
  });

  return new Promise((resolve, reject) => {
    let response = '';
    let initComplete = false;
    let responseReceived = false;

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
              
              // Test the simplest dashboard tool
              const toolCall = {
                jsonrpc: '2.0',
                method: 'tools/call',
                params: {
                  name: 'dashboard_check_health',
                  arguments: {}
                },
                id: 2
              };
              
              console.log('📤 Sending dashboard_check_health call:', toolCall);
              serverProcess.stdin.write(JSON.stringify(toolCall) + '\n');
              
            } else if (result.id === 2) {
              responseReceived = true;
              console.log('🎉 Tool call successful!');
              console.log('Result:', result);
              
              // Parse the result to see the actual health data
              if (result.result && result.result.length > 0) {
                try {
                  const healthData = JSON.parse(result.result[0].text);
                  console.log('Health status:', healthData);
                } catch (e) {
                  console.log('Result text:', result.result[0].text);
                }
              }
              
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
      const stderrStr = data.toString();
      console.log('🔍 STDERR:', stderrStr);
      
      // Look for any tool-related debug messages
      if (stderrStr.includes('Tool call received') || stderrStr.includes('dashboard_check_health')) {
        console.log('🎯 Tool execution detected!');
      }
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
        clientInfo: { name: 'simple-test', version: '0.1.0' }
      },
      id: 1
    };

    console.log('📤 Sending initialize request');
    serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');

    setTimeout(() => {
      if (!responseReceived) {
        console.error('❌ Timeout - checking server logs...');
        
        // Send a signal to try to get the server to respond
        console.log('Attempting to interrupt...');
        serverProcess.kill('SIGINT');
        
        setTimeout(() => {
          reject(new Error('Timeout waiting for tool response'));
        }, 2000);
      }
    }, 15000);
  });
}

testSimpleTool()
  .then(result => {
    console.log('🎉 Simple tool test successful!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Simple tool test failed:', error.message);
    process.exit(1);
  });
