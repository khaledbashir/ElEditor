"use client";

import React, { useState } from 'react';
import { BlockSuiteEditorEnhanced } from '@/components/ui/blocksuite-editor-enhanced';
import { BlockSuiteSaveToolbar } from '@/components/ui/blocksuite-save-toolbar';
import { useBlockSuiteController } from '@/hooks/use-block-suite-controller';
import { Download, FileText, History, Zap } from 'lucide-react';

export function BlockSuiteSaveDemo() {
  const controller = useBlockSuiteController();
  const [activeTab, setActiveTab] = useState<'editor' | 'save'>('editor');
  const [savedDocs, setSavedDocs] = useState<any[]>([]);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(false);

  const refreshSavedDocs = () => {
    if (controller) {
      const docs = controller.getAllSavedDocuments();
      setSavedDocs(docs);
      console.log("📋 Found", docs.length, "saved documents");
    }
  };

  const toggleAutoSave = () => {
    if (!controller) return;

    if (isAutoSaveEnabled) {
      controller.disableAutoSave();
      setIsAutoSaveEnabled(false);
      console.log("🔴 Auto-save disabled");
    } else {
      controller.enableAutoSave();
      setIsAutoSaveEnabled(true);
      console.log("✅ Auto-save enabled");
    }
  };

  const testQuickSave = async () => {
    console.log("🧪 Testing quick save functions...");
    
    // Test all quick save functions
    const functions = [
      'quickSaveJSON',
      'quickSaveMarkdown', 
      'quickSaveHTML',
      'quickSaveZIP'
    ];

    for (const func of functions) {
      try {
        if (typeof (window as any)[func] === 'function') {
          console.log(`Testing ${func}...`);
          await (window as any)[func]();
          console.log(`✅ ${func} completed`);
        } else {
          console.log(`❌ ${func} not available`);
        }
      } catch (error) {
        console.error(`❌ ${func} failed:`, error);
      }
    }
  };

  return (
    <div className="h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">BlockSuite Save Demo</h1>
          
          <div className="flex items-center gap-4">
            <button
              onClick={refreshSavedDocs}
              className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <History className="h-4 w-4" />
              Refresh Saves
            </button>
            
            <button
              onClick={toggleAutoSave}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                isAutoSaveEnabled 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Zap className="h-4 w-4" />
              {isAutoSaveEnabled ? 'Auto-save ON' : 'Auto-save OFF'}
            </button>
            
            <button
              onClick={testQuickSave}
              className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              <Download className="h-4 w-4" />
              Test Quick Saves
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-6 py-3 border-b-2 font-medium ${
              activeTab === 'editor'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Editor
          </button>
          
          <button
            onClick={() => setActiveTab('save')}
            className={`px-6 py-3 border-b-2 font-medium ${
              activeTab === 'save'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Download className="h-4 w-4 inline mr-2" />
            Save Tools
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {activeTab === 'editor' ? (
          <div className="h-full">
            <BlockSuiteEditorEnhanced className="h-full" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Save Toolbar */}
            <BlockSuiteSaveToolbar />
            
            {/* Quick Test Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🧪 Quick Tests</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <button
                  onClick={() => {
                    console.log("🧪 Testing JSON save...");
                    if ((window as any).quickSaveJSON) {
                      (window as any).quickSaveJSON();
                    }
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Quick JSON
                </button>
                
                <button
                  onClick={() => {
                    console.log("🧪 Testing Markdown save...");
                    if ((window as any).quickSaveMarkdown) {
                      (window as any).quickSaveMarkdown();
                    }
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Quick Markdown
                </button>
                
                <button
                  onClick={() => {
                    console.log("🧪 Testing HTML save...");
                    if ((window as any).quickSaveHTML) {
                      (window as any).quickSaveHTML();
                    }
                  }}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  Quick HTML
                </button>
                
                <button
                  onClick={() => {
                    console.log("🧪 Testing ZIP save...");
                    if ((window as any).quickSaveZIP) {
                      (window as any).quickSaveZIP();
                    }
                  }}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                >
                  Quick ZIP
                </button>
              </div>

              <div className="text-sm text-gray-600">
                <p><strong>Console Commands:</strong></p>
                <div className="bg-gray-100 p-3 rounded font-mono text-xs mt-2">
                  quickSaveJSON() • quickSaveMarkdown() • quickSaveHTML() • quickSaveZIP()
                </div>
              </div>
            </div>

            {/* Saved Documents List */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📚 Saved Documents ({savedDocs.length})
              </h3>
              
              {savedDocs.length > 0 ? (
                <div className="space-y-3">
                  {savedDocs.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{doc.title}</div>
                        <div className="text-sm text-gray-500">
                          ID: {doc.id} • Saved: {new Date(doc.timestamp).toLocaleString()}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          console.log("🔄 Restoring document:", doc.id);
                          if (controller) {
                            controller.restoreFromLocalStorage(doc.id);
                          }
                        }}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No saved documents found</p>
                  <p className="text-sm">Try saving a document or enabling auto-save</p>
                </div>
              )}
            </div>

            {/* Usage Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">📖 How to Use</h3>
              
              <div className="space-y-3 text-blue-800">
                <div>
                  <strong>1. Create Content:</strong> Switch to the "Editor" tab and add some content to your BlockSuite document.
                </div>
                
                <div>
                  <strong>2. Save Documents:</strong> Use the Save Tools tab to export in different formats, or use console commands for quick saves.
                </div>
                
                <div>
                  <strong>3. Enable Auto-save:</strong> Click the "Auto-save" button to automatically save every 30 seconds.
                </div>
                
                <div>
                  <strong>4. Quick Testing:</strong> Use the test buttons or console commands to try different export formats.
                </div>
                
                <div>
                  <strong>5. View Saves:</strong> Check the "Saved Documents" list to see all your auto-saved content.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}