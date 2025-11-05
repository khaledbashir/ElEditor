/**
 * @file blocksuite-control.ts
 * @description Real BlockSuite editor control methods using the proper BlockSuite API
 *
 * This module provides methods to control the BlockSuite editor by directly
 * manipulating the document model using BlockSuite's official APIs.
 */

import { getBlockSuiteDoc } from "@/components/ui/blocksuite-editor-enhanced";
import { Text } from "@blocksuite/store";

export interface BlockSuiteEditorAPI {
  addTextBlock: (content: string, type?: string) => Promise<boolean>;
  addListBlock: (items: string[], ordered?: boolean) => Promise<boolean>;
  addCodeBlock: (code: string, language?: string) => Promise<boolean>;
  addTableBlock: (rows: number, columns: number) => Promise<boolean>;
  addKanbanBoard: (title?: string) => Promise<boolean>;
  addHeading: (text: string, level: number) => Promise<boolean>;
  clearEditor: () => Promise<boolean>;
  getEditorContent: () => string;
  switchToViewMode: () => void;
  switchToEdgelessMode: () => void;
}

export class BlockSuiteController {
  private editor: any = null;
  private page: any = null;

  constructor() {
    this.initializeEditor();
  }

  private initializeEditor() {
    // Only initialize in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    // Wait for BlockSuite editor to be available
    const initializeWhenReady = () => {
      try {
        // Look for the BlockSuite editor element
        const editorElement = document.querySelector("simple-affine-editor") as any;

        if (editorElement && editorElement.workspace && editorElement.page) {
          this.editor = editorElement;
          this.page = editorElement.page;
          console.log("✅ BlockSuite controller initialized with page:", this.page.id);
        } else {
          // Try again in 500ms
          setTimeout(initializeWhenReady, 500);
        }
      } catch (error) {
        console.error("Failed to initialize BlockSuite controller:", error);
        setTimeout(initializeWhenReady, 1000);
      }
    };

    initializeWhenReady();
  }

  /**
   * Get the current page (document) instance
   */
  private getPage(): any | null {
    if (this.page) return this.page;

    // Try to get from global references
    const doc = getBlockSuiteDoc();
    if (doc) {
      this.page = doc;
      return doc;
    }

    // Try to get from editor element
    const editorElement = document.querySelector("simple-affine-editor") as any;
    if (editorElement?.page) {
      this.page = editorElement.page;
      return editorElement.page;
    }

    return null;
  }

  /**
   * Find the note block (container for content blocks)
   */
  private async findNoteBlock(): Promise<string | null> {
    const page = this.getPage();
    if (!page || !page.root) {
      console.error("Page or root not found");
      return null;
    }

    // The root is the page block
    const pageBlock = page.root;

    // Look for existing note block
    if (pageBlock.children) {
      for (const child of pageBlock.children) {
        if (child.flavour === "affine:note") {
          return child.id;
        }
      }
    }

    // If no note block exists, create one
    try {
      const noteBlockId = page.addBlock("affine:note", {}, pageBlock.id);
      console.log("Created new note block:", noteBlockId);
      return noteBlockId;
    } catch (error) {
      console.error("Failed to create note block:", error);
      return null;
    }
  }

  /**
   * Add a text block (paragraph) to the editor
   */
  async addTextBlock(content: string, type: string = "paragraph"): Promise<boolean> {
    try {
      const page = this.getPage();
      if (!page) {
        console.error("Page not available");
        return false;
      }

      // Find the note block to add content to
      const noteBlockId = await this.findNoteBlock();
      if (!noteBlockId) {
        console.error("Could not find or create note block");
        return false;
      }

      // Add the paragraph block
      const blockId = page.addBlock(
        "affine:paragraph",
        {
          text: new Text(content),
          type: type === "paragraph" ? "text" : type
        },
        noteBlockId
      );

      console.log(`✅ Added paragraph block: "${content}" (ID: ${blockId})`);
      return true;
    } catch (error) {
      console.error("Failed to add text block:", error);
      return false;
    }
  }

  /**
   * Add a list block to the editor
   */
  async addListBlock(items: string[], ordered: boolean = false): Promise<boolean> {
    try {
      const page = this.getPage();
      if (!page) {
        console.error("Page not available");
        return false;
      }

      // Find the note block to add content to
      const noteBlockId = await this.findNoteBlock();
      if (!noteBlockId) {
        console.error("Could not find or create note block");
        return false;
      }

      // Add each list item as a separate list block
      for (const item of items) {
        page.addBlock(
          "affine:list",
          {
            text: new Text(item),
            type: ordered ? "numbered" : "bulleted"
          },
          noteBlockId
        );
      }

      console.log(`✅ Added ${ordered ? "ordered" : "unordered"} list with ${items.length} items`);
      return true;
    } catch (error) {
      console.error("Failed to add list block:", error);
      return false;
    }
  }

