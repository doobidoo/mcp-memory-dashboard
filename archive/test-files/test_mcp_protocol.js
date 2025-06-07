const { spawn } = require('child_process');

async function testMCPProtocol() {
  console.log('Testing proper MCP protocol communication...');
  
  const serverProcess = spawn('uv', ['run', 'memory'], {
    env: {
      ...process.env,
      MCP_MEMORY_CHROMA_PATH: '/Users/hkr/Library/Application Support/mcp-memory/chroma_db',
      MCP_MEMORY_BACKUPS_PATH: '/Users/hkr/Library/Application Support/mcp-memory/backups'
    },
    cwd: '/Users/hkr/Documents/GitHub/mcp-memory-service',
    stdio: ['pipe', 'pipe', 'pipe']
  });

  console.log('Server started with PID:', serverProcess.pid);

  return new Promise((resolve, reject) => {
    let response = '';
    let initComplete = false;
    let toolsListed = false;
    let responseReceived = false;
    let step = 1;

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
            console.log(`📨 Received MCP response (step ${step}):`, result);

            if (result.id === 1 && !initComplete) {
              console.log('✅ Initialization successful!');
              initComplete = true;
              step = 2;
              
              // Step 2: List tools
              const listToolsRequest = {
                jsonrpc: '2.0',
                method: 'tools/list',
                params: {},
                id: 2
              };
              
              console.log('📤 Sending tools/list request:', listToolsRequest);
              serverProcess.stdin.write(JSON.stringify(listToolsRequest) + '\n');
              
            } else if (result.id === 2 && initComplete && !toolsListed) {
              console.log('✅ Tools listed successfully!');
              console.log('Available tools:', result.result?.tools?.map(t => t.name) || []);
              toolsListed = true;
              step = 3;
              
              // Step 3: Call the tool
              const toolCall = {
                jsonrpc: '2.0',
                method: 'tools/call',
                params: {
                  name: 'dashboard_check_health',
                  arguments: {}
                },
                id: 3
              };
              
              console.log('📤 Sending tool call:', toolCall);
              serverProcess.stdin.write(JSON.stringify(toolCall) + '\n');
              
            } else if (result.id === 3 && toolsListed) {
              responseReceived = true;
              console.log('🎉 Tool call successful!');
              console.log('Tool result:', result.result);
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
        console.error('Last step reached:', step);
        reject(new Error(`Server exited with code ${code} at step ${step}`));
      }
    });

    // Step 1: Send initialize request
    const initRequest = {
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        clientInfo: {
          name: 'mcp-memory-dashboard',
          version: '0.1.0'
        }
      },
      id: 1
    };

    console.log('📤 Sending initialize request:', initRequest);
    serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');

    setTimeout(() => {
      if (!responseReceived) {
        console.error('❌ Timeout after 20 seconds');
        console.error('Current step:', step);
        console.error('Init complete:', initComplete);
        console.error('Tools listed:', toolsListed);
        serverProcess.kill();
        reject(new Error('Timeout'));
      }
    }, 20000);
  });
}

testMCPProtocol()
  .then(result => {
    console.log('🎉 MCP Protocol test successful!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 MCP Protocol test failed:', error.message);
    process.exit(1);
  });
