"use client";
import dynamic from "next/dynamic";
import { useMcpServers } from "@/components/tambo/mcp-config-modal";
import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import SpreadsheetTabs from "@/components/ui/spreadsheet-tabs";
import { InteractableTabs } from "@/components/ui/interactable-tabs";
import { ApiKeyCheck } from "@/components/ApiKeyCheck";
import { components, tools } from "@/lib/tambo";
import { spreadsheetContextHelper } from "@/lib/spreadsheet-context-helper";
import { spreadsheetSelectionContextHelper } from "@/lib/spreadsheet-selection-context";
import { usePersistentContextKey } from "@/hooks/usePersistentContextKey";
import { TamboProvider } from "@tambo-ai/react";
import { TamboMcpProvider } from "@tambo-ai/react/mcp";
import { useState, useEffect, Suspense } from "react";
import { PanelLeftIcon, PanelRightIcon, X } from "lucide-react";
import { ComponentStashPanel } from "@/components/ui/component-stash-panel";

// Dynamic import to avoid SSR issues with BlockSuite
const LazyBlockSuiteEditor = dynamic(() => import("@/components/ui/blocksuite-editor-enhanced").then(mod => ({ default: mod.BlockSuiteEditorEnhanced })), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center">Loading Enhanced BlockSuite Editor...</div>
});

export default function Home() {
  const mcpServers = useMcpServers();
  const [mode, setMode] = useState<'spreadsheet' | 'blocksuite'>('spreadsheet');
  const contextKey = usePersistentContextKey();
  const [isClient, setIsClient] = useState(false);
  const [showStashNotification, setShowStashNotification] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsClient(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Check if notification was dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('component-stash-notification-dismissed');
    if (dismissed === 'true') {
      setShowStashNotification(false);
    }
  }, []);

  const handleDismissNotification = () => {
    setShowStashNotification(false);
    localStorage.setItem('component-stash-notification-dismissed', 'true');
  };

  // Defer rendering chat until client to ensure TamboProvider context
  if (!isClient) {
    return (
      <ApiKeyCheck>
        <div className="h-screen flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading chat…</div>
        </div>
      </ApiKeyCheck>
    );
  }

  return (
    <ApiKeyCheck>
      <div className="h-screen flex flex-col overflow-hidden relative">
        <TamboProvider
          apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
          tamboUrl={process.env.NEXT_PUBLIC_TAMBO_URL!}
          components={components}
          tools={tools}
          contextHelpers={{
            spreadsheet: spreadsheetContextHelper,
            selection: spreadsheetSelectionContextHelper,
          }}
        >
          <TamboMcpProvider mcpServers={mcpServers}>
            {/* Mobile toggle button */}
            <button
              onClick={() => setMode(mode === 'spreadsheet' ? 'blocksuite' : 'spreadsheet')}
              className="md:hidden fixed top-4 right-4 z-50 p-2 rounded-lg bg-accent hover:bg-accent/80 shadow-lg border border-border"
              aria-label={mode === 'spreadsheet' ? "Switch to BlockSuite" : "Switch to Spreadsheet"}
            >
              {mode === 'spreadsheet' ? <PanelLeftIcon className="h-5 w-5" /> : <PanelRightIcon className="h-5 w-5" />}
            </button>

            {/* Mode selector for desktop */}
            <div className="hidden md:flex fixed top-4 right-4 z-50 gap-2">
              <button
                onClick={() => setMode('spreadsheet')}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  mode === 'spreadsheet'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-accent hover:bg-accent/80 text-accent-foreground'
                }`}
              >
                Spreadsheet
              </button>
              <button
                onClick={() => setMode('blocksuite')}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  mode === 'blocksuite'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-accent hover:bg-accent/80 text-accent-foreground'
                }`}
              >
                BlockSuite
              </button>
            </div>

            <div 
              className="flex h-full overflow-hidden"
              style={{
                '--panel-left-width': 'var(--panel-left-width, 500px)',
                '--panel-right-width': 'var(--panel-right-width, 500px)'
              } as React.CSSProperties}
            >
              {/* Left Panel - Chat (resizable) */}
              <div 
                className="h-full overflow-hidden border-r relative"
                style={{
                  width: 'var(--panel-left-width)',
                  minWidth: '300px',
                  maxWidth: 'calc(100vw - 300px)'
                }}
              >
                {contextKey ? <MessageThreadFull contextKey={contextKey} /> : null}
              </div>

              {/* Resizer Handle */}
              <div
                className="w-1 bg-border hover:bg-primary/50 cursor-col-resize relative group transition-colors"
                onMouseDown={(e) => {
                  e.preventDefault();
                  const startX = e.clientX;
                  const startLeftWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--panel-left-width')) || 500;

                  // Add visual feedback during drag
                  document.body.style.cursor = 'col-resize';
                  document.body.style.userSelect = 'none';

                  const handleMouseMove = (e: MouseEvent) => {
                    const deltaX = e.clientX - startX;
                    const newWidth = Math.max(300, Math.min(window.innerWidth - 300, startLeftWidth + deltaX));

                    document.documentElement.style.setProperty('--panel-left-width', `${newWidth}px`);
                  };

                  const handleMouseUp = () => {
                    // Remove visual feedback
                    document.body.style.cursor = '';
                    document.body.style.userSelect = '';

                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };

                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              >
                {/* Expanded hit area for easier grabbing */}
                <div className="absolute inset-y-0 -left-2 -right-2" />
                {/* Visual indicator on hover */}
                <div className="absolute inset-y-0 left-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Right Panel - Editor (resizable) */}
              <div 
                className="flex-1 overflow-auto relative"
                style={{
                  width: 'var(--panel-right-width)',
                  minWidth: '300px'
                }}
              >
                <div className="p-4">
                  {mode === 'spreadsheet' ? (
                    <>
                      {/* Tab metadata interactable for AI */}
                      <InteractableTabs interactableId="TabsState" />
                      {/* Visual spreadsheet tabs UI */}
                      <SpreadsheetTabs className="h-full" />
                    </>
                  ) : (
                    <Suspense fallback={<div className="h-full flex items-center justify-center">Loading BlockSuite Editor...</div>}>
                      <LazyBlockSuiteEditor />
                    </Suspense>
                  )}
                  
                  {/* Component Stash Notification */}
                  {showStashNotification && (
                    <div className="relative p-3 bg-blue-50 border border-blue-200 rounded-lg mt-4 text-sm">
                      <button
                        onClick={handleDismissNotification}
                        className="absolute top-2 right-2 p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                        aria-label="Dismiss notification"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="pr-8">
                        <h4 className="font-medium text-blue-900 mb-1">Component Stash Available</h4>
                        <p className="text-blue-700">Save and reuse AI-generated components for faster workflows.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TamboMcpProvider>
        </TamboProvider>
      </div>
    </ApiKeyCheck>
  );
}