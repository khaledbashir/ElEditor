@echo off
echo Fixing CodeGPT extension port 54112 issue...
echo.

REM Check if running with administrator privileges
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running with administrator privileges...
) else (
    echo Warning: Not running with administrator privileges.
    echo If the script fails, try running as administrator.
    echo.
)

REM Check if port is in use
echo Checking if port 54112 is in use...
netstat -aon | findstr :54112 >nul
if %errorLevel% == 1 (
    echo Port 54112 is available. CodeGPT extension should work properly.
    pause
    exit /b 0
)

echo Port 54112 is currently in use.
echo.

REM Get PID using the port
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :54112') do set PID=%%a
if "%PID%"=="" (
    echo Could not determine the process ID using port 54112.
    pause
    exit /b 1
)

echo Found process %PID% using port 54112.
echo.

REM Ask for confirmation
set /p confirm="Do you want to kill process %PID% to free up port 54112? (y/n): "
if /i not "%confirm%"=="y" (
    echo Operation cancelled. Port remains in use.
    pause
    exit /b 0
)

REM Kill the process
echo Killing process %PID%...
taskkill /F /PID %PID%
if %errorLevel% == 0 (
    echo Successfully killed process %PID%.
    
    REM Wait a moment for the process to fully terminate
    timeout /t 2 /nobreak >nul
    
    REM Verify port is available
    echo Verifying port is available...
    netstat -aon | findstr :54112 >nul
    if %errorLevel% == 1 (
        echo Port 54112 is now available! CodeGPT extension should work properly.
    ) else (
        echo Port 54112 might still be in use. There may be multiple processes using it.
        echo You may need to repeat this process or restart your computer.
    )
) else (
    echo Failed to kill process %PID%. Port 54112 remains in use.
    echo You may need to run this script with administrator privileges.
)

echo.
pause