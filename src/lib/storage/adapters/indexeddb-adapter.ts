/**
 * @file indexeddb-adapter.ts
 * @description Production-grade IndexedDB storage adapter with proper error handling
 * 
 * This adapter provides reliable document storage using IndexedDB with:
 * - Automatic schema migrations
 * - Transaction management
 * - Error recovery
 * - Quota management
 */

import {
  StorageAdapter,
  StorageResult,
  Document,
  DocumentMetadata,
  DocumentFilter,
  StorageStats,
  StorageError,
  StorageErrorCode,
  Logger,
} from '../types';
import { createLogger } from '../logger';

const DB_NAME = 'blocksuite_documents';
const DB_VERSION = 1;
const STORE_NAME = 'documents';
const METADATA_STORE = 'metadata';

/**
 * IndexedDB storage adapter
 */
export class IndexedDBAdapter implements StorageAdapter {
  readonly name = 'indexeddb' as const;
  private db: IDBDatabase | null = null;
  private logger: Logger;
  private initPromise: Promise<void> | null = null;

  constructor(logger?: Logger) {
    this.logger = logger || createLogger({ prefix: '[IndexedDB]' });
  }

  /**
   * Check if IndexedDB is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return false;
      }

      // Test if we can actually open a database
      const testDB = await this.openDatabase('test_availability', 1);
      testDB.close();
      
      // Clean up test database
      window.indexedDB.deleteDatabase('test_availability');
      
      return true;
    } catch (error) {
      this.logger.warn('IndexedDB not available', { error });
      return false;
    }
  }

  /**
   * Initialize the adapter
   */
  async initialize(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
      this.logger.info('Initializing IndexedDB adapter');
      
      this.db = await this.openDatabase(DB_NAME, DB_VERSION);
      
      this.logger.info('IndexedDB adapter initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize IndexedDB', error as Error);
      throw this.createError(
        StorageErrorCode.STORAGE_UNAVAILABLE,
        'Failed to initialize IndexedDB',
        error as Error,
        false
      );
    }
  }

  /**
   * Open IndexedDB database with schema setup
   */
  private openDatabase(name: string, version: number): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(name, version);

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create documents store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'metadata.id' });
          store.createIndex('threadId', 'metadata.threadId', { unique: false });
          store.createIndex('type', 'metadata.type', { unique: false });
          store.createIndex('updatedAt', 'metadata.updatedAt', { unique: false });
        }

        // Create metadata store for quick queries
        if (!db.objectStoreNames.contains(METADATA_STORE)) {
          const metaStore = db.createObjectStore(METADATA_STORE, { keyPath: 'id' });
          metaStore.createIndex('threadId', 'threadId', { unique: false });
          metaStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };
    });
  }

  /**
   * Save a document
   */
  async save<T>(document: Document<T>): Promise<StorageResult<Document<T>>> {
    const startTime = performance.now();
    
    try {
      await this.ensureInitialized();

      // Update metadata
      document.metadata.updatedAt = Date.now();
      document.metadata.version += 1;

      // Save to both stores in a transaction
      await this.executeTransaction(['readwrite', STORE_NAME, METADATA_STORE], async (tx) => {
        const docStore = tx.objectStore(STORE_NAME);
        const metaStore = tx.objectStore(METADATA_STORE);

        docStore.put(document);
        metaStore.put(document.metadata);
      });

      const duration = performance.now() - startTime;
      
      this.logger.debug('Document saved', {
        documentId: document.metadata.id,
        duration: `${duration.toFixed(2)}ms`,
      });

      return {
        success: true,
        data: document,
        metadata: {
          duration,
          backend: this.name,
        },
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      const storageError = this.handleError(error as Error, 'save');
      
      this.logger.error('Failed to save document', error as Error, {
        documentId: document.metadata.id,
      });

      return {
        success: false,
        error: storageError,
        metadata: {
          duration,
          backend: this.name,
        },
      };
    }
  }

  /**
   * Load a document by ID
   */
  async load<T>(documentId: string): Promise<StorageResult<Document<T>>> {
    const startTime = performance.now();
    
    try {
      await this.ensureInitialized();

      const document = await this.executeTransaction(['readonly', STORE_NAME], async (tx) => {
        const store = tx.objectStore(STORE_NAME);
        return this.getFromStore<Document<T>>(store, documentId);
      });

      const duration = performance.now() - startTime;

      if (!document) {
        return {
          success: false,
          error: this.createError(
            StorageErrorCode.NOT_FOUND,
            `Document not found: ${documentId}`,
            undefined,
            false
          ),
          metadata: {
            duration,
            backend: this.name,
          },
        };
      }

      this.logger.debug('Document loaded', {
        documentId,
        duration: `${duration.toFixed(2)}ms`,
      });

      return {
        success: true,
        data: document,
        metadata: {
          duration,
          backend: this.name,
        },
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      const storageError = this.handleError(error as Error, 'load');
      
      this.logger.error('Failed to load document', error as Error, { documentId });

      return {
        success: false,
        error: storageError,
        metadata: {
          duration,
          backend: this.name,
        },
      };
    }
  }

  /**
   * Delete a document
   */
  async delete(documentId: string): Promise<StorageResult<void>> {
    const startTime = performance.now();
    
    try {
      await this.ensureInitialized();

      await this.executeTransaction(['readwrite', STORE_NAME, METADATA_STORE], async (tx) => {
        const docStore = tx.objectStore(STORE_NAME);
        const metaStore = tx.objectStore(METADATA_STORE);

        docStore.delete(documentId);
        metaStore.delete(documentId);
      });

      const duration = performance.now() - startTime;
      
      this.logger.info('Document deleted', { documentId });

      return {
        success: true,
        metadata: {
          duration,
          backend: this.name,
        },
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      const storageError = this.handleError(error as Error, 'delete');
      
      this.logger.error('Failed to delete document', error as Error, { documentId });

      return {
        success: false,
        error: storageError,
        metadata: {
          duration,
          backend: this.name,
        },
      };
    }
  }

  /**
   * List documents with optional filtering
   */
  async list(filter?: DocumentFilter): Promise<StorageResult<DocumentMetadata[]>> {
    // Implementation continues in next part...
    const startTime = performance.now();
    
    try {
      await this.ensureInitialized();

      const metadata = await this.executeTransaction(['readonly', METADATA_STORE], async (tx) => {
        const store = tx.objectStore(METADATA_STORE);
        return this.getAllFromStore<DocumentMetadata>(store);
      });

      // Apply filters
      let filtered = metadata;
      
      if (filter?.threadId) {
        filtered = filtered.filter(m => m.threadId === filter.threadId);
      }
      
      if (filter?.type) {
        filtered = filtered.filter(m => m.type === filter.type);
      }
      
      if (!filter?.includeDeleted) {
        filtered = filtered.filter(m => !m.isDeleted);
      }

      const duration = performance.now() - startTime;

      return {
        success: true,
        data: filtered,
        metadata: {
          duration,
          backend: this.name,
        },
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      const storageError = this.handleError(error as Error, 'list');

      return {
        success: false,
        error: storageError,
        metadata: {
          duration,
          backend: this.name,
        },
      };
    }
  }

  /**
   * Check if document exists
   */
  async exists(documentId: string): Promise<boolean> {
    try {
      await this.ensureInitialized();

      const result = await this.executeTransaction(['readonly', METADATA_STORE], async (tx) => {
        const store = tx.objectStore(METADATA_STORE);
        return this.getFromStore<DocumentMetadata>(store, documentId);
      });

      return result !== null;
    } catch (error) {
      this.logger.error('Failed to check document existence', error as Error, { documentId });
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<StorageStats> {
    try {
      await this.ensureInitialized();

      const metadata = await this.executeTransaction(['readonly', METADATA_STORE], async (tx) => {
        const store = tx.objectStore(METADATA_STORE);
        return this.getAllFromStore<DocumentMetadata>(store);
      });

      // Estimate storage usage (rough calculation)
      const bytesUsed = await this.estimateStorageSize();

      // Get quota if available
      let quota: number | undefined;
      let bytesAvailable: number | undefined;

      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        quota = estimate.quota;
        bytesAvailable = estimate.quota ? estimate.quota - (estimate.usage || 0) : undefined;
      }

      return {
        documentCount: metadata.length,
        bytesUsed,
        bytesAvailable,
        quota,
        usagePercentage: quota ? (bytesUsed / quota) * 100 : undefined,
      };
    } catch (error) {
      this.logger.error('Failed to get storage stats', error as Error);
      return {
        documentCount: 0,
        bytesUsed: 0,
      };
    }
  }

  /**
   * Clear all data
   */
  async clear(): Promise<StorageResult<void>> {
    try {
      await this.ensureInitialized();

      await this.executeTransaction(['readwrite', STORE_NAME, METADATA_STORE], async (tx) => {
        const docStore = tx.objectStore(STORE_NAME);
        const metaStore = tx.objectStore(METADATA_STORE);

        docStore.clear();
        metaStore.clear();
      });

      this.logger.warn('All documents cleared from storage');

      return { success: true, metadata: { duration: 0, backend: this.name } };
    } catch (error) {
      const storageError = this.handleError(error as Error, 'clear');
      return { success: false, error: storageError, metadata: { duration: 0, backend: this.name } };
    }
  }

  /**
   * Close the adapter
   */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.logger.info('IndexedDB connection closed');
    }
  }

  // Private helper methods

  private async ensureInitialized(): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }
  }

  private executeTransaction<T>(
    config: ['readonly' | 'readwrite', ...string[]],
    callback: (tx: IDBTransaction) => Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const [mode, ...storeNames] = config;
      const tx = this.db.transaction(storeNames, mode);

      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('Transaction aborted'));

      callback(tx).then(resolve).catch(reject);
    });
  }

  private getFromStore<T>(store: IDBObjectStore, key: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private getAllFromStore<T>(store: IDBObjectStore): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  private async estimateStorageSize(): Promise<number> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    }
    return 0;
  }

  private handleError(error: Error, operation: string): StorageError {
    // Map specific IndexedDB errors to our error codes
    if (error.name === 'QuotaExceededError') {
      return this.createError(
        StorageErrorCode.QUOTA_EXCEEDED,
        'Storage quota exceeded',
        error,
        false
      );
    }

    if (error.name === 'NotFoundError') {
      return this.createError(
        StorageErrorCode.NOT_FOUND,
        'Document not found',
        error,
        false
      );
    }

    if (error.name === 'ConstraintError') {
      return this.createError(
        StorageErrorCode.ALREADY_EXISTS,
        'Document already exists',
        error,
        false
      );
    }

    // Default to unknown error
    return this.createError(
      StorageErrorCode.UNKNOWN_ERROR,
      `IndexedDB ${operation} failed: ${error.message}`,
      error,
      true
    );
  }

  private createError(
    code: StorageErrorCode,
    message: string,
    originalError?: Error,
    retryable: boolean = true
  ): StorageError {
    return {
      code,
      message,
      originalError,
      timestamp: Date.now(),
      retryable,
      context: {
        adapter: this.name,
      },
    };
  }
}


