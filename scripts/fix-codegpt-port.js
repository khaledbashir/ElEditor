#!/usr/bin/env node

const { exec, spawn } = require('child_process');
const os = require('os');

// Function to check if port 54112 is in use
function checkPortInUse(port) {
  return new Promise((resolve) => {
    const platform = os.platform();
    let command;
    
    if (platform === 'win32') {
      command = `netstat -aon | findstr :${port}`;
    } else {
      command = `lsof -i :${port}`;
    }
    
    exec(command, (error, stdout, stderr) => {
      if (stdout && stdout.trim()) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}

// Function to get PID using port 54112
function getPIDUsingPort(port) {
  return new Promise((resolve) => {
    const platform = os.platform();
    let command;
    
    if (platform === 'win32') {
      command = `netstat -aon | findstr :${port}`;
    } else {
      command = `lsof -ti :${port}`;
    }
    
    exec(command, (error, stdout, stderr) => {
      if (stdout && stdout.trim()) {
        if (platform === 'win32') {
          // Windows netstat output format is different
          const lines = stdout.trim().split('\n');
          for (const line of lines) {
            const match = line.match(/\s+(\d+)$/);
            if (match) {
              resolve(match[1]);
              return;
            }
          }
          resolve(null);
        } else {
          // macOS/Linux lsof -ti returns just the PID
          resolve(stdout.trim());
        }
      } else {
        resolve(null);
      }
    });
  });
}

// Function to kill process by PID
function killProcess(pid) {
  return new Promise((resolve) => {
    const platform = os.platform();
    let command;
    
    if (platform === 'win32') {
      command = `taskkill /F /PID ${pid}`;
    } else {
      command = `kill -9 ${pid}`;
    }
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(`⚠️  Error killing process ${pid}: ${error.message}`);
        resolve(false);
      } else {
        console.log(`✅ Successfully killed process ${pid}`);
        resolve(true);
      }
    });
  });
}

// Function to check if port is available after killing process
async function verifyPortAvailable(port) {
  console.log('⏳ Verifying port is available...');
  // Wait a moment for the process to fully terminate
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const isInUse = await checkPortInUse(port);
  return !isInUse;
}

// Main function
async function main() {
  const port = 54112;
  console.log(`🔍 Checking CodeGPT extension port ${port}...`);
  
  try {
    // Check if port is in use
    const isInUse = await checkPortInUse(port);
    
    if (!isInUse) {
      console.log(`✅ Port ${port} is available. CodeGPT extension should work properly.`);
      return;
    }
    
    console.log(`⚠️  Port ${port} is currently in use.`);
    
    // Get PID using the port
    const pid = await getPIDUsingPort(port);
    
    if (!pid) {
      console.log(`❌ Could not determine the process ID using port ${port}`);
      console.log('💡 You may need to manually check for processes using this port');
      return;
    }
    
    console.log(`🔍 Found process ${pid} using port ${port}`);
    
    // Ask for confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      rl.question(`Do you want to kill process ${pid} to free up port ${port}? (y/n): `, resolve);
    });
    
    rl.close();
    
    if (answer.toLowerCase() !== 'y') {
      console.log('❌ Operation cancelled. Port remains in use.');
      return;
    }
    
    // Kill the process
    const killed = await killProcess(pid);
    
    if (killed) {
      // Verify port is available
      const isAvailable = await verifyPortAvailable(port);
      
      if (isAvailable) {
        console.log(`✅ Port ${port} is now available! CodeGPT extension should work properly.`);
      } else {
        console.log(`⚠️  Port ${port} might still be in use. There may be multiple processes using it.`);
        console.log('💡 You may need to repeat this process or restart your computer.');
      }
    } else {
      console.log(`❌ Failed to kill process ${pid}. Port ${port} remains in use.`);
      console.log('💡 You may need to run this script with administrator privileges');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('💡 Make sure you have the necessary permissions to manage processes');
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const forceFlag = args.includes('--force') || args.includes('-f');

if (forceFlag) {
  console.log('🔧 Force mode enabled - will automatically kill processes without confirmation');
  
  // Override the question part to auto-confirm
  const originalMain = main;
  main = async function() {
    const port = 54112;
    console.log(`🔍 Checking CodeGPT extension port ${port}...`);
    
    try {
      const isInUse = await checkPortInUse(port);
      
      if (!isInUse) {
        console.log(`✅ Port ${port} is available. CodeGPT extension should work properly.`);
        return;
      }
      
      console.log(`⚠️  Port ${port} is currently in use.`);
      
      const pid = await getPIDUsingPort(port);
      
      if (!pid) {
        console.log(`❌ Could not determine the process ID using port ${port}`);
        return;
      }
      
      console.log(`🔍 Found process ${pid} using port ${port}`);
      console.log(`🔧 Force killing process ${pid}...`);
      
      const killed = await killProcess(pid);
      
      if (killed) {
        const isAvailable = await verifyPortAvailable(port);
        
        if (isAvailable) {
          console.log(`✅ Port ${port} is now available! CodeGPT extension should work properly.`);
        } else {
          console.log(`⚠️  Port ${port} might still be in use.`);
        }
      } else {
        console.log(`❌ Failed to kill process ${pid}.`);
      }
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  };
}

// Run the main function
main().catch(console.error);