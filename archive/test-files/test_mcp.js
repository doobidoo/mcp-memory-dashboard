const { spawn } = require('child_process');
const path = require('path');

async function testMCPServer() {
  console.log('Testing MCP server communication...');
  
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

  const request = {
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'dashboard_check_health',
      arguments: {}
    },
    id: 1
  };

  console.log('Sending request:', JSON.stringify(request));
  serverProcess.stdin.write(JSON.stringify(request) + '\n');

  return new Promise((resolve, reject) => {
    let response = '';
    let responseReceived = false;

    serverProcess.stdout.on('data', (data) => {
      const dataStr = data.toString();
      console.log('Raw response:', dataStr);
      response += dataStr;

      const lines = response.split('\n');
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (!line || responseReceived) continue;

        try {
          const result = JSON.parse(line);
          if (result.jsonrpc === '2.0' && result.id) {
            responseReceived = true;
            console.log('✅ Received valid JSON-RPC response:', result);
            serverProcess.kill();
            resolve(result);
            return;
          }
        } catch (err) {
          console.log('📝 Diagnostic output:', line);
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
        console.error('❌ Server exited without valid response, code:', code);
        reject(new Error(`Server exited with code ${code}`));
      }
    });

    setTimeout(() => {
      if (!responseReceived) {
        console.error('❌ Timeout after 10 seconds');
        serverProcess.kill();
        reject(new Error('Timeout'));
      }
    }, 10000);
  });
}

testMCPServer()
  .then(result => {
    console.log('🎉 Test successful!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  });
