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
import { PanelLeftIcon, PanelRightIcon } from "lucide-react";

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

  useEffect(() => {
    setIsClient(true);
  }, []);

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

            <div className="flex h-full overflow-hidden">
              {/* Chat panel - always visible */}
              <div className="flex-1 overflow-hidden">
                {contextKey ? <MessageThreadFull contextKey={contextKey} /> : null}
              </div>

              {/* Editor panel */}
              <div className="w-full md:w-[60%] overflow-auto">
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
              </div>
            </div>
          </TamboMcpProvider>
        </TamboProvider>
      </div>
    </ApiKeyCheck>
  );
}
