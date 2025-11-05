"use client";
import dynamic from "next/dynamic";
import { useMcpServers } from "@/components/tambo/mcp-config-modal";
import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import SpreadsheetTabs from "@/components/ui/spreadsheet-tabs";
import { InteractableTabs } from "@/components/ui/interactable-tabs";
import { components, tools } from "@/lib/tambo";
import { spreadsheetContextHelper } from "@/lib/spreadsheet-context-helper";
import { spreadsheetSelectionContextHelper } from "@/lib/spreadsheet-selection-context";
import { usePersistentContextKey } from "@/hooks/usePersistentContextKey";
import { useThreadDocument } from "@/hooks/useThreadDocument";
import { TamboProvider } from "@tambo-ai/react";
import { TamboMcpProvider } from "@tambo-ai/react/mcp";
import { useEffect, useState, Suspense } from "react";
import { PanelLeftIcon, PanelRightIcon, SaveIcon, AlertCircleIcon, CheckCircleIcon } from "lucide-react";
import { getStorageSystem } from "@/lib/storage-system-singleton";
import { migrateFromLocalStorage, needsMigration } from "@/lib/storage/migration";

// Dynamic import to avoid SSR issues with BlockSuite
const LazyBlockSuiteEditor = dynamic(() => import("@/components/ui/blocksuite-editor-enhanced").then(mod => ({ default: mod.BlockSuiteEditorEnhanced })), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center">Loading Enhanced BlockSuite Editor...</div>
});

export default function Home() {
  const mcpServers = useMcpServers();
  const [showSpreadsheet, setShowSpreadsheet] = useState(true);
  const [editorMode, setEditorMode] = useState<'spreadsheet' | 'blocksuite'>('spreadsheet');
  const contextKey = usePersistentContextKey();
  const [migrationStatus, setMigrationStatus] = useState<'pending' | 'migrating' | 'complete' | 'error'>('pending');
  const [storageInitialized, setStorageInitialized] = useState(false);

  // Initialize storage system and handle migration
  useEffect(() => {
    const initStorage = async () => {
      try {
        // Initialize storage system
        await getStorageSystem({
          primaryBackend: 'indexeddb',
          autoSave: true,
          autoSaveInterval: 30000,
          enableLogging: true,
        });

        setStorageInitialized(true);

        // Check if migration is needed
        if (needsMigration()) {
          setMigrationStatus('migrating');

          const { storageManager } = await getStorageSystem();
          const result = await migrateFromLocalStorage(storageManager, {
            deleteAfterMigration: true,
          });

          if (result.success) {
            setMigrationStatus('complete');
            console.log(`✅ Migrated ${result.migratedCount} documents from localStorage`);
          } else {
            setMigrationStatus('error');
            console.error('Migration failed:', result.errors);
          }
        } else {
          setMigrationStatus('complete');
        }
      } catch (error) {
        console.error('Failed to initialize storage:', error);
        setMigrationStatus('error');
      }
    };

    initStorage();
  }, []);

  // Thread-document integration
  const threadDocument = useThreadDocument({
    threadId: contextKey,
    documentType: editorMode === 'spreadsheet' ? 'spreadsheet' : 'blocksuite',
    autoSave: true,
    autoSaveDelay: 2000,
    onDocumentLoaded: (doc) => {
      console.log('Document loaded for thread:', doc.metadata.id);
    },
    onDocumentSaved: (doc) => {
      console.log('Document saved:', doc.metadata.id);
    },
    onError: (error) => {
      console.error('Document error:', error);
    },
  });

  // Listen for programmatic editor mode switches (from tools)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { mode?: 'spreadsheet' | 'blocksuite' };
      if (detail?.mode) setEditorMode(detail.mode);
    };
    window.addEventListener('set-editor-mode', handler as EventListener);
    return () => window.removeEventListener('set-editor-mode', handler as EventListener);
  }, []);

  return (
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
            onClick={() => setShowSpreadsheet(!showSpreadsheet)}
            className="md:hidden fixed top-4 right-4 z-50 p-2 rounded-lg bg-accent hover:bg-accent/80 shadow-lg border border-border"
            aria-label={showSpreadsheet ? "Show chat" : "Show spreadsheet"}
          >
            {showSpreadsheet ? <PanelLeftIcon className="h-5 w-5" /> : <PanelRightIcon className="h-5 w-5" />}
          </button>

          <div className="flex h-full overflow-hidden">
            {/* Chat panel - hidden on mobile when spreadsheet is shown */}
            <div className={`${showSpreadsheet ? 'hidden md:flex' : 'flex'} flex-1 overflow-hidden`}>
              {contextKey ? <MessageThreadFull contextKey={contextKey} /> : null}
            </div>

            {/* Editor panel - supports Spreadsheet and BlockSuite */}
            <div className={`${showSpreadsheet ? 'flex' : 'hidden md:flex'} w-full md:w-[60%] overflow-auto flex-col`}>
              {/* Editor mode switcher with status indicators */}
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">Editor</div>

                  {/* Storage status indicators */}
                  {migrationStatus === 'migrating' && (
                    <div className="flex items-center gap-1 text-xs text-yellow-600">
                      <SaveIcon className="h-3 w-3 animate-spin" />
                      <span>Migrating...</span>
                    </div>
                  )}

                  {threadDocument.isSaving && (
                    <div className="flex items-center gap-1 text-xs text-blue-600">
                      <SaveIcon className="h-3 w-3 animate-pulse" />
                      <span>Saving...</span>
                    </div>
                  )}

                  {threadDocument.hasUnsavedChanges && !threadDocument.isSaving && (
                    <div className="flex items-center gap-1 text-xs text-orange-600">
                      <AlertCircleIcon className="h-3 w-3" />
                      <span>Unsaved</span>
                    </div>
                  )}

                  {!threadDocument.hasUnsavedChanges && !threadDocument.isSaving && storageInitialized && (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircleIcon className="h-3 w-3" />
                      <span>Saved</span>
                    </div>
                  )}
                </div>

                <div className="inline-flex rounded-md overflow-hidden border border-border">
                  <button
                    onClick={() => setEditorMode('spreadsheet')}
                    className={`px-2 py-1 text-xs ${editorMode === 'spreadsheet' ? 'bg-accent text-foreground' : 'bg-background text-muted-foreground'}`}
                    aria-pressed={editorMode === 'spreadsheet'}
                    aria-label="Show Spreadsheet"
                  >
                    Spreadsheet
                  </button>
                  <button
                    onClick={() => setEditorMode('blocksuite')}
                    className={`px-2 py-1 text-xs border-l border-border ${editorMode === 'blocksuite' ? 'bg-accent text-foreground' : 'bg-background text-muted-foreground'}`}
                    aria-pressed={editorMode === 'blocksuite'}
                    aria-label="Show BlockSuite"
                  >
                    BlockSuite
                  </button>
                </div>
              </div>

              {editorMode === 'spreadsheet' ? (
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
  );
}
