const { spawn } = require('child_process');

async function testRegularTool() {
  console.log('Testing regular MCP tool (check_database_health)...');
  
  const serverProcess = spawn('uv', ['run', 'memory'], {
    env: {
      ...process.env,
      MCP_MEMORY_CHROMA_PATH: '/Users/hkr/Library/Application Support/mcp-memory/chroma_db',
      MCP_MEMORY_BACKUPS_PATH: '/Users/hkr/Library/Application Support/mcp-memory/backups'
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
      console.log('Raw response:', dataStr);
      response += dataStr;

      const lines = response.split('\n');
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
          const result = JSON.parse(line);
          if (result.jsonrpc === '2.0' && typeof result.id !== 'undefined') {
            console.log('📨 Received response:', result);

            if (result.id === 1 && !initComplete) {
              console.log('✅ Initialization successful!');
              initComplete = true;
              
              // Try the regular check_database_health tool
              const toolCall = {
                jsonrpc: '2.0',
                method: 'tools/call',
                params: {
                  name: 'check_database_health',
                  arguments: {}
                },
                id: 2
              };
              
              console.log('📤 Sending regular tool call:', toolCall);
              serverProcess.stdin.write(JSON.stringify(toolCall) + '\n');
              
            } else if (result.id === 2 && initComplete) {
              responseReceived = true;
              console.log('🎉 Regular tool call successful!');
              console.log('Result:', result.result);
              serverProcess.kill();
              resolve(result);
              return;
            }
          }
        } catch (err) {
          console.log('📝 Diagnostic:', line);
        }
      }
      response = lines[lines.length - 1];
    });

    serverProcess.stderr.on('data', (data) => {
      console.log('🔍 Server stderr:', data.toString());
    });

    serverProcess.on('error', (err) => {
      console.error('❌ Server error:', err);
      reject(err);
    });

    serverProcess.on('exit', (code) => {
      if (!responseReceived) {
        console.error('❌ Server exited without response, code:', code);
        reject(new Error(`Server exited with code ${code}`));
      }
    });

    // Send initialize request
    const initRequest = {
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        clientInfo: { name: 'test-client', version: '0.1.0' }
      },
      id: 1
    };

    console.log('📤 Sending initialize request');
    serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');

    setTimeout(() => {
      if (!responseReceived) {
        console.error('❌ Timeout after 15 seconds');
        serverProcess.kill();
        reject(new Error('Timeout'));
      }
    }, 15000);
  });
}

testRegularTool()
  .then(result => {
    console.log('🎉 Regular tool test successful!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Regular tool test failed:', error.message);
    process.exit(1);
  });
