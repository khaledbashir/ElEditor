/**
 * @file blocksuite-tools.ts
 * @description Tools for AI to manipulate BlockSuite editor content
 *
 * These tools allow the AI to add, modify, and control content in the BlockSuite editor.
 */

import { z } from "zod";
import { getBlockSuiteController } from "@/lib/blocksuite-control";

// ============================================
// Helper Functions
// ============================================

/**
 * Get the BlockSuite editor element
 */
function getBlockSuiteEditor(): HTMLElement | null {
  // Only run in browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  // Look for the simple-affine-editor element
  const editor = document.querySelector("simple-affine-editor") as HTMLElement;
  return editor || null;
}

/**
 * Wait for BlockSuite editor to be ready
 */
function waitForEditor(timeout: number = 5000): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    // Only run in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(null);
      return;
    }

    const editor = getBlockSuiteEditor();
    if (editor) {
      resolve(editor);
      return;
    }

    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      const editor = getBlockSuiteEditor();
      if (editor || Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        resolve(editor);
      }
    }, 100);
  });
}

// ============================================
// Tool Functions
// ============================================

const addTextBlock = async (content: string, type: "paragraph" | "heading1" | "heading2" | "heading3" = "paragraph") => {
  try {
    const editor = await waitForEditor();
    if (!editor) {
      return {
        success: false,
        error: "BlockSuite editor not found. Make sure the editor is in 'blocksuite' mode.",
      };
    }

    // Use real controller to perform the action
    const controller = getBlockSuiteController();
    if (type.startsWith("heading")) {
      const level = type === "heading1" ? 1 : type === "heading2" ? 2 : 3;
      const ok = await controller.addHeading(content, level);
      return ok
        ? { success: true, message: `Added ${type} block: "${content}" to BlockSuite editor` }
        : { success: false, error: "Failed to add heading via controller" };
    } else {
      const ok = await controller.addTextBlock(content, "paragraph");
      return ok
        ? { success: true, message: `Added paragraph: "${content}"` }
        : { success: false, error: "Failed to add paragraph via controller" };
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to add text block: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
};

const addListBlock = async (items: string[], ordered: boolean = false) => {
  try {
    const editor = await waitForEditor();
    if (!editor) {
      return {
        success: false,
        error: "BlockSuite editor not found. Make sure the editor is in 'blocksuite' mode.",
      };
    }

    const controller = getBlockSuiteController();
    const ok = await controller.addListBlock(items, ordered);
    return ok
      ? {
          success: true,
          message: `Added ${ordered ? "ordered" : "unordered"} list with ${items.length} items to BlockSuite editor`,
        }
      : { success: false, error: "Failed to add list via controller" };
  } catch (error) {
    return {
      success: false,
      error: `Failed to add list block: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
};

const addCodeBlock = async (code: string, language: string = "typescript") => {
  try {
    const editor = await waitForEditor();
    if (!editor) {
      return {
        success: false,
        error: "BlockSuite editor not found. Make sure the editor is in 'blocksuite' mode.",
      };
    }

    const controller = getBlockSuiteController();
    const ok = await controller.addCodeBlock(code, language);
    return ok
      ? { success: true, message: `Added ${language} code block to BlockSuite editor` }
      : { success: false, error: "Failed to add code block via controller" };
  } catch (error) {
    return {
      success: false,
      error: `Failed to add code block: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
};

const switchToBlocksuiteMode = async () => {
  try {
    // Fire a DOM event so pages can react and switch UI state
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('set-editor-mode', { detail: { mode: 'blocksuite' } }));
    }
    return {
      success: true,
      message: "Switched to BlockSuite mode via event dispatch",
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to switch mode: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

const addKanbanBoard = async (title: string = "Kanban Board") => {
  try {
    const editor = await waitForEditor();
    if (!editor) {
      return {
        success: false,
        error: "BlockSuite editor not found. Make sure the editor is in 'blocksuite' mode.",
      };
    }

    const controller = getBlockSuiteController();
    const ok = await controller.addKanbanBoard(title);
    return ok
      ? { success: true, message: `Added Kanban board: "${title}" to BlockSuite editor` }
      : { success: false, error: "Failed to add Kanban board via controller" };
  } catch (error) {
    return {
      success: false,
      error: `Failed to add Kanban board: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
};

const clearEditor = async () => {
  try {
    const editor = await waitForEditor();
    if (!editor) {
      return {
        success: false,
        error: "BlockSuite editor not found. Make sure the editor is in 'blocksuite' mode.",
      };
    }

    const controller = getBlockSuiteController();
    const ok = await controller.clearEditor();
    return ok
      ? { success: true, message: "BlockSuite editor content has been cleared" }
      : { success: false, error: "Failed to clear content via controller" };
  } catch (error) {
    return {
      success: false,
      error: `Failed to clear editor: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
};

// ============================================
// Tool Definitions
// ============================================

export const addTextBlockTool = {
  name: "addBlockSuiteTextBlock",
  description:
    "Add a text block to the BlockSuite editor. You can specify the content and type (paragraph, heading1, heading2, heading3). Make sure the editor is in BlockSuite mode first. This will append the block to the end of the document.",
  tool: addTextBlock,
  toolSchema: z
    .function()
    .args(
      z.string().describe("The text content to add"),
      z.enum(["paragraph", "heading1", "heading2", "heading3"]).optional().describe("Block type (default: 'paragraph')")
    )
    .returns(
      z.object({
        success: z.boolean(),
        message: z.string().optional(),
        error: z.string().optional(),
      }),
    ),
};

export const addListBlockTool = {
  name: "addBlockSuiteListBlock",
  description:
    "Add a list block to the BlockSuite editor. Provide an array of strings for the list items, and specify whether it should be ordered (numbered) or unordered (bulleted). Make sure the editor is in BlockSuite mode first.",
  tool: addListBlock,
  toolSchema: z
    .function()
    .args(
      z.array(z.string()).describe("Array of list item strings"),
      z.boolean().optional().describe("Whether the list should be ordered (numbered) or unordered (bulleted). Default: false (unordered)")
    )
    .returns(
      z.object({
        success: z.boolean(),
        message: z.string().optional(),
        error: z.string().optional(),
      }),
    ),
};

export const addCodeBlockTool = {
  name: "addBlockSuiteCodeBlock",
  description:
    "Add a code block to the BlockSuite editor. Provide the code content and optionally specify the programming language for syntax highlighting. Make sure the editor is in BlockSuite mode first.",
  tool: addCodeBlock,
  toolSchema: z
    .function()
    .args(
      z.string().describe("The code content to add"),
      z.string().optional().describe("Programming language for syntax highlighting (default: 'typescript')")
    )
    .returns(
      z.object({
        success: z.boolean(),
        message: z.string().optional(),
        error: z.string().optional(),
      }),
    ),
};

export const switchToBlocksuiteModeTool = {
  name: "switchToBlocksuiteMode",
  description:
    "Instructions for switching to BlockSuite mode. Since mode switching happens in the UI, this tool provides guidance on how to switch modes manually.",
  tool: switchToBlocksuiteMode,
  toolSchema: z
    .function()
    .args()
    .returns(
      z.object({
        success: z.boolean(),
        message: z.string().optional(),
        error: z.string().optional(),
      }),
    ),
};

export const addKanbanBoardTool = {
  name: "addBlockSuiteKanbanBoard",
  description:
    "Add a Kanban board to the BlockSuite editor. Provide a title for the Kanban board. The board will be created with a default kanban view. Make sure the editor is in BlockSuite mode first.",
  tool: addKanbanBoard,
  toolSchema: z
    .function()
    .args(
      z.string().optional().describe("Title for the Kanban board (default: 'Kanban Board')")
    )
    .returns(
      z.object({
        success: z.boolean(),
        message: z.string().optional(),
        error: z.string().optional(),
      }),
    ),
};

export const clearEditorTool = {
  name: "clearBlocksuiteEditor",
  description:
    "Clear all content from the BlockSuite editor. Make sure the editor is in BlockSuite mode first.",
  tool: clearEditor,
  toolSchema: z
    .function()
    .args()
    .returns(
      z.object({
        success: z.boolean(),
        message: z.string().optional(),
        error: z.string().optional(),
      }),
    ),
};

export const blocksuiteTools = [
  addTextBlockTool,
  addListBlockTool,
  addCodeBlockTool,
  addKanbanBoardTool,
  switchToBlocksuiteModeTool,
  clearEditorTool,
];