# Cheat Sheet

[![GitHub](https://img.shields.io/badge/github-michaelmagan/cheatsheet-blue?logo=github)](https://github.com/michaelmagan/cheatsheet)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![Tambo AI](https://img.shields.io/badge/Tambo-AI-purple)](https://tambo.co)

An AI-powered, open-source Google Sheets competitor built with [Tambo AI](https://tambo.co).

Build and manipulate interactive spreadsheets with natural language, alongside graphs and visualizations.

## Demo
Try it yourself: **[CheatSheet](https://cheatsheet.tambo.co)**

### Preview
https://github.com/user-attachments/assets/da72aa8b-6bc5-468e-8f42-0da685105d22

## Features

- **Edit with AI**: Use natural language to interact with a spreadsheet.
- **Cell Selection**: Select cells to have the AI interact with.
- **Multi-Modal**: Attach Images along with Messages.
- **Charts and Graphs**: Create visualizations from your spreadsheet data
- **Model Context Protocol (MCP)**: Connect external data sources and tools
- **BlockSuite Document Editor**: Rich document editing with AI integration
- **Production-Grade Storage**: Enterprise-ready IndexedDB storage with auto-save and thread-document association

## Roadmap

- **Voice Input**: Use voice input in addition to typing.
- **Formula Support**: Spreadsheet formulas (SUM, AVERAGE, IF, VLOOKUP, etc.)
- **Better Formatting**: More visual options for tables (colors, borders, fonts, alignment)
- **Import/Export**: CSV, XLSX, and JSON support


## Get Started

**Quick Start**: See [docs/QUICK_START.md](./docs/QUICK_START.md) for a 5-minute setup guide!

1. Clone this repository

2. Navigate to the project directory:
   ```bash
   cd spreadsheet-template
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Set up your environment variables:

   **Option A: Using Tambo CLI (Recommended)**
   ```bash
   npx tambo init
   ```
   This will interactively prompt you for your Tambo API key and create `.env.local` automatically.

   **Option B: Manual Setup**
   ```bash
   cp example.env.local .env.local
   ```
   Then edit `.env.local` and add your API key from [tambo.co/dashboard](https://tambo.co/dashboard).

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to use the app!

## Architecture Overview

This template shows how the AI reads and updates the spreadsheet through three ways:

### How AI Accesses Spreadsheet State

**Context Helpers** (Read-only data)
- `spreadsheetContextHelper` - Gives the AI the current tab's data as a markdown table
- `spreadsheetSelectionContextHelper` - Tells the AI what's currently selected
- Runs automatically whenever you send a message
- See: `src/lib/spreadsheet-context-helper.ts`, `src/lib/spreadsheet-selection-context.ts`

**Tools** (Make changes)
- 10 tools the AI can use to change the spreadsheet
- Context helpers and interactables are read-only; tools make changes
- See: `src/tools/spreadsheet-tools.ts`

**Interactables** (Structured metadata)
- `InteractableTabs` - Sends tab info (names, IDs, active tab) to the AI
- Components wrapped with `withInteractable` HOC
- Keeps the AI in sync when tabs change
- See: `src/components/ui/interactable-tabs.tsx``

### Spreadsheet Tools Reference

| Tool | Purpose |
|------|---------|
| `updateCell` | Update a single cell's value |
| `updateRange` | Update multiple cells at once |
| `addColumn` | Add a new column |
| `removeColumn` | Remove a column |
| `addRow` | Add a new row |
| `removeRow` | Remove a row |
| `readCell` | Read a single cell's value |
| `readRange` | Read multiple cells |
| `clearRange` | Clear cell values in a range |
| `sortByColumn` | Sort rows by column values |

### Key Files

**Configuration**
- `src/lib/tambo.ts` - Component and tool registration
- `src/app/chat/page.tsx` - Main chat interface with TamboProvider

**Spreadsheet System**
- `src/components/ui/spreadsheet-tabs.tsx` - Visual tab interface
- `src/lib/spreadsheet-tabs-store.ts` - Zustand store managing spreadsheet data
- `src/lib/spreadsheet-utils.ts` - Utility functions for data manipulation

**State Management**
- `src/lib/canvas-storage.ts` - Canvas/tab state management
- Powered by `@silevis/reactgrid` library and Zustand

**Storage System**
- `src/lib/storage/` - Production-grade storage architecture
- `src/lib/storage-system-singleton.ts` - Global storage instance
- `src/hooks/useThreadDocument.ts` - React hook for document management
- See [Storage Architecture](./docs/STORAGE_ARCHITECTURE.md) for details

**Note on Dependencies:** This project uses `@silevis/reactgrid@4.1.17` with `legacy-peer-deps=true` to work around React 19 peer dependency constraints. The library functions correctly despite the warning.

## Customizing

### Adding Custom Components

Register components in `src/lib/tambo.ts` that the AI can render inline in chat. Example structure:

```tsx
import type { TamboComponent } from "@tambo-ai/react";

const components: TamboComponent[] = [
  {
    name: "MyComponent",
    description: "When to use this component",
    component: MyComponent,
    propsSchema: myComponentSchema, // Zod schema
  },
];
```

See `src/components/tambo/` for component examples and [Tambo Components docs](https://docs.tambo.co/concepts/components) for detailed guidance.

### Creating Custom Tools

Add tools in `src/tools/` following this pattern:

```tsx
export const myTool = {
  name: "toolName",
  description: "What this tool does",
  tool: async (param: string) => {
    // Implementation
    return { success: true, message: "Result" };
  },
  toolSchema: z.function().args(
    z.string().describe("Parameter description")
  ).returns(z.object({
    success: z.boolean(),
    message: z.string().optional(),
  })),
};
```

Register in `src/lib/tambo.ts` tools array. See [Tambo Tools docs](https://docs.tambo.co/concepts/tools) for details.

### Model Context Protocol (MCP)

Configure MCP servers via the settings modal to connect external data sources. Servers are stored in browser localStorage and wrapped with `TamboMcpProvider` in the chat interface.

## Storage System

This application features a **production-grade storage architecture** that replaces localStorage with IndexedDB for better performance, capacity, and reliability.

### Key Features

- **IndexedDB Storage**: 50+ MB capacity (vs 5-10 MB localStorage limit)
- **Thread-Document Association**: Each chat thread has its own persistent document
- **Auto-Save**: Debounced auto-save with queue management (never lose work)
- **Automatic Migration**: Seamlessly migrates existing localStorage data to IndexedDB
- **Error Recovery**: Retry logic with exponential backoff for failed operations
- **Type-Safe**: Full TypeScript coverage with comprehensive interfaces

### Quick Start

The storage system initializes automatically when you start the app. Documents are automatically created and saved for each thread.

```typescript
// Use in React components
import { useThreadDocument } from '@/hooks/useThreadDocument';

function MyComponent({ threadId }) {
  const { document, updateContent, isSaving } = useThreadDocument({
    threadId,
    autoSave: true,
  });

  // Document loads automatically
  // Changes auto-save after 2 seconds
  // Status indicators show saving/saved state
}
```

### Documentation

- **[Storage Architecture](./docs/STORAGE_ARCHITECTURE.md)** - Detailed technical documentation
- **[Implementation Summary](./docs/IMPLEMENTATION_SUMMARY.md)** - Features, performance, and usage examples

### Architecture Overview

```
React Components → useThreadDocument Hook → Storage Manager → IndexedDB
                                          ↓
                                   Thread-Document Service
```

The system provides:
- **Storage Manager**: Handles all storage operations with retry logic
- **Thread-Document Service**: Links threads to documents automatically
- **IndexedDB Adapter**: ACID transactions with proper error handling
- **Migration Utilities**: Automatic localStorage → IndexedDB migration

## Documentation

### Project Documentation
- **[Storage Architecture](./docs/STORAGE_ARCHITECTURE.md)** - Production storage system
- **[Implementation Summary](./docs/IMPLEMENTATION_SUMMARY.md)** - Storage features and usage

### Tambo AI Documentation
Learn more about Tambo:
- [Components](https://docs.tambo.co/concepts/components)
- [Interactable Components](https://docs.tambo.co/concepts/components/interactable-components)
- [Tools](https://docs.tambo.co/concepts/tools)
- [Additional Context](https://docs.tambo.co/concepts/additional-context)

Built with [Tambo AI](https://tambo.co) - A framework for building AI-powered UIs. Tambo is open source: [tambo-ai/tambo](https://github.com/tambo-ai/tambo).

## Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT License
