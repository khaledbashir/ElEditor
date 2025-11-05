#!/usr/bin/env node

const { spawn } = require('child_process');
const { exec } = require('child_process');

// Find an available port starting from 3001
function findAvailablePort(startPort = 3001, maxTries = 10) {
  return new Promise((resolve, reject) => {
    const net = require('net');
    
    function checkPort(port) {
      const server = net.createServer();
      
      server.listen(port, (err) => {
        if (err) {
          if (port < startPort + maxTries) {
            checkPort(port + 1);
          } else {
            reject(new Error('No available ports found'));
          }
        } else {
          server.once('close', () => resolve(port));
          server.close();
        }
      });
      
      server.on('error', () => {
        if (port < startPort + maxTries) {
          checkPort(port + 1);
        } else {
          reject(new Error('No available ports found'));
        }
      });
    }
    
    checkPort(startPort);
  });
}

// Open browser
function openBrowser(url) {
  const start = process.platform === 'darwin' ? 'open' : 
                process.platform === 'win32' ? 'start' : 'xdg-open';
  
  try {
    spawn(start, [url], { stdio: 'inherit', detached: true }).unref();
    console.log(`🌐 Opened browser to ${url}`);
  } catch (error) {
    console.log(`💡 Manual navigation required: ${url}`);
  }
}

// Check if server is ready
function checkServerReady(port) {
  return new Promise((resolve) => {
    const http = require('http');
    const req = http.request({
      hostname: 'localhost',
      port: port,
      path: '/',
      method: 'HEAD',
      timeout: 3000
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

async function main() {
  console.log('🔍 Finding available port...');
  
  try {
    const port = await findAvailablePort(3001);
    const url = `http://localhost:${port}`;
    
    console.log(`🚀 Starting Next.js development server on port ${port}...`);
    console.log(`📍 URL: ${url}`);
    
    // Set optimized environment
    const env = {
      ...process.env,
      NODE_OPTIONS: '--max-old-space-size=4096',
      PORT: port.toString(),
    };
    
    // Start Next.js dev server
    const nextDev = spawn('npx', ['next', 'dev', '-p', port], {
      stdio: 'inherit',
      env: env
    });

    // Wait for server to be ready and open browser
    let attempts = 0;
    const maxAttempts = 15;
    
    const waitForServer = setInterval(async () => {
      attempts++;
      console.log(`⏳ Checking server readiness (attempt ${attempts}/${maxAttempts})...`);
      
      const isReady = await checkServerReady(port);
      
      if (isReady) {
        clearInterval(waitForServer);
        console.log('✅ Server is ready and compiled!');
        openBrowser(url);
        return;
      }
      
      if (attempts >= maxAttempts) {
        clearInterval(waitForServer);
        console.log('⚠️ Server check timeout, but it might still be starting...');
        openBrowser(url);
      }
    }, 1000);

    nextDev.on('close', (code) => {
      console.log(`\n🛑 Next.js development server stopped (exit code: ${code})`);
      clearInterval(waitForServer);
      process.exit(code);
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down development server...');
      nextDev.kill('SIGINT');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      nextDev.kill('SIGTERM');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error finding available port:', error.message);
    console.log('💡 Try running: pkill -f "next dev" && pnpm dev');
    process.exit(1);
  }
}

main().catch(console.error);