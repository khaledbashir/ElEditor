# 📚 BlockSuite Document Saving Guide

This guide covers all the best options for saving documents from BlockSuite, from basic auto-save to advanced export formats.

## 🏆 **Quick Summary: Recommended Options**

| Use Case | Best Option | Format |
|----------|-------------|---------|
| **Daily Use** | Auto-save | Automatic (IndexedDB) |
| **Backup** | ZIP Export | `.zip` with assets |
| **Sharing** | Markdown Export | `.md` |
| **Web Publishing** | HTML Export | `.html` |
| **Data Migration** | JSON Snapshot | `.json` |
| **Simple Notes** | Plain Text | `.txt` |

---

## 🚀 **Quick Start: Instant Save Functions**

If you just want to save documents right now, use these console commands:

```javascript
// In browser console (when BlockSuite editor is loaded)
quickSaveJSON()      // Save as JSON
quickSaveMarkdown()  // Save as Markdown  
quickSaveHTML()      // Save as HTML
quickSaveZIP()       // Save as complete ZIP package
```

**That's it!** These functions will download your document immediately.

---

## 📋 **1. Auto-Save (Recommended for Daily Use)**

**What it does**: Saves automatically every 30 seconds to your browser's local storage.

**Benefits**:
- ✅ Zero manual saving required
- ✅ Never lose your work
- ✅ Instant recovery
- ✅ Works offline
- ✅ Syncs across tabs

**How to enable**:
```javascript
// Enable auto-save (runs in background)
controller.enableAutoSave();

// Disable when needed
controller.disableAutoSave();

// Save manually to local storage
controller.saveToLocalStorage();
```

**Auto-save data**:
- Stored in `localStorage` with key `blocksuite-{doc-id}`
- Includes: title, content, timestamp
- Survives browser restarts
- Can be accessed and restored programmatically

---

## 📦 **2. ZIP Export (Best for Backup)**

**What it does**: Exports complete document with all assets (images, files) as a ZIP archive.

**Best for**:
- Full backups
- Complete document packages
- Archival storage
- Transferring to other computers

**How to use**:
```javascript
// Quick export
quickSaveZIP();

// Or via controller
await controller.saveDocument('zip');

// With custom filename
await controller.saveDocument('zip', {
  fileName: 'my-project-backup',
  includeAssets: true
});
```

**What's included**:
- All text content
- Images and media files
- Document structure
- Metadata and settings

---

## 📄 **3. Markdown Export (Best for Sharing)**

**What it does**: Converts document to Markdown format for sharing on GitHub, blogs, etc.

**Best for**:
- GitHub repositories
- Documentation sites
- Note-taking apps
- Technical writing

**How to use**:
```javascript
// Quick export
quickSaveMarkdown();

// Or via controller
await controller.saveDocument('markdown');

// With custom filename
await controller.saveDocument('markdown', {
  fileName: 'project-documentation'
});
```

**Markdown features supported**:
- Headings (H1-H6)
- Paragraphs
- Lists (bulleted and numbered)
- Code blocks with syntax highlighting
- Links and references
- Bold and italic text

---

## 🌐 **4. HTML Export (Best for Web)**

**What it does**: Exports as web-ready HTML file that can be opened in any browser.

**Best for**:
- Web publishing
- Email sharing
- Converting to PDF
- Static websites

**How to use**:
```javascript
// Quick export
quickSaveHTML();

// Or via controller
await controller.saveDocument('html');

// With custom filename
await controller.saveDocument('html', {
  fileName: 'web-article'
});
```

**HTML features**:
- Formatted text with styles
- Preserved layout and structure
- Can be opened directly in browsers
- Ready for web hosting

---

## 💾 **5. JSON Export (Best for Data)**

**What it does**: Exports complete document as structured JSON data.

**Best for**:
- Data analysis
- Programmatic processing
- Migration to other systems
- Complete backup with full fidelity

**How to use**:
```javascript
// Quick export
quickSaveJSON();

// Or via controller
await controller.saveDocument('json');

// With custom filename
await controller.saveDocument('json', {
  fileName: 'document-data'
});
```

**JSON structure**:
```json
{
  "type": "page",
  "meta": {
    "id": "doc-id",
    "title": "Document Title",
    "createDate": 1234567890,
    "tags": []
  },
  "blocks": {
    "id": "root-block",
    "flavour": "affine:page",
    // ... complete block tree
  }
}
```

---

## 📝 **6. Plain Text Export (Best for Simple Notes)**

**What it does**: Extracts plain text content without formatting.

**Best for**:
- Simple notes
- Text-based workflows
- Importing into other editors
- Archival in text format

**How to use**:
```javascript
// Via controller
await controller.saveDocument('txt');

// With custom filename
await controller.saveDocument('txt', {
  fileName: 'simple-notes'
});
```

**Text extraction**:
- Plain paragraphs
- Bulleted lists (• item)
- Numbered lists (1. item)
- No formatting preserved

---

