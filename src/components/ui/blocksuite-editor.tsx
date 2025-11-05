"use client";

import { useEffect, useRef, useState } from "react";
// Ensure BlockSuite web components are registered
import "@blocksuite/editor";

export interface BlockSuiteEditorProps {
  className?: string;
}

export function BlockSuiteEditor({ className = "" }: BlockSuiteEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const editorElRef = useRef<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hostRef.current) return;

    // Create the out-of-the-box BlockSuite editor web component
    const editorEl = document.createElement("simple-affine-editor");
    editorElRef.current = editorEl;

    // Size the editor and mount
    editorEl.style.display = "block";
    editorEl.style.height = "100%";
    editorEl.style.width = "100%";

    hostRef.current.appendChild(editorEl);
    setReady(true);

    return () => {
      if (hostRef.current && editorElRef.current) {
        try {
          hostRef.current.removeChild(editorElRef.current);
        } catch {}
      }
      editorElRef.current = null;
    };
  }, []);

  return (
    <div className={`h-full w-full ${className}`}>
      <div
        ref={hostRef}
        className="h-full w-full overflow-auto min-h-[500px] bg-white border border-border rounded-md"
      />
      {!ready && (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          Loading BlockSuite editor…
        </div>
      )}
    </div>
  );
}