#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const http = require('http');

// Function to open browser
function openBrowser(url) {
  const start = process.platform === 'darwin' ? 'open' : 
                process.platform === 'win32' ? 'start' : 'xdg-open';
  
  spawn(start, [url], { stdio: 'inherit', detached: true }).unref();
}

// Function to check if server is ready on a specific port
function checkServerReady(port) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: port,
      path: '/',
      method: 'HEAD',
      timeout: 2000
    }, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Function to extract port from Next.js output
function extractPortFromOutput(output) {
  const portMatch = output.match(/Local:\s+http:\/\/localhost:(\d+)/);
  return portMatch ? parseInt(portMatch[1]) : null;
}

// Main function
async function main() {
  console.log('🚀 Starting Next.js development server with auto-browser opening...');
  
  let serverPort = null;
  let serverReady = false;
  
  // Start the Next.js dev server and capture output
  const nextDev = spawn('npx', ['next', 'dev'], {
    stdio: ['inherit', 'pipe', 'inherit'],
    cwd: process.cwd(),
    shell: true
  });

  // Monitor stdout to capture the port information
  nextDev.stdout.on('data', (data) => {
    const output = data.toString();
    process.stdout.write(data); // Still show the output to user
    
    if (!serverPort) {
      serverPort = extractPortFromOutput(output);
      if (serverPort) {
        console.log(`🔍 Detected Next.js server on port ${serverPort}`);
        waitForServerAndOpen(serverPort);
      }
    }
  });

  // Function to wait for server to be ready and open browser
  async function waitForServerAndOpen(port) {
    if (serverReady) return;
    
    console.log(`⏳ Waiting for server to be ready on port ${port}...`);
    
    // Check server readiness with retries
    let attempts = 0;
    const maxAttempts = 15;
    
    while (attempts < maxAttempts && !serverReady) {
      attempts++;
      const isReady = await checkServerReady(port);
      
      if (isReady) {
        serverReady = true;
        console.log(`✅ Server is ready!`);
        
        // Wait a moment for full initialization
        setTimeout(() => {
          const chatUrl = `http://localhost:${port}/chat`;
          console.log(`🌐 Opening browser to ${chatUrl}`);
          
          try {
            openBrowser(chatUrl);
            console.log(`✅ Browser should open to ${chatUrl}`);
          } catch (error) {
            console.log(`⚠️  Could not open browser automatically`);
            console.log(`🔗 Please manually navigate to: ${chatUrl}`);
          }
        }, 1500);
        
        return;
      }
      
      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (!serverReady) {
      console.log(`⚠️  Server might not be fully ready, but attempting to open browser anyway...`);
      const chatUrl = `http://localhost:${port}/chat`;
      openBrowser(chatUrl);
    }
  }

  // Fallback: try common ports if we couldn't extract from output
  setTimeout(() => {
    if (!serverPort) {
      console.log('🔄 Could not detect port from output, trying common ports...');
      const commonPorts = [3000, 3001, 3002, 3003];
      
      (async () => {
        for (const port of commonPorts) {
          const isReady = await checkServerReady(port);
          if (isReady) {
            serverPort = port;
            waitForServerAndOpen(port);
            return;
          }
        }
        
        console.log('❌ Could not detect running server. Please check the terminal output.');
      })();
    }
  }, 5000);

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down development server...');
    nextDev.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    nextDev.kill('SIGTERM');
    process.exit(0);
  });

  nextDev.on('close', (code) => {
    process.exit(code);
  });
}

main().catch(console.error);