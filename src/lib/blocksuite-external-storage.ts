/**
 * External storage options for BlockSuite - NO localStorage
 * Provides file-based saving and cloud storage integration
 */

export interface ExternalStorageOptions {
  autoSaveToFile?: boolean;
  storageBackend?: 'file' | 'indexeddb' | 'backend-api';
  apiEndpoint?: string;
  saveInterval?: number;
}

export interface DocumentSaveRequest {
  id: string;
  title: string;
  content: any;
  format: 'json' | 'markdown' | 'html' | 'zip';
  timestamp: number;
  metadata?: {
    threadId?: string;
    tags?: string[];
    version?: string;
  };
}

/**
 * File-based storage service (recommended)
 */
export class FileStorageService {
  private pendingSaves: Map<string, DocumentSaveRequest> = new Map();
  private saveTimer: NodeJS.Timeout | null = null;

  constructor(private options: ExternalStorageOptions = {}) {
    if (options.autoSaveToFile && options.saveInterval) {
      this.startAutoFileSave();
    }
  }

  /**
   * Save document to file system (downloads to user's computer)
   */
  async saveToFile(docId: string, title: string, snapshot: any, format: 'json' | 'markdown' | 'html' | 'zip' = 'json'): Promise<boolean> {
    try {
      let content: string | Blob;
      let fileName: string;
      let mimeType: string;

      const sanitizedTitle = this.sanitizeFileName(title);
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

      switch (format) {
        case 'json':
          content = JSON.stringify(snapshot, null, 2);
          fileName = `${sanitizedTitle}-${timestamp}.json`;
          mimeType = 'application/json';
          break;
        case 'markdown':
          content = await this.convertToMarkdown(snapshot);
          fileName = `${sanitizedTitle}-${timestamp}.md`;
          mimeType = 'text/markdown';
          break;
        case 'html':
          content = await this.convertToHTML(snapshot);
          fileName = `${sanitizedTitle}-${timestamp}.html`;
          mimeType = 'text/html';
          break;
        case 'zip':
          content = await this.createZipPackage(snapshot, sanitizedTitle);
          fileName = `${sanitizedTitle}-${timestamp}.zip`;
          mimeType = 'application/zip';
          break;
      }

      const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
      this.downloadFile(blob, fileName);

      console.log(`✅ Saved ${format.toUpperCase()} file: ${fileName}`);
      return true;
    } catch (error) {
      console.error('File save failed:', error);
      return false;
    }
  }

  /**
   * Schedule auto-save to file (downloads file automatically)
   */
  scheduleAutoSave(docId: string, title: string, snapshot: any): void {
    const request: DocumentSaveRequest = {
      id: docId,
      title,
      content: snapshot,
      format: 'json',
      timestamp: Date.now()
    };

    this.pendingSaves.set(docId, request);

    // Clear existing timer
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    // Set new timer
    this.saveTimer = setTimeout(() => {
      this.flushAutoSaves();
    }, this.options.saveInterval || 60000); // Default 1 minute
  }

  /**
   * Flush all pending saves to files
   */
  private async flushAutoSaves(): Promise<void> {
    const saves = Array.from(this.pendingSaves.values());
    this.pendingSaves.clear();

    for (const save of saves) {
      await this.saveToFile(save.id, save.title, save.content, 'json');
    }

    console.log(`🔄 Auto-saved ${saves.length} documents to files`);
  }

  /**
   * Start auto-file saving
   */
  private startAutoFileSave(): void {
    console.log("📁 Auto-file-save enabled (downloads files automatically)");
    // This will download files periodically - no localStorage used!
  }