  /**
   * Add a code block to the editor
   */
  async addCodeBlock(code: string, language: string = "typescript"): Promise<boolean> {
    try {
      const page = this.getPage();
      if (!page) {
        console.error("Page not available");
        return false;
      }

      // Find the note block to add content to
      const noteBlockId = await this.findNoteBlock();
      if (!noteBlockId) {
        console.error("Could not find or create note block");
        return false;
      }

      // Add the code block
      const blockId = page.addBlock(
        "affine:code",
        {
          text: new Text(code),
          language: language
        },
        noteBlockId
      );

      console.log(`✅ Added code block with language: ${language} (ID: ${blockId})`);
      return true;
    } catch (error) {
      console.error("Failed to add code block:", error);
      return false;
    }
  }

  /**
   * Add a table block to the editor
   * Note: Table blocks may not be supported in all BlockSuite versions
   */
  async addTableBlock(rows: number, columns: number): Promise<boolean> {
    try {
      const page = this.getPage();
      if (!page) {
        console.error("Page not available");
        return false;
      }

      // Find the note block to add content to
      const noteBlockId = await this.findNoteBlock();
      if (!noteBlockId) {
        console.error("Could not find or create note block");
        return false;
      }

      // Try to add a database block (which can function as a table)
      try {
        const blockId = page.addBlock(
          "affine:database",
          {
            columns: columns,
            rows: rows
          },
          noteBlockId
        );
        console.log(`✅ Added table block: ${rows}x${columns} (ID: ${blockId})`);
        return true;
      } catch (error) {
        console.warn("Database block not supported, falling back to paragraph");
        // Fallback: add a paragraph explaining tables aren't supported
        page.addBlock(
          "affine:paragraph",
          {
            text: new Text(`[Table: ${rows}x${columns} - not supported in this BlockSuite version]`)
          },
          noteBlockId
        );
        return false;
      }
    } catch (error) {
      console.error("Failed to add table block:", error);
      return false;
    }
  }

  /**
   * Add a Kanban board to the editor
   */
  async addKanbanBoard(title: string = "Kanban Board"): Promise<boolean> {
    try {
      const page = this.getPage();
      if (!page) {
        console.error("Page not available");
        return false;
      }

      // Find the note block to add content to
      const noteBlockId = await this.findNoteBlock();
      if (!noteBlockId) {
        console.error("Could not find or create note block");
        return false;
      }

      // Add a database block with kanban view
      try {
        const blockId = page.addBlock(
          "affine:database",
          {
            title: new Text(title),
            views: [{
              id: `view_${Date.now()}`,
              name: "Kanban View",
              mode: "kanban"
            }],
            columns: [],
            cells: {}
          },
          noteBlockId
        );
        console.log(`✅ Added Kanban board: "${title}" (ID: ${blockId})`);
        return true;
      } catch (error) {
        console.warn("Kanban board not supported, falling back to heading", error);
        // Fallback: add a heading explaining Kanban isn't supported
        page.addBlock(
          "affine:paragraph",
          {
            type: "h2",
            text: new Text(`${title} (Kanban not supported in this BlockSuite version)`)
          },
          noteBlockId
        );
        return false;
      }
    } catch (error) {
      console.error("Failed to add Kanban board:", error);
      return false;
    }
  }

  /**
   * Add a heading to the editor
   */
  async addHeading(text: string, level: number = 1): Promise<boolean> {
    try {
      const page = this.getPage();
      if (!page) {
        console.error("Page not available");
        return false;
      }

      // Find the note block to add content to
      const noteBlockId = await this.findNoteBlock();
      if (!noteBlockId) {
        console.error("Could not find or create note block");
        return false;
      }

      // Map level to heading type
      const headingType = level === 1 ? "h1" : level === 2 ? "h2" : level === 3 ? "h3" : "h4";

      // Add the heading as a paragraph with heading type
      const blockId = page.addBlock(
        "affine:paragraph",
        {
          text: new Text(text),
          type: headingType
        },
        noteBlockId
      );

      console.log(`✅ Added heading level ${level}: "${text}" (ID: ${blockId})`);
      return true;
    } catch (error) {
      console.error("Failed to add heading:", error);
      return false;
    }
  }

