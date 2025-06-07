const { spawn } = require('child_process');

async function testMinimalServer() {
  console.log('Testing minimal MCP server...');
  
  const serverProcess = spawn('python3', ['minimal_test_server.py'], {
    cwd: '/Users/hkr/Documents/GitHub/mcp-memory-dashboard',
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
              console.log('✅ Minimal server initialized!');
              initComplete = true;
              
              const toolCall = {
                jsonrpc: '2.0',
                method: 'tools/call',
                params: {
                  name: 'simple_test',
                  arguments: {}
                },
                id: 2
              };
              
              console.log('📤 Sending simple tool call:', toolCall);
              serverProcess.stdin.write(JSON.stringify(toolCall) + '\n');
              
            } else if (result.id === 2) {
              responseReceived = true;
              console.log('🎉 Minimal tool call successful!');
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
        clientInfo: { name: 'minimal-test', version: '0.1.0' }
      },
      id: 1
    };

    console.log('📤 Sending initialize request');
    serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');

    setTimeout(() => {
      if (!responseReceived) {
        console.error('❌ Minimal server timeout after 10 seconds');
        serverProcess.kill();
        reject(new Error('Minimal server timeout'));
      }
    }, 10000);
  });
}

testMinimalServer()
  .then(result => {
    console.log('🎉 Minimal server test successful!');
    console.log('This means MCP framework is working correctly');
    console.log('The issue is in the memory service implementation');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Minimal server test failed:', error.message);
    console.log('This suggests an MCP framework issue');
    process.exit(1);
  });
