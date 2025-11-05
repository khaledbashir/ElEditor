# Quick Start Guide

Welcome to CheatSheet! This guide will get you up and running quickly.

## 🚀 5-Minute Setup

### 1. Clone and Install

```bash
git clone https://github.com/michaelmagan/cheatsheet.git
cd cheatsheet
npm install
```

### 2. Configure API Key

**Option A: Using Tambo CLI (Recommended)**
```bash
npx tambo init
```

**Option B: Manual Setup**
```bash
cp example.env.local .env.local
# Edit .env.local and add your API key from tambo.co/dashboard
```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

## 🎯 What You Get

### Spreadsheet Mode
- **AI-powered spreadsheet editing** with natural language
- **Cell selection** for targeted AI interactions
- **Charts and graphs** from your data
- **10 spreadsheet tools** for AI manipulation

### Document Mode (BlockSuite)
- **Rich document editor** with AI integration
- **Kanban boards** for project management
- **Auto-save** with visual status indicators
- **Thread-document association** (each chat has its own document)

### Split-View Interface
- **Chat on the left** (40%) - Talk to AI
- **Document/Spreadsheet on the right** (60%) - See results instantly
- **Mobile responsive** - Tabs on small screens

## 📊 Storage System

Your data is automatically saved using a **production-grade storage system**:

- ✅ **IndexedDB** - 50+ MB capacity (vs 5-10 MB localStorage)
- ✅ **Auto-save** - Changes saved automatically after 2 seconds
- ✅ **Thread-document linking** - Each thread has its own document
- ✅ **Automatic migration** - Old localStorage data migrated automatically
- ✅ **Error recovery** - Retry logic for failed saves

### Status Indicators

Watch the top-right corner of the editor:

- 🔵 **Saving...** - Your changes are being saved
- 🟢 **Saved** - All changes saved successfully
- 🟠 **Unsaved** - You have unsaved changes

## 🎨 Using the AI

### Spreadsheet Commands

```
"Add a column for email addresses"
"Sort by name ascending"
"Calculate the average of column B"
"Create a bar chart showing sales by month"
"Clear cells A1 to C5"
```

### Document Commands

```
"Add a heading 'Project Overview'"
"Create a Kanban board for my tasks"
"Add a bullet list of features"
"Insert a code block with Python syntax"
```

## 🔧 Development

### Project Structure

```
src/
├── app/
│   └── chat/page.tsx          # Main chat interface
├── components/
│   ├── tambo/                 # Tambo AI components
│   └── ui/                    # UI components
├── lib/
│   ├── storage/               # Storage system (2,425 lines)
│   ├── tambo.ts               # Tambo configuration
│   └── spreadsheet-*.ts       # Spreadsheet utilities
├── hooks/
│   └── useThreadDocument.ts   # Document management hook
└── tools/
    ├── spreadsheet-tools.ts   # Spreadsheet AI tools
    └── blocksuite-tools.ts    # Document AI tools
```

