#!/usr/bin/env node

const { spawn } = require('child_process');
const http = require('http');

// Monitor compilation status
function monitorCompilation(port) {
  const checkCompilation = () => {
    return new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: port,
        path: '/',
        method: 'GET',
        timeout: 2000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const isCompiled = !data.includes('Loading') && !data.includes('compiling');
          resolve({
            status: res.statusCode,
            compiled: isCompiled,
            data: data.substring(0, 200) // First 200 chars for debugging
          });
        });
      });

      req.on('error', () => resolve({ status: 0, compiled: false, error: true }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ status: 0, compiled: false, timeout: true });
      });

      req.end();
    });
  };

  return checkCompilation;
}

// Simple loading animation
function showLoadingAnimation() {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let frame = 0;
  
  return setInterval(() => {
    process.stdout.write(`\r${frames[frame]} Compiling application...`);
    frame = (frame + 1) % frames.length;
  }, 100);
}

async function main() {
  const port = process.argv[2] || 3001;
  const url = `http://localhost:${port}`;
  
  console.log('🚀 Starting Next.js with real-time compilation monitoring...');
  console.log(`📍 Port: ${port}`);
  console.log(`🔗 URL: ${url}`);
  console.log('');

  // Start Next.js dev server
  const nextDev = spawn('npx', ['next', 'dev', '-p', port], {
    stdio: 'pipe',
    env: {
      ...process.env,
      NODE_OPTIONS: '--max-old-space-size=4096'
    }
  });

  let compiled = false;
  let loadingInterval = null;

  // Monitor stdout for Next.js messages
  nextDev.stdout.on('data', (data) => {
    const output = data.toString();
    process.stdout.write(output);
    
    // Check for compilation complete messages
    if (output.includes('Ready in') || output.includes('compiled successfully')) {
      if (!compiled) {
        compiled = true;
        if (loadingInterval) {
          clearInterval(loadingInterval);
          process.stdout.write('\n');
        }
        console.log('✅ Application compiled successfully!');
        
        // Open browser
        const start = process.platform === 'darwin' ? 'open' : 
                      process.platform === 'win32' ? 'start' : 'xdg-open';
        spawn(start, [url], { stdio: 'inherit', detached: true }).unref();
        console.log(`🌐 Opened browser to ${url}`);
      }
    }
    
    // Show loading animation during compilation
    if (output.includes('Compiling') || output.includes('Starting')) {
      if (!loadingInterval) {
        loadingInterval = showLoadingAnimation();
      }
    }
  });

  nextDev.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  nextDev.on('close', (code) => {
    if (loadingInterval) {
      clearInterval(loadingInterval);
    }
    console.log(`\n🛑 Next.js development server stopped (exit code: ${code})`);
    process.exit(code);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down development server...');
    nextDev.kill('SIGINT');
    process.exit(0);
  });
}

main().catch(console.error);