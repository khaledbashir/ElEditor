/**
 * @file useThreadDocument.ts
 * @description Production-grade React hook for managing thread-document associations
 * 
 * This hook provides:
 * - Automatic document loading when thread changes
 * - Auto-save functionality
 * - Error handling and recovery
 * - Loading states
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { Document, StorageResult } from '@/lib/storage/types';
import { getStorageSystem } from '@/lib/storage-system-singleton';

export interface UseThreadDocumentOptions {
  /** Thread ID to load document for */
  threadId: string | null;
  
  /** Document type */
  documentType?: 'blocksuite' | 'spreadsheet';
  
  /** Enable auto-save */
  autoSave?: boolean;
  
  /** Auto-save debounce delay in milliseconds */
  autoSaveDelay?: number;
  
  /** Callback when document loads */
  onDocumentLoaded?: (document: Document) => void;
  
  /** Callback when document saves */
  onDocumentSaved?: (document: Document) => void;
  
  /** Callback on error */
  onError?: (error: Error) => void;
}

export interface UseThreadDocumentReturn<T = unknown> {
  /** Current document */
  document: Document<T> | null;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Saving state */
  isSaving: boolean;
  
  /** Error state */
  error: Error | null;
  
  /** Update document content */
  updateContent: (content: T) => void;
  
  /** Save document immediately */
  save: () => Promise<void>;
  
  /** Reload document from storage */
  reload: () => Promise<void>;
  
  /** Check if document has unsaved changes */
  hasUnsavedChanges: boolean;
}

/**
 * Hook for managing thread-document associations
 */
export function useThreadDocument<T = unknown>(
  options: UseThreadDocumentOptions
): UseThreadDocumentReturn<T> {
  const {
    threadId,
    documentType = 'blocksuite',
    autoSave = true,
    autoSaveDelay = 2000,
    onDocumentLoaded,
    onDocumentSaved,
    onError,
  } = options;

  const [document, setDocument] = useState<Document<T> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingContentRef = useRef<T | null>(null);
  const mountedRef = useRef(true);

  /**
   * Load document for thread
   */
  const loadDocument = useCallback(async () => {
    if (!threadId) {
      setDocument(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { threadDocumentService } = await getStorageSystem();
      
      const result = await threadDocumentService.getDocumentForThread<T>(threadId, {
        createIfMissing: true,
        documentType,
      });

      if (!mountedRef.current) return;

      if (result.success && result.data) {
        setDocument(result.data);
        setHasUnsavedChanges(false);
        onDocumentLoaded?.(result.data);
      } else {
        const err = new Error(result.error?.message || 'Failed to load document');
        setError(err);
        onError?.(err);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      
      const error = err as Error;
      setError(error);
      onError?.(error);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [threadId, documentType, onDocumentLoaded, onError]);

  /**
   * Save document to storage
   */
  const saveDocument = useCallback(async (docToSave: Document<T>) => {
    setIsSaving(true);
    setError(null);

    try {
      const { storageManager } = await getStorageSystem();
      
      const result = await storageManager.save(docToSave);

      if (!mountedRef.current) return;

      if (result.success && result.data) {
        setDocument(result.data);
        setHasUnsavedChanges(false);
        onDocumentSaved?.(result.data);
      } else {
        const err = new Error(result.error?.message || 'Failed to save document');
        setError(err);
        onError?.(err);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      
      const error = err as Error;
      setError(error);
      onError?.(error);
    } finally {
      if (mountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [onDocumentSaved, onError]);

  /**
   * Update document content
   */
  const updateContent = useCallback((content: T) => {
    if (!document) return;

    const updatedDoc: Document<T> = {
      ...document,
      content,
      metadata: {
        ...document.metadata,
        updatedAt: Date.now(),
      },
    };

    setDocument(updatedDoc);
    setHasUnsavedChanges(true);
    pendingContentRef.current = content;

    // Schedule auto-save
    if (autoSave) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      autoSaveTimerRef.current = setTimeout(() => {
        saveDocument(updatedDoc);
      }, autoSaveDelay);
    }
  }, [document, autoSave, autoSaveDelay, saveDocument]);

  /**
   * Save immediately
   */
  const save = useCallback(async () => {
    if (!document) return;

    // Clear auto-save timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    await saveDocument(document);
  }, [document, saveDocument]);

  /**
   * Reload document from storage
   */
  const reload = useCallback(async () => {
    await loadDocument();
  }, [loadDocument]);

  // Load document when thread changes
  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  // Save on unmount if there are unsaved changes
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      // Save pending changes on unmount
      if (hasUnsavedChanges && document) {
        // Fire and forget - we're unmounting
        const { storageManager } = getStorageSystem().then(({ storageManager }) => {
          storageManager.queueSave(document, { priority: 10 });
        });
      }
    };
  }, [hasUnsavedChanges, document]);

  return {
    document,
    isLoading,
    isSaving,
    error,
    updateContent,
    save,
    reload,
    hasUnsavedChanges,
  };
}