  /**
   * Stop auto-file saving
   */
  stopAutoSave(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
      console.log("🛑 Auto-file-save disabled");
    }
    this.pendingSaves.clear();
  }

  /**
   * Convert BlockSuite snapshot to Markdown
   */
  private async convertToMarkdown(snapshot: any): Promise<string> {
    let markdown = `# ${snapshot.meta?.title || 'Document'}\n\n`;
    
    const processBlock = (block: any, level: number = 0) => {
      const indent = '  '.repeat(level);
      
      switch (block.flavour) {
        case 'affine:paragraph':
          if (block.props?.text) {
            markdown += `${indent}${block.props.text.toString()}\n\n`;
          }
          break;
        case 'affine:list':
          const marker = block.props?.type === 'numbered' ? '1.' : '-';
          if (block.props?.text) {
            markdown += `${indent}${marker} ${block.props.text.toString()}\n`;
          }
          break;
        case 'affine:code':
          if (block.props?.text) {
            const lang = block.props?.language || '';
            markdown += `${indent}\`\`\`${lang}\n${block.props.text.toString()}\n${indent}\`\`\`\n\n`;
          }
          break;
      }
      
      if (block.children) {
        block.children.forEach((child: any) => processBlock(child, level));
      }
    };

    if (snapshot.blocks?.children) {
      snapshot.blocks.children.forEach((block: any) => processBlock(block));
    }

    return markdown;
  }

  /**
   * Convert BlockSuite snapshot to HTML
   */
  private async convertToHTML(snapshot: any): Promise<string> {
    let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${snapshot.meta?.title || 'Document'}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
        code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
        ul, ol { margin-left: 20px; }
    </style>
</head>
<body>
<h1>${snapshot.meta?.title || 'Document'}</h1>
`;

    const processBlock = (block: any) => {
      switch (block.flavour) {
        case 'affine:paragraph':
          if (block.props?.text) {
            html += `<p>${this.escapeHtml(block.props.text.toString())}</p>\n`;
          }
          break;
        case 'affine:list':
          const tag = block.props?.type === 'numbered' ? 'ol' : 'ul';
          if (block.props?.text) {
            html += `<${tag}><li>${this.escapeHtml(block.props.text.toString())}</li></${tag}>\n`;
          }
          break;
        case 'affine:code':
          if (block.props?.text) {
            const lang = block.props?.language || '';
            html += `<pre><code class="language-${lang}">${this.escapeHtml(block.props.text.toString())}</code></pre>\n`;
          }
          break;
      }
      
      if (block.children) {
        block.children.forEach(processBlock);
      }
    };

    if (snapshot.blocks?.children) {
      snapshot.blocks.children.forEach(processBlock);
    }

    html += '</body></html>';
    return html;
  }

  /**
   * Create ZIP package with assets
   */
  private async createZipPackage(snapshot: any, title: string): Promise<Blob> {
    // For now, just return the JSON as a "zip-like" structure
    // In a real implementation, you'd use a ZIP library
    const packageData = {
      document: snapshot,
      metadata: {
        title,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      }
    };
    
    return new Blob([JSON.stringify(packageData, null, 2)], { type: 'application/json' });
  }

  /**
   * Download file to user's computer
   */
  private downloadFile(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Sanitize filename for cross-platform compatibility
   */
  private sanitizeFileName(name: string): string {
    return name
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 50);
  }

  /**
   * Escape HTML characters
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

/**
 * Backend API storage service
 */
export class APIStorageService {
  constructor(private apiEndpoint: string) {}

  /**
   * Save to backend API
   */
  async saveToAPI(docId: string, title: string, snapshot: any, format: 'json' | 'markdown' | 'html' | 'zip' = 'json'): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiEndpoint}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: docId,
          title,
          content: snapshot,
          format,
          timestamp: Date.now()
        })
      });

      if (response.ok) {
        console.log(`✅ Saved to API: ${title}`);
        return true;
      } else {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      console.error('API save failed:', error);
      return false;
    }
  }

  /**
   * Load from backend API
   */
  async loadFromAPI(docId: string): Promise<any> {
    try {
      const response = await fetch(`${this.apiEndpoint}/documents/${docId}`);
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      console.error('API load failed:', error);
      return null;
    }
  }
}

/**
 * Unified storage manager - NO localStorage
 */
export class UnifiedBlockSuiteStorage {
  private fileService: FileStorageService;
  private apiService?: APIStorageService;

  constructor(options: ExternalStorageOptions = {}) {
    this.fileService = new FileStorageService(options);
    
    if (options.storageBackend === 'backend-api' && options.apiEndpoint) {
      this.apiService = new APIStorageService(options.apiEndpoint);
    }
  }

  /**
   * Save document (NO localStorage)
   */
  async saveDocument(docId: string, title: string, snapshot: any, options?: {
    format?: 'json' | 'markdown' | 'html' | 'zip';
    storage?: 'file' | 'api';
  }): Promise<boolean> {
    const format = options?.format || 'json';
    const storage = options?.storage || 'file';

    try {
      if (storage === 'api' && this.apiService) {
        return await this.apiService.saveToAPI(docId, title, snapshot, format);
      } else {
        return await this.fileService.saveToFile(docId, title, snapshot, format);
      }
    } catch (error) {
      console.error('Save failed:', error);
      return false;
    }
  }

  /**
   * Enable auto-save to file (downloads files automatically)
   */
  enableAutoSave(docId: string, title: string, getSnapshot: () => any, intervalMs: number = 60000): void {
    const saveLoop = () => {
      const snapshot = getSnapshot();
      this.fileService.scheduleAutoSave(docId, title, snapshot);
    };

    // Save immediately
    saveLoop();
    
    // Then save periodically
    setInterval(saveLoop, intervalMs);
    
    console.log(`📁 Auto-file-save enabled for "${title}" (every ${intervalMs / 1000}s)`);
  }

  /**
   * Quick save functions for console
   */
  quickSaveAsJSON = async (): Promise<boolean> => {
    const page = (window as any).__blocksuitePage;
    if (!page) {
      console.error("No BlockSuite page found");
      return false;
    }
    
    const transformer = page.getTransformer();
    const snapshot = transformer.docToSnapshot(page);
    return await this.saveDocument(page.id, snapshot.meta?.title || 'document', snapshot, 'json');
  };

  quickSaveAsMarkdown = async (): Promise<boolean> => {
    const page = (window as any).__blocksuitePage;
    if (!page) {
      console.error("No BlockSuite page found");
      return false;
    }
    
    const transformer = page.getTransformer();
    const snapshot = transformer.docToSnapshot(page);
    return await this.saveDocument(page.id, snapshot.meta?.title || 'document', snapshot, 'markdown');
  };

  quickSaveAsHTML = async (): Promise<boolean> => {
    const page = (window as any).__blocksuitePage;
    if (!page) {
      console.error("No BlockSuite page found");
      return false;
    }
    
    const transformer = page.getTransformer();
    const snapshot = transformer.docToSnapshot(page);
    return await this.saveDocument(page.id, snapshot.meta?.title || 'document', snapshot, 'html');
  };
}

// Create global instance (NO localStorage)
export const unifiedStorage = new UnifiedStorageManager();

// Quick save functions (NO localStorage)
export const quickSaveJSONNoLocal = () => unifiedStorage.quickSaveAsJSON();
export const quickSaveMarkdownNoLocal = () => unifiedStorage.quickSaveAsMarkdown();
export const quickSaveHTMLNoLocal = () => unifiedStorage.quickSaveAsHTML();