  /**
   * Clear the editor content
   */
  async clearEditor(): Promise<boolean> {
    try {
      const page = this.getPage();
      if (!page || !page.root) {
        console.error("Page or root not available");
        return false;
      }

      // Get all children of the root page block
      const pageBlock = page.root;
      if (!pageBlock.children) {
        return true; // Already empty
      }

      // Remove all blocks except the page block itself
      for (const child of [...pageBlock.children]) {
        if (child.flavour !== "affine:surface") {
          // Keep surface block, remove others
          page.deleteBlock(child);
        }
      }

      console.log("✅ Cleared editor content");
      return true;
    } catch (error) {
      console.error("Failed to clear editor:", error);
      return false;
    }
  }

  /**
   * Get current editor content
   */
  getEditorContent(): string {
    try {
      if (!this.editor) {
        return "";
      }
      
      // This would get the actual BlockSuite content
      // For now, return empty string as placeholder
      return "";
      
    } catch (error) {
      console.error("Failed to get editor content:", error);
      return "";
    }
  }

  /**
   * Switch to view mode
   */
  switchToViewMode(): void {
    try {
      if (!this.editor) return;
      
      // This would switch BlockSuite to view mode
      console.log("Switching to view mode");
      
    } catch (error) {
      console.error("Failed to switch to view mode:", error);
    }
  }

  /**
   * Switch to edgeless mode
   */
  switchToEdgelessMode(): void {
    try {
      if (!this.editor) return;
      
      // This would switch BlockSuite to edgeless mode
      console.log("Switching to edgeless mode");
      
    } catch (error) {
      console.error("Failed to switch to edgeless mode:", error);
    }
  }

  /**
   * Save document to local storage (auto-save)
   */
  saveToLocalStorage(): boolean {
    try {
      if (!this.page) {
        console.error("No page available for saving");
        return false;
      }

      // Use the new save utilities
      const { BlockSuiteSaveManager } = require("./blocksuite-save-utils");
      const manager = new BlockSuiteSaveManager(this.page, this.getPage()?.workspace);
      manager.saveToLocalStorage();
      
      console.log("✅ Document saved to local storage");
      return true;
    } catch (error) {
      console.error("Failed to save to local storage:", error);
      return false;
    }
  }

  /**
   * Save document with multiple format options
   */
  async saveDocument(format: 'json' | 'markdown' | 'html' | 'zip' | 'txt' = 'json'): Promise<boolean> {
    try {
      if (!this.page) {
        console.error("No page available for saving");
        return false;
      }

      // Use the new save utilities
      const { BlockSuiteSaveManager } = require("./blocksuite-save-utils");
      const manager = new BlockSuiteSaveManager(this.page, this.getPage()?.workspace);
      return await manager.saveDocument({ format });
    } catch (error) {
      console.error("Failed to save document:", error);
      return false;
    }
  }

  /**
   * Get all saved documents from local storage
   */
  getAllSavedDocuments(): any[] {
    try {
      const { BlockSuiteSaveManager } = require("./blocksuite-save-utils");
      const manager = new BlockSuiteSaveManager(this.page, this.getPage()?.workspace);
      return manager.getAllSavedDocuments();
    } catch (error) {
      console.error("Failed to get saved documents:", error);
      return [];
    }
  }

  /**
   * Enable auto-save functionality
   */
  enableAutoSave(intervalMs: number = 30000): void {
    try {
      if (!this.page) {
        console.error("No page available for auto-save");
        return;
      }

      const { BlockSuiteSaveManager } = require("./blocksuite-save-utils");
      const manager = new BlockSuiteSaveManager(this.page, this.getPage()?.workspace);
      manager.enableAutoSave();
      
      console.log(`✅ Auto-save enabled (every ${intervalMs / 1000}s)`);
    } catch (error) {
      console.error("Failed to enable auto-save:", error);
    }
  }

  /**
   * Disable auto-save functionality
   */
  disableAutoSave(): void {
    try {
      const { BlockSuiteSaveManager } = require("./blocksuite-save-utils");
      const manager = new BlockSuiteSaveManager(this.page, this.getPage()?.workspace);
      manager.disableAutoSave();
    } catch (error) {
      console.error("Failed to disable auto-save:", error);
    }
  }

}

// Global instance for use across the application (lazy initialization)
let _blocksuiteController: BlockSuiteController | null = null;

export function getBlockSuiteController(): BlockSuiteController {
  if (!_blocksuiteController) {
    _blocksuiteController = new BlockSuiteController();
  }
  return _blocksuiteController;
}
