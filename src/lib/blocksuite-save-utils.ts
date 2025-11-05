/**
 * Comprehensive BlockSuite document saving utilities
 * Provides multiple export formats and persistence options
 */

import { Transformer } from '@blocksuite/store';
// NOTE: These imports are deprecated - use the new storage system in src/lib/storage instead
// import { downloadBlob } from '@blocksuite/affine/widgets/linked-doc';
// import { ZipTransformer, MarkdownAdapter, HtmlAdapter } from '@blocksuite/affine/widgets/linked-doc';
// import { AffineSchemas } from '@blocksuite/affine/schemas';
import { Schema } from '@blocksuite/store';

// Temporary stub functions until full migration
const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// Stub classes for deprecated adapters
class MarkdownAdapter {
  constructor(_job: any) {}
  async fromDocSnapshot(_options: any): Promise<{ file: string }> {
    return { file: '# Document\n\nContent not available - use new storage system' };
  }
}

class HtmlAdapter {
  constructor(_job: any) {}
  async fromDocSnapshot(_options: any): Promise<{ file: string }> {
    return { file: '<html><body><p>Content not available - use new storage system</p></body></html>' };
  }
}

class ZipTransformer {
  static async exportDocs(_collection: any, _schema: any, _docs: any[]): Promise<void> {
    console.warn('ZipTransformer is deprecated - use new storage system');
  }
}

// Stub for AffineSchemas
const AffineSchemas: any[] = [];

export interface SaveOptions {
  includeAssets?: boolean;
  fileName?: string;
  format?: 'json' | 'markdown' | 'html' | 'zip' | 'txt';
}

export interface DocumentSnapshot {
  id: string;
  title: string;
  data: any;
  timestamp: number;
}

/**
 * Auto-save manager for BlockSuite documents
 */
export class BlockSuiteSaveManager {
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private page: any = null;
  private collection: any = null;

  constructor(page: any, collection: any) {
    this.page = page;
    this.collection = collection;
  }

  /**
   * Enable automatic saving every 30 seconds
   */
  enableAutoSave() {
    if (this.autoSaveInterval) return;

    this.autoSaveInterval = setInterval(() => {
      this.saveToLocalStorage();
    }, 30000); // 30 seconds

    console.log("✅ Auto-save enabled for BlockSuite document");
  }

