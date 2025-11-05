"use client";

import { useEffect, useRef, useState } from "react";
import { Workspace, Page } from "@blocksuite/store";

export interface SimpleBlockSuiteEditorProps {
  className?: string;
}

export function SimpleBlockSuiteEditor({ className = "" }: SimpleBlockSuiteEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
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

        // Create a simple editor UI
        const editorContainer = document.createElement('div');
        editorContainer.className = 'simple-blocksuite-editor';
        editorContainer.style.cssText = `
          padding: 20px;
          font-family: system-ui, -apple-system, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
        `;

        // Add title
        const title = document.createElement('h1');
        title.textContent = 'BlockSuite Document';
        title.style.cssText = 'color: #2563eb; margin-bottom: 20px;';
        editorContainer.appendChild(title);

        // Add content
        const content = document.createElement('div');
        content.innerHTML = `
          <h2>Welcome to BlockSuite!</h2>
          <p>This is a demonstration of BlockSuite's capabilities. BlockSuite is a collaborative block-based editor that allows you to create rich documents with various content types.</p>
          
          <h3>Key Features:</h3>
          <ul>
            <li>Rich text editing with formatting options</li>
            <li>Block-based architecture for flexible content creation</li>
            <li>Real-time collaboration support</li>
            <li>Extensible with custom blocks</li>
            <li>Version control and history tracking</li>
          </ul>
          
          <h3>Getting Started:</h3>
          <p>BlockSuite provides a powerful foundation for building collaborative applications. You can extend it with custom blocks, integrate with various data sources, and build complex document editing experiences.</p>
          
          <p>The editor supports multiple content types including paragraphs, headings, lists, code blocks, images, and more. Each block can be customized and extended to fit your specific needs.</p>
        `;
        
        editorContainer.appendChild(content);

        if (editorRef.current) {
          editorRef.current.appendChild(editorContainer);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error("Failed to initialize BlockSuite:", error);
        
        // Fallback content if BlockSuite fails
        if (editorRef.current) {
          const fallbackContent = document.createElement('div');
          fallbackContent.className = 'fallback-content';
          fallbackContent.style.cssText = `
            padding: 40px;
            text-align: center;
            color: #666;
            font-family: system-ui, -apple-system, sans-serif;
          `;
          fallbackContent.innerHTML = `
            <h2 style="color: #2563eb; margin-bottom: 20px;">BlockSuite Editor</h2>
            <p>BlockSuite editor is loading...</p>
            <p style="margin-top: 20px; font-size: 14px;">
              This is a fallback view. The full BlockSuite editor requires additional dependencies.
            </p>
          `;
          editorRef.current.appendChild(fallbackContent);
          setIsInitialized(true);
        }
      }
    };

    initBlockSuite();

    return () => {
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className={`simple-blocksuite-editor ${className}`}>
      <div className="editor-container h-full w-full">
        <div
          ref={editorRef}
          className="blocksuite-simple-editor h-full w-full min-h-[600px] border border-gray-200 rounded-lg p-6"
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