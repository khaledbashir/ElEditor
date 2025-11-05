/**
 * @file storage-system-singleton.ts
 * @description Singleton instance of the storage system for the entire application
 * 
 * This ensures only one storage system exists across the app, preventing
 * multiple IndexedDB connections and conflicting auto-save timers.
 */

import { createStorageSystem, StorageSystemConfig } from './storage';
import { StorageManager } from './storage/storage-manager';
import { ThreadDocumentService } from './storage/thread-document-service';

let storageSystemInstance: {
  storageManager: StorageManager;
  threadDocumentService: ThreadDocumentService;
} | null = null;

let initializationPromise: Promise<{
  storageManager: StorageManager;
  threadDocumentService: ThreadDocumentService;
}> | null = null;

/**
 * Get the global storage system instance
 * Creates and initializes it if it doesn't exist
 */
export async function getStorageSystem(config?: StorageSystemConfig) {
  // Return existing instance if available
  if (storageSystemInstance) {
    return storageSystemInstance;
  }

  // Wait for ongoing initialization
  if (initializationPromise) {
    return initializationPromise;
  }

  // Initialize new instance
  initializationPromise = createStorageSystem(config);
  storageSystemInstance = await initializationPromise;
  initializationPromise = null;

  return storageSystemInstance;
}

/**
 * Reset the storage system (useful for testing or logout)
 */
export async function resetStorageSystem() {
  if (storageSystemInstance) {
    await storageSystemInstance.storageManager.shutdown();
    storageSystemInstance = null;
  }
  initializationPromise = null;
}

/**
 * Check if storage system is initialized
 */
export function isStorageSystemInitialized(): boolean {
  return storageSystemInstance !== null;
}

