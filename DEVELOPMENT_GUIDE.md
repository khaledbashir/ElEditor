# 🚀 Development Guide

## Quick Start

### Development Scripts

This project includes several development scripts to make your workflow more efficient:

#### Standard Development
```bash
pnpm dev
```
Starts the Next.js development server normally.

#### Auto-Open to Chat Page
```bash
pnpm dev:chat
```
Starts the development server and automatically opens the browser to `http://localhost:[PORT]/chat`. 
This script will:
- Detect the actual port the server is running on (3000, 3001, 3002, etc.)
- Wait for the server to be fully ready
- Open your default browser to the chat page
- Handle port conflicts gracefully

#### Simple Development (No Auto-Open)
```bash
pnpm dev:simple
```
Same as `pnpm dev` but explicitly the simple version without any modifications.

#### Quick Open + Dev (Alternative)
```bash
pnpm dev:open
```
Attempts to open the browser to the chat page first, then starts the dev server.
Note: This may not work on all systems depending on the `open` command availability.

## Port Detection

The `pnpm dev:chat` script automatically detects which port Next.js is using:
- **Port 3000**: Default port
- **Port 3001**: Used when 3000 is occupied
- **Port 3002**: Used when both 3000 and 3001 are occupied
- **And so on...**

The script monitors the Next.js output to determine the exact port and opens the browser accordingly.

## Manual Navigation

If the auto-open scripts don't work in your environment, you can always navigate manually:
- `http://localhost:3000/chat` (or whatever port is shown in the terminal)
- The terminal will show the exact URL when the server starts

## Troubleshooting

### Browser doesn't open automatically
1. Check the terminal output for the detected port
2. Manually navigate to `http://localhost:[PORT]/chat`
3. Ensure your system has the necessary commands (`open` on macOS, `xdg-open` on Linux, `start` on Windows)

### Port conflicts
The script automatically handles port conflicts by detecting the actual port used by Next.js.

### Script errors
If you encounter issues with the custom script, fall back to:
```bash
pnpm dev:simple
```
Then manually navigate to the chat page.

## Development Workflow

1. **Start with chat page**: `pnpm dev:chat`
2. **Server starts automatically** on available port
3. **Browser opens** to `/chat` page
4. **Start developing** with your AI-powered chat interface!

This setup saves you time by automatically opening to your primary development workspace.