# CodeGPT VSCode Extension Troubleshooting Guide

## Introduction

This guide is designed to help you resolve common issues that may arise during the installation and use of the CodeGPT extension. Before you begin, ensure that you meet all the requirements and configurations outlined below.

## Requirements

To run the CodeGPT extension, your setup must meet the following requirements:

- **VSCode Version**: Your VSCode must be version 1.96.0 or higher.
- **Node.js Version**: Your Node.js must be version 20.0.0 or higher.

### Checking Your Versions

#### VSCode Version Check
1. Open VSCode
2. Go to **Help** → **About** (or **Code** → **About Visual Studio Code** on macOS)
3. Verify your version is 1.96.0 or higher

#### Node.js Version Check
```bash
node --version
```
Ensure the output shows v20.0.0 or higher.

## Common Issues and Solutions

### Issue: Port 54112 Conflict

**Problem**: The CodeGPT extension requires the use of port 54112 for localhost. If this port is not available, the extension will fail to run.

**Solution**: Ensure that port 54112 is free and not being used by any other application.

#### Automated Solution (Recommended)

If you're working in this project, you can use the automated script to fix the port issue:

```bash
# Interactive mode (will ask for confirmation)
npm run fix:codegpt-port

# Force mode (automatically kills processes without confirmation)
npm run fix:codegpt-port:force
```

This script will:
1. Check if port 54112 is in use
2. Identify the process using the port
3. Prompt you to terminate the process (or do it automatically with force mode)
4. Verify the port is available after termination

#### Platform-Specific Scripts

For direct execution without npm, you can use the platform-specific scripts:

**Windows:**
```cmd
# Interactive mode
scripts\fix-codegpt-port.bat

# Or run from Command Prompt as Administrator if needed
```

**macOS/Linux:**
```bash
# Interactive mode
./scripts/fix-codegpt-port.sh

# Force mode (automatically kills processes without confirmation)
./scripts/fix-codegpt-port.sh --force

# Or with sudo if needed
sudo ./scripts/fix-codegpt-port.sh
```

#### Manual Solution

**For Windows:**

```cmd
netstat -aon | findstr :54112
```

This command will show you if the port is in use and provide the Process ID (PID). If a PID is returned, use the following command to terminate the process:

```cmd
taskkill /F /PID <PID>
```

Replace `<PID>` with the actual Process ID using the port. The first command will provide you with a 4-digit Process ID number.

**For macOS and Linux:**

```bash
lsof -i :54112
```

This command will list processes using port 54112. To terminate the process:

```bash
kill -9 <PID>
```

Replace `<PID>` with the actual Process ID shown in the previous command.

### Issue: Using DevContainer

**Problem**: When using a devcontainer, port 54112 must be opened in the Docker Compose configuration.

**Solution**: Ensure that your `docker-compose.yml` includes the following configuration to open port 54112:

```yaml
services:
  your-service-name:
    ports:
      - "54112:54112"
```

#### Additional DevContainer Configuration

If you're using VSCode Dev Containers, also ensure your `.devcontainer/devcontainer.json` includes the port forwarding:

```json
{
  "forwardPorts": [54112],
  "portsAttributes": {
    "54112": {
      "label": "CodeGPT Extension",
      "onAutoForward": "notify"
    }
  }
}
```

### Issue: VSCode Tunnel Incompatibility

**Problem**: The CodeGPT extension is incompatible with VSCode Tunnel as it cannot run localhost under this setup.

**Solution**: Unfortunately, no workaround exists for using the CodeGPT extension with VSCode Tunnel. Please ensure you run VSCode in a local environment where localhost can be used.

#### Alternative Solutions

If you need remote development capabilities, consider these alternatives:

1. **Remote SSH Extension**: Use VSCode's Remote SSH extension instead of VSCode Tunnel
2. **Local Development**: Set up a local development environment that meets the requirements
3. **GitHub Codespaces**: Use GitHub Codespaces with proper port forwarding configuration

## Additional Troubleshooting Steps

### Extension Installation Issues

#### Problem: Extension fails to install
1. **Check VSCode Version**: Ensure you're using VSCode 1.96.0 or higher
2. **Restart VSCode**: Sometimes a simple restart resolves installation issues
3. **Clear Extension Cache**: 
   - Close VSCode
   - Navigate to your VSCode extensions directory
   - Delete the `ms-vscode.cpptools` folder (if exists)
   - Restart VSCode and reinstall

#### Problem: Extension installs but doesn't activate
1. **Check Dependencies**: Ensure Node.js 20.0.0+ is installed
2. **Reload Window**: Use `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) and run "Developer: Reload Window"
3. **Check Extension Logs**: 
   - Open `Help` → **Toggle Developer Tools**
   - Check the console for error messages

### Performance Issues

#### Problem: Extension is slow or unresponsive
1. **Check System Resources**: Ensure you have sufficient RAM and CPU available
2. **Disable Conflicting Extensions**: Some extensions may conflict with CodeGPT
3. **Update Extensions**: Ensure all extensions are up to date
4. **Increase Node.js Memory Limit**:
   ```bash
   export NODE_OPTIONS="--max-old-space-size=4096"
   ```

### Network Issues

#### Problem: Extension can't connect to required services
1. **Check Firewall Settings**: Ensure port 54112 is not blocked by your firewall
2. **Proxy Settings**: If behind a corporate proxy, configure VSCode proxy settings
3. **DNS Issues**: Try flushing your DNS cache:
   - Windows: `ipconfig /flushdns`
   - macOS/Linux: `sudo dscacheutil -flushcache`

## Getting Help

If you're still experiencing issues after trying these solutions:

1. **Check the Extension Marketplace**: Look for recent updates or known issues
2. **Report an Issue**: 
   - Go to the extension's marketplace page
   - Click "Report an issue"
   - Include your VSCode version, Node.js version, and detailed error logs
3. **Community Forums**: Check for solutions in community forums or GitHub discussions

## Best Practices

1. **Keep Software Updated**: Regularly update VSCode, Node.js, and the CodeGPT extension
2. **Regular Backups**: Back up your VSCode settings and extensions regularly
3. **Monitor Port Usage**: Regularly check which ports are in use on your system
4. **Document Configuration**: Keep a record of your working configuration for quick setup on new machines

## Frequently Asked Questions

### Q: Can I use a different port instead of 54112?
A: No, the CodeGPT extension is hardcoded to use port 54112 and cannot be configured to use a different port.

### Q: Does the extension work with VSCode Server?
A: No, the extension requires a local VSCode installation and doesn't work with VSCode Server or remote development setups that don't provide localhost access.

### Q: Can I use the extension with multiple Node.js versions?
A: While you can have multiple Node.js versions installed, VSCode must be configured to use Node.js 20.0.0 or higher for the CodeGPT extension to work properly.

### Q: What if I'm behind a corporate firewall?
A: You'll need to work with your IT department to ensure port 54112 is open for localhost connections and that any proxy settings are properly configured in VSCode.