## 🔄 **7. Import/Restore Functions**

**Restore from local storage**:
```javascript
// Get all saved documents
const savedDocs = controller.getAllSavedDocuments();

// Restore specific document
const restoredDoc = await controller.restoreFromLocalStorage(docId);
```

**Import from backup files**:
```javascript
// Import ZIP backup (drag & drop or file input)
const file = /* get file from user */;
const restoredDocs = await restoreFromBackup(file);

// Import JSON snapshot
const file = /* get JSON file */;
const restoredDoc = await restoreFromJSON(file);
```

---

## 🎯 **Complete Save Manager**

For advanced users, use the full save manager:

```javascript
import { BlockSuiteSaveManager } from '@/lib/blocksuite-save-utils';

// Create manager instance
const manager = new BlockSuiteSaveManager(page, collection);

// Enable auto-save
manager.enableAutoSave();

// Manual save with options
await manager.saveDocument({
  format: 'markdown',
  includeAssets: true,
  fileName: 'my-document'
});

// Get saved documents
const saved = manager.getAllSavedDocuments();

// Load specific saved document
const restored = manager.loadFromLocalStorage(docId);
```

---

## 🛠️ **UI Integration**

Add the save toolbar to your UI:

```tsx
import { BlockSuiteSaveToolbar } from '@/components/ui/blocksuite-save-toolbar';

function MyEditor() {
  return (
    <div className="editor-container">
      {/* Your editor */}
      <BlockSuiteEditorEnhanced />
      
      {/* Save toolbar */}
      <BlockSuiteSaveToolbar />
    </div>
  );
}
```

---

## ⚡ **Performance Tips**

1. **Use auto-save for daily work** - No performance impact
2. **ZIP export is comprehensive** - Takes 1-2 seconds
3. **Markdown/HTML are fast** - Usually < 500ms
4. **JSON is fastest** - Instant save
5. **Clear old saves** - Use localStorage cleanup

```javascript
// Clear old auto-saves (older than 7 days)
const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
Object.keys(localStorage)
  .filter(key => key.startsWith('blocksuite-'))
  .forEach(key => {
    const data = JSON.parse(localStorage.getItem(key));
    if (data.timestamp < sevenDaysAgo) {
      localStorage.removeItem(key);
    }
  });
```

---

## 🔧 **Advanced Usage**

**Batch operations**:
```javascript
// Save multiple formats at once
const formats = ['json', 'markdown', 'html'];
for (const format of formats) {
  await controller.saveDocument(format);
}
```

**Scheduled saves**:
```javascript
// Save every hour
setInterval(() => {
  controller.saveToLocalStorage();
}, 60 * 60 * 1000);
```

**Integration with external storage**:
```javascript
// Save to external API
const snapshot = /* get snapshot */;
await fetch('/api/documents', {
  method: 'POST',
  body: JSON.stringify(snapshot)
});
```

---

## 🐛 **Troubleshooting**

**"No document found"**:
- Make sure BlockSuite editor is loaded
- Check console for errors
- Wait for editor initialization

**Save fails with "format not supported"**:
- Check BlockSuite version compatibility
- Ensure all required dependencies are installed
- Try JSON format as fallback

**Large documents timeout**:
- Use JSON format for large docs
- Enable auto-save instead of manual saves
- Consider splitting very large documents

**Assets not included**:
- Use ZIP format for complete backup
- Markdown/HTML may not include all assets
- Check asset paths in exported files

---

## 📊 **File Size Comparison**

| Format | Typical Size | Pros | Cons |
|--------|--------------|------|------|
| **JSON** | ~50KB | Complete data, fast | Technical format |
| **Markdown** | ~30KB | Readable, shareable | Limited formatting |
| **HTML** | ~40KB | Web-ready | Browser dependent |
| **ZIP** | ~200KB+ | Complete backup | Larger files |
| **TXT** | ~10KB | Universal | No formatting |

---

## 🎉 **Quick Reference Card**

**Copy this to your desk**:

```javascript
// 🚀 INSTANT SAVE (Console)
quickSaveJSON()      // JSON backup
quickSaveMarkdown()  // GitHub ready
quickSaveHTML()      // Web ready
quickSaveZIP()       // Complete backup

// 🔄 AUTO-SAVE
controller.enableAutoSave()     // Start auto-saving
controller.saveToLocalStorage() // Manual save

// 📊 CHECK STATUS
controller.getAllSavedDocuments() // List saves

// 🔧 WITH OPTIONS
await controller.saveDocument('markdown', {
  fileName: 'my-doc'
});
```

---

## 📚 **Related Files**

- **Core save logic**: `src/lib/blocksuite-save-utils.ts`
- **Controller integration**: `src/lib/blocksuite-control.ts`
- **UI component**: `src/components/ui/blocksuite-save-toolbar.tsx`
- **Hook**: `src/hooks/use-block-suite-controller.ts`

---

**Ready to save your BlockSuite documents? Start with `quickSaveJSON()` in the console! 🎯**