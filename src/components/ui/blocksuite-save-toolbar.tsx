"use client";

import React, { useState } from 'react';
import { Download, Save, FileText, Code, Globe, Archive, Trash2 } from 'lucide-react';
import { useBlockSuiteController } from '@/hooks/use-block-suite-controller';

interface SaveToolbarProps {
  className?: string;
}

export function BlockSuiteSaveToolbar({ className = "" }: SaveToolbarProps) {
  const controller = useBlockSuiteController();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const handleSave = async (format: 'json' | 'markdown' | 'html' | 'zip' | 'txt') => {
    if (!controller) {
      alert('BlockSuite editor not ready');
      return;
    }

    setIsSaving(true);
    try {
      const success = await controller.saveDocument(format);
      if (success) {
        setLastSaved(new Date());
        // Show success message
        setTimeout(() => setIsSaving(false), 1000);
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert(`Failed to save as ${format.toUpperCase()}`);
      setIsSaving(false);
    }
  };

  const handleAutoSaveToggle = () => {
    if (!controller) return;
    
    // This would require extending the hook to support auto-save
    // For now, just show a message
    alert('Auto-save can be enabled via console: controller.enableAutoSave()');
  };

  const saveOptions = [
    {
      format: 'json' as const,
      label: 'JSON',
      icon: Code,
      description: 'Complete document data',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      format: 'markdown' as const,
      label: 'Markdown',
      icon: FileText,
      description: 'Markdown format',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      format: 'html' as const,
      label: 'HTML',
      icon: Globe,
      description: 'Web-ready HTML',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      format: 'zip' as const,
      label: 'ZIP',
      icon: Archive,
      description: 'Complete package with assets',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      format: 'txt' as const,
      label: 'Text',
      icon: FileText,
      description: 'Plain text only',
      color: 'bg-gray-500 hover:bg-gray-600'
    }
  ];

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Save className="h-5 w-5 text-gray-600" />
        <h3 className="font-medium text-gray-900">Save Document</h3>
        {lastSaved && (
          <span className="text-xs text-gray-500 ml-auto">
            Last saved: {lastSaved.toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
        {saveOptions.map((option) => {
          const IconComponent = option.icon;
          return (
            <button
              key={option.format}
              onClick={() => handleSave(option.format)}
              disabled={isSaving}
              className={`
                flex flex-col items-center gap-2 p-3 rounded-lg text-white text-sm font-medium
                transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                ${option.color}
                hover:scale-105 hover:shadow-lg
              `}
              title={option.description}
            >
              <IconComponent className="h-5 w-5" />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <button
          onClick={handleAutoSaveToggle}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          <Download className="h-4 w-4" />
          Auto-save
        </button>

        <div className="ml-auto text-xs text-gray-500">
          {isSaving ? 'Saving...' : 'Ready to save'}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-600 space-y-1">
          <div><strong>Quick Save:</strong> Use console functions for instant saving</div>
          <div className="font-mono bg-gray-100 p-2 rounded">
            quickSaveJSON() • quickSaveMarkdown() • quickSaveHTML() • quickSaveZIP()
          </div>
        </div>
      </div>
    </div>
  );
}