#!/bin/bash

# Fix CodeGPT extension port 54112 issue for macOS/Linux

echo "Fixing CodeGPT extension port 54112 issue..."
echo

# Function to check if running with appropriate privileges
check_privileges() {
    if [[ $EUID -eq 0 ]]; then
        echo "Running with root privileges..."
    else
        echo "Note: Not running with root privileges."
        echo "If the script fails, try running with sudo: sudo ./scripts/fix-codegpt-port.sh"
        echo
    fi
}

# Function to check if port is in use
check_port_in_use() {
    if lsof -i :54112 >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is available
    fi
}

# Function to get PID using the port
get_pid_using_port() {
    local pid=$(lsof -ti :54112 2>/dev/null)
    echo $pid
}

# Function to kill process
kill_process() {
    local pid=$1
    if kill -9 "$pid" 2>/dev/null; then
        return 0  # Successfully killed
    else
        return 1  # Failed to kill
    fi
}

# Main execution
check_privileges

echo "Checking if port 54112 is in use..."

if ! check_port_in_use; then
    echo "Port 54112 is available. CodeGPT extension should work properly."
    exit 0
fi

echo "Port 54112 is currently in use."
echo

# Get PID using the port
pid=$(get_pid_using_port)

if [[ -z "$pid" ]]; then
    echo "Could not determine the process ID using port 54112."
    exit 1
fi

echo "Found process $pid using port 54112."
echo

# Ask for confirmation (unless --force flag is used)
if [[ "$1" != "--force" ]]; then
    read -p "Do you want to kill process $pid to free up port 54112? (y/n): " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        echo "Operation cancelled. Port remains in use."
        exit 0
    fi
else
    echo "Force mode: Killing process $pid without confirmation..."
fi

# Kill the process
echo "Killing process $pid..."

if kill_process "$pid"; then
    echo "Successfully killed process $pid."
    
    # Wait a moment for the process to fully terminate
    echo "Waiting for process to fully terminate..."
    sleep 2
    
    # Verify port is available
    echo "Verifying port is available..."
    
    if ! check_port_in_use; then
        echo "Port 54112 is now available! CodeGPT extension should work properly."
    else
        echo "Port 54112 might still be in use. There may be multiple processes using it."
        echo "You may need to repeat this process or restart your computer."
    fi
else
    echo "Failed to kill process $pid. Port 54112 remains in use."
    echo "You may need to run this script with sudo: sudo ./scripts/fix-codegpt-port.sh"
fi

echo