### Key Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run check-types  # TypeScript type checking
```

## 📚 Documentation

### Essential Reading

1. **[README.md](../README.md)** - Project overview and features
2. **[Storage Architecture](./STORAGE_ARCHITECTURE.md)** - Storage system details
3. **[Implementation Summary](./IMPLEMENTATION_SUMMARY.md)** - What's been built
4. **[Documentation Index](./README.md)** - All documentation

### By Use Case

**"I want to understand the project"**
→ Start with [README.md](../README.md)

**"I want to add a feature"**
→ Read [CLAUDE.md](../CLAUDE.md) for architecture

**"I want to understand storage"**
→ See [Storage Architecture](./STORAGE_ARCHITECTURE.md)

**"I want to contribute"**
→ Check [CONTRIBUTING.md](../CONTRIBUTING.md)

## 🎓 Learning Path

### Beginner (Day 1)

1. ✅ Complete the 5-minute setup above
2. ✅ Try spreadsheet commands with AI
3. ✅ Switch to document mode and try Kanban
4. ✅ Read [README.md](../README.md) Features section

### Intermediate (Week 1)

1. ✅ Read [CLAUDE.md](../CLAUDE.md) Architecture Overview
2. ✅ Explore `src/lib/tambo.ts` to see component registration
3. ✅ Look at `src/tools/spreadsheet-tools.ts` to understand tools
4. ✅ Read [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)

### Advanced (Month 1)

1. ✅ Study [Storage Architecture](./STORAGE_ARCHITECTURE.md)
2. ✅ Review `src/lib/storage/` implementation
3. ✅ Create a custom Tambo component
4. ✅ Add a new AI tool
5. ✅ Contribute a feature!

## 🔍 Common Tasks

### Add a Custom Component

1. Create component in `src/components/tambo/my-component.tsx`
2. Define Zod schema for props
3. Register in `src/lib/tambo.ts` components array
4. Test with AI: "Create a MyComponent with..."

See [README.md](../README.md) Customizing section for details.

### Add a Custom Tool

1. Create tool in `src/tools/my-tool.ts`
2. Define function with Zod schema
3. Register in `src/lib/tambo.ts` tools array
4. Test with AI: "Use myTool to..."

See [README.md](../README.md) Creating Custom Tools section.

### Use Storage in Your Component

```typescript
import { useThreadDocument } from '@/hooks/useThreadDocument';

function MyComponent({ threadId }) {
  const {
    document,
    isLoading,
    isSaving,
    updateContent,
  } = useThreadDocument({
    threadId,
    autoSave: true,
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {isSaving && <span>Saving...</span>}
      {/* Your component */}
    </div>
  );
}
```

See [Storage Architecture](./STORAGE_ARCHITECTURE.md) for more examples.

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Next.js will automatically use the next available port
# Check terminal output for the actual port (e.g., 3001, 3002)
```

### API Key Issues

```bash
# Make sure .env.local exists and has:
NEXT_PUBLIC_TAMBO_API_KEY=your_key_here

# Get your key from: https://tambo.co/dashboard
```

### Storage Issues

```bash
# Open browser DevTools → Application → IndexedDB
# Look for "blocksuite_documents" database
# If issues persist, clear IndexedDB and reload
```

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run dev
```

## 🎉 Next Steps

Now that you're set up:

1. **Explore the demo**: Try different AI commands
2. **Read the docs**: Understand the architecture
3. **Build something**: Create a custom component or tool
4. **Contribute**: Share your improvements!

## 🔗 Resources

### Project Links
- **Demo**: [cheatsheet.tambo.co](https://cheatsheet.tambo.co)
- **GitHub**: [michaelmagan/cheatsheet](https://github.com/michaelmagan/cheatsheet)
- **Tambo AI**: [tambo.co](https://tambo.co)

### Documentation
- **[README.md](../README.md)** - Main documentation
- **[Storage Architecture](./STORAGE_ARCHITECTURE.md)** - Storage system
- **[Implementation Summary](./IMPLEMENTATION_SUMMARY.md)** - Recent changes
- **[Documentation Index](./README.md)** - All docs

### Tambo AI Docs
- [Components](https://docs.tambo.co/concepts/components)
- [Tools](https://docs.tambo.co/concepts/tools)
- [Interactables](https://docs.tambo.co/concepts/components/interactable-components)
- [Additional Context](https://docs.tambo.co/concepts/additional-context)

## 💡 Tips

- **Use cell selection** in spreadsheet mode for targeted AI actions
- **Watch status indicators** to know when your work is saved
- **Try voice input** (coming soon!) for hands-free editing
- **Explore MCP servers** to connect external data sources
- **Check the roadmap** in [BEAUTIFUL_AI_IMPLEMENTATION_CHECKLIST.md](../BEAUTIFUL_AI_IMPLEMENTATION_CHECKLIST.md)

## 🤝 Get Help

- **Issues**: [GitHub Issues](https://github.com/michaelmagan/cheatsheet/issues)
- **Discussions**: [GitHub Discussions](https://github.com/michaelmagan/cheatsheet/discussions)
- **Contributing**: [CONTRIBUTING.md](../CONTRIBUTING.md)

---

**Ready to build something amazing?** Let's go! 🚀

