/**
 * @file index.ts
 * @description Main export file for the storage system
 */

// Core types
export * from './types';

// Logger
export * from './logger';

// Storage manager
export { StorageManager } from './storage-manager';

// Thread-document service
export { ThreadDocumentService } from './thread-document-service';

// Adapters
export { IndexedDBAdapter } from './adapters/indexeddb-adapter';

/**
 * Create a production-ready storage system
 */
import { StorageManager } from './storage-manager';
import { ThreadDocumentService } from './thread-document-service';
import { StorageConfig } from './types';

export interface StorageSystemConfig extends Partial<StorageConfig> {
  autoCreateDocuments?: boolean;
  defaultDocumentType?: 'blocksuite' | 'spreadsheet';
}

export async function createStorageSystem(config?: StorageSystemConfig) {
  // Create storage manager
  const storageManager = new StorageManager(config);
  await storageManager.initialize();

  // Create thread-document service
  const threadDocumentService = new ThreadDocumentService({
    storageManager,
    autoCreateDocument: config?.autoCreateDocuments ?? true,
    defaultDocumentType: config?.defaultDocumentType ?? 'blocksuite',
  });
  await threadDocumentService.initialize();

  return {
    storageManager,
    threadDocumentService,
  };
}

