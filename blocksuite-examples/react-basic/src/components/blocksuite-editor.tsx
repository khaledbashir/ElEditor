"use client";

import { useEffect, useRef, useState } from "react";
import { Workspace, Page } from "@blocksuite/store";
import { PageEditor } from "@blocksuite/presets";

export interface BlockSuiteEditorProps {
  className?: string;
}

export function BlockSuiteEditor({ className = "" }: BlockSuiteEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const pageEditorRef = useRef<PageEditor | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!editorRef.current) return;

    const initBlockSuite = async () => {
      try {
        // Create workspace
        const workspace = new Workspace({
          id: "quick-start",
        });

        // Create a page
        const page = workspace.createPage({
          title: "Getting Started",
        });

        // Set up the page with some initial content
        const pageBlock = page.addBlock("affine:page", {
          title: new window.Y.XmlText("Getting Started with BlockSuite"),
        });
        
        const frameBlock = page.addBlock("affine:frame", {}, pageBlock);
        
        // Add some initial blocks
        page.addBlock(
          "affine:paragraph",
          {
            text: new window.Y.XmlText("Welcome to BlockSuite! This is a collaborative block-based editor."),
          },
          frameBlock
        );

        page.addBlock(
          "affine:paragraph",
          {
            text: new window.Y.XmlText("You can create rich documents with text, headings, lists, and more."),
          },
          frameBlock
        );

        page.addBlock(
          "affine:heading",
          {
            text: new window.Y.XmlText("Features"),
          },
          frameBlock
        );

        page.addBlock(
          "affine:list",
          {
            text: new window.Y.XmlText("Rich text editing"),
            type: "bullet",
          },
          frameBlock
        );

        page.addBlock(
          "affine:list",
          {
            text: new window.Y.XmlText("Block-based architecture"),
            type: "bullet",
          },
          frameBlock
        );

        page.addBlock(
          "affine:list",
          {
            text: new window.Y.XmlText("Real-time collaboration"),
            type: "bullet",
          },
          frameBlock
        );

        // Create the PageEditor
        const pageEditor = new PageEditor();
        pageEditor.doc = workspace;
        pageEditor.page = page;

        if (editorRef.current) {
          editorRef.current.appendChild(pageEditor);
          pageEditorRef.current = pageEditor;
          setIsInitialized(true);
        }
      } catch (error) {
        console.error("Failed to initialize BlockSuite:", error);
      }
    };

    initBlockSuite();

    return () => {
      if (pageEditorRef.current && editorRef.current) {
        editorRef.current.removeChild(pageEditorRef.current);
        pageEditorRef.current = null;
      }
    };
  }, []);

  return (
    <div className={`blocksuite-editor ${className}`}>
      <div className="editor-container h-full w-full">
        <div
          ref={editorRef}
          className="blocksuite-page-editor h-full w-full min-h-[600px] border border-gray-200 rounded-lg"
          style={{ backgroundColor: "white" }}
        />
        {!isInitialized && (
          <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
            <div className="text-gray-500">Loading BlockSuite editor...</div>
          </div>
        )}
      </div>
    </div>
  );
}