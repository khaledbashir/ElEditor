#!/usr/bin/env node

const { spawn } = require('child_process');

// Kill any existing Next.js processes on the same port
function killExistingProcesses(port) {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    exec(`lsof -ti:${port}`, (error, stdout, stderr) => {
      if (stdout.trim()) {
        const pids = stdout.trim().split('\n');
        pids.forEach(pid => {
          console.log(`🔄 Killing existing process on port ${port}: PID ${pid}`);
          exec(`kill -9 ${pid}`);
        });
        setTimeout(resolve, 1000); // Wait a second for processes to die
      } else {
        resolve();
      }
    });
  });
}

// Function to open browser
function openBrowser(url) {
  const { spawn } = require('child_process');
  const start = process.platform === 'darwin' ? 'open' : 
                process.platform === 'win32' ? 'start' : 'xdg-open';
  
  spawn(start, [url], { stdio: 'inherit', detached: true }).unref();
  console.log(`🌐 Opened browser to ${url}`);
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
  const port = process.argv[2] || 3001;
  const url = `http://localhost:${port}`;
  
  console.log('🚀 Starting optimized Next.js development server...');
  console.log(`📍 Port: ${port}`);
  
  // Kill existing processes
  await killExistingProcesses(port);
  
  // Start Next.js with optimized settings
  const nextDev = spawn('npm', ['run', 'dev:optimized', '--', '-p', port], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_OPTIONS: '--max-old-space-size=4096 --optimize-for-size'
    }
  });

  // Wait for server and open browser
  console.log('⏳ Waiting for server to be ready...');
  let attempts = 0;
  const maxAttempts = 10;
  
  const waitForServer = setInterval(async () => {
    attempts++;
    const isReady = await checkServerReady(port);
    
    if (isReady || attempts >= maxAttempts) {
      clearInterval(waitForServer);
      if (isReady) {
        console.log('✅ Server is ready!');
        openBrowser(url);
      } else {
        console.log('⚠️ Server might not be ready, but continuing...');
        openBrowser(url);
      }
    }
  }, 1000);

  nextDev.on('close', (code) => {
    console.log(`Next.js process exited with code ${code}`);
    process.exit(code);
  });

  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down development server...');
    nextDev.kill('SIGINT');
    process.exit(0);
  });
}

main().catch(console.error);