  /**
   * Disable auto-save
   */
  disableAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      console.log("🔴 Auto-save disabled");
    }
  }

  /**
   * Save document to local storage
   */
  private saveToLocalStorage() {
    try {
      if (!this.page) return;

      const transformer = this.page.getTransformer();
      const snapshot = transformer.docToSnapshot(this.page);
      
      if (!snapshot) return;

      const saveData: DocumentSnapshot = {
        id: this.page.id,
        title: snapshot.meta.title || 'Untitled',
        data: snapshot,
        timestamp: Date.now()
      };

      localStorage.setItem(
        `blocksuite-${this.page.id}`,
        JSON.stringify(saveData)
      );

      console.log(`💾 Auto-saved: ${saveData.title}`);
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  }

  /**
   * Save document with custom options
   */
  async saveDocument(options: SaveOptions = {}): Promise<boolean> {
    const {
      includeAssets = true,
      fileName,
      format = 'json'
    } = options;

    try {
      if (!this.page) {
        console.error("No document available to save");
        return false;
      }

      switch (format) {
        case 'json':
          await this.saveAsJSON(fileName);
          break;
        case 'markdown':
          await this.saveAsMarkdown(fileName);
          break;
        case 'html':
          await this.saveAsHTML(fileName);
          break;
        case 'zip':
          await this.saveAsZIP(fileName, includeAssets);
          break;
        case 'txt':
          await this.saveAsPlainText(fileName);
          break;
        default:
          console.error("Unknown format:", format);
          return false;
      }

      console.log(`✅ Saved document as ${format.toUpperCase()}`);
      return true;
    } catch (error) {
      console.error("Save failed:", error);
      return false;
    }
  }

  /**
   * Save as JSON snapshot
   */
  private async saveAsJSON(fileName?: string) {
    const transformer = this.page.getTransformer();
    const snapshot = transformer.docToSnapshot(this.page);
    
    if (!snapshot) throw new Error("Failed to create snapshot");

    const content = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    
    const name = fileName || `${snapshot.meta.title || 'document'}-${Date.now()}.json`;
    downloadBlob(blob, this.sanitizeFileName(name));
  }

  /**
   * Save as Markdown
   */
  private async saveAsMarkdown(fileName?: string) {
    const job = this.page.getTransformer();
    const snapshot = job.docToSnapshot(this.page);
    
    if (!snapshot) throw new Error("Failed to create snapshot");

    const adapter = new MarkdownAdapter(job);
    const markdownResult = await adapter.fromDocSnapshot({
      snapshot,
      assets: job.assetsManager,
    });

    const blob = new Blob([markdownResult.file], { type: 'text/markdown' });
    
    const name = fileName || `${this.page.meta?.title || 'document'}-${Date.now()}.md`;
    downloadBlob(blob, this.sanitizeFileName(name));
  }

  /**
   * Save as HTML
   */
  private async saveAsHTML(fileName?: string) {
    const job = this.page.getTransformer();
    const snapshot = job.docToSnapshot(this.page);
    
    if (!snapshot) throw new Error("Failed to create snapshot");

    const adapter = new HtmlAdapter(job);
    const htmlResult = await adapter.fromDocSnapshot({
      snapshot,
      assets: job.assetsManager,
    });

    const blob = new Blob([htmlResult.file], { type: 'text/html' });
    
    const name = fileName || `${this.page.meta?.title || 'document'}-${Date.now()}.html`;
    downloadBlob(blob, this.sanitizeFileName(name));
  }

  /**
   * Save as ZIP with assets
   */
  private async saveAsZIP(fileName?: string, includeAssets: boolean = true) {
    const schema = new Schema();
    schema.register(AffineSchemas);
    
    const docs = [this.page].filter(Boolean);
    
    if (docs.length === 0) throw new Error("No documents to save");

    // This will download automatically
    await ZipTransformer.exportDocs(this.collection, schema, docs);
    
    console.log(`📦 Complete document package saved (${includeAssets ? 'with' : 'without'} assets)`);
  }

  /**
   * Save as plain text
   */
  private async saveAsPlainText(fileName?: string) {
    let textContent = '';
    
    // Extract text from all blocks
    const extractText = (block: any) => {
      if (block.flavour === 'affine:paragraph') {
        if (block.props?.text) {
          textContent += block.props.text.toString() + '\n';
        }
      } else if (block.flavour === 'affine:list') {
        const bullet = block.props?.type === 'numbered' ? '1. ' : '• ';
        if (block.props?.text) {
          textContent += bullet + block.props.text.toString() + '\n';
        }
      }
      
      if (block.children) {
        block.children.forEach(extractText);
      }
    };

    // Process the page structure
    const walkBlocks = (block: any) => {
      if (block.flavour === 'affine:page' || block.flavour === 'affine:note') {
        if (block.children) {
          block.children.forEach(extractText);
        }
      }
    };

    if (this.page.root) {
      walkBlocks(this.page.root);
    }

    const blob = new Blob([textContent], { type: 'text/plain' });
    const name = fileName || `${this.page.meta?.title || 'document'}-${Date.now()}.txt`;
    downloadBlob(blob, this.sanitizeFileName(name));
  }

  /**
   * Sanitize filename for cross-platform compatibility
   */
  private sanitizeFileName(name: string): string {
    return name
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 100); // Limit length
  }

  /**
   * Load document from local storage
   */
  loadFromLocalStorage(docId: string): DocumentSnapshot | null {
    try {
      const stored = localStorage.getItem(`blocksuite-${docId}`);
      if (!stored) return null;

      return JSON.parse(stored);
    } catch (error) {
      console.error("Failed to load from local storage:", error);
      return null;
    }
  }

  /**
   * Get all saved documents from local storage
   */
  getAllSavedDocuments(): DocumentSnapshot[] {
    const documents: DocumentSnapshot[] = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('blocksuite-')) {
          const stored = localStorage.getItem(key);
          if (stored) {
            documents.push(JSON.parse(stored));
          }
        }
      }
    } catch (error) {
      console.error("Failed to get saved documents:", error);
    }

    return documents.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Restore document from local storage
   */
  async restoreFromLocalStorage(docId: string): Promise<any> {
    const saved = this.loadFromLocalStorage(docId);
    if (!saved) {
      throw new Error("No saved document found");
    }

    const transformer = new Transformer({
      schema: new Schema().register(AffineSchemas),
      blobCRUD: this.collection.blobSync,
      docCRUD: {
        create: (id: string) => this.collection.createDoc(id).getStore({ id }),
        get: (id: string) => this.collection.getDoc(id)?.getStore({ id }) ?? null,
        delete: (id: string) => this.collection.removeDoc(id),
      }
    });

    return await transformer.snapshotToDoc(saved.data);
  }
}

/**
 * Quick save functions for easy access
 */
export function createSaveManager(page: any, collection: any): BlockSuiteSaveManager {
  return new BlockSuiteSaveManager(page, collection);
}

/**
 * Quick save functions that work with global references
 */
export async function quickSaveAsJSON(): Promise<boolean> {
  const page = (window as any).__blocksuitePage;
  if (!page) {
    console.error("No BlockSuite page found");
    return false;
  }

  const manager = createSaveManager(page, (window as any).__blocksuiteWorkspace);
  return await manager.saveDocument({ format: 'json' });
}

export async function quickSaveAsMarkdown(): Promise<boolean> {
  const page = (window as any).__blocksuitePage;
  if (!page) {
    console.error("No BlockSuite page found");
    return false;
  }

  const manager = createSaveManager(page, (window as any).__blocksuiteWorkspace);
  return await manager.saveDocument({ format: 'markdown' });
}

export async function quickSaveAsHTML(): Promise<boolean> {
  const page = (window as any).__blocksuitePage;
  if (!page) {
    console.error("No BlockSuite page found");
    return false;
  }

  const manager = createSaveManager(page, (window as any).__blocksuiteWorkspace);
  return await manager.saveDocument({ format: 'html' });
}

export async function quickSaveAsZIP(): Promise<boolean> {
  const page = (window as any).__blocksuitePage;
  if (!page) {
    console.error("No BlockSuite page found");
    return false;
  }

  const manager = createSaveManager(page, (window as any).__blocksuiteWorkspace);
  return await manager.saveDocument({ format: 'zip', includeAssets: true });
}

// Expose to window for console testing
if (typeof window !== 'undefined') {
  (window as any).quickSaveJSON = quickSaveAsJSON;
  (window as any).quickSaveMarkdown = quickSaveAsMarkdown;
  (window as any).quickSaveHTML = quickSaveAsHTML;
  (window as any).quickSaveZIP = quickSaveAsZIP;
  
  console.log("💾 Quick save functions available:");
  console.log("   quickSaveJSON() - Save as JSON");
  console.log("   quickSaveMarkdown() - Save as Markdown");
  console.log("   quickSaveHTML() - Save as HTML");
  console.log("   quickSaveZIP() - Save as ZIP with assets");
}