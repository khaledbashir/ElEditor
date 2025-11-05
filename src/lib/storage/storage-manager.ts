/**
 * @file storage-manager.ts
 * @description Production-grade storage manager with retry logic, fallbacks, and auto-save
 * 
 * This is the main entry point for all storage operations. It provides:
 * - Multiple storage backend support with automatic fallback
 * - Retry logic for failed operations
 * - Auto-save queue management
 * - Error recovery
 */

import {
  StorageAdapter,
  StorageConfig,
  StorageResult,
  Document,
  DocumentMetadata,
  DocumentFilter,
  StorageStats,
  StorageErrorCode,
  SaveQueueItem,
  Logger,
} from './types';
import { IndexedDBAdapter } from './adapters/indexeddb-adapter';
import { createLogger } from './logger';

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<StorageConfig> = {
  primaryBackend: 'indexeddb',
  fallbackBackends: ['memory'],
  autoSave: true,
  autoSaveInterval: 30000, // 30 seconds
  enableCompression: false,
  maxRetries: 3,
  retryDelay: 1000,
  enableLogging: true,
  logger: createLogger({ prefix: '[StorageManager]' }),
};

/**
 * Main storage manager
 */
export class StorageManager {
  private config: Required<StorageConfig>;
  private logger: Logger;
  private adapters: Map<string, StorageAdapter> = new Map();
  private activeAdapter: StorageAdapter | null = null;
  private saveQueue: SaveQueueItem[] = [];
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private isProcessingQueue = false;
  private initialized = false;

  constructor(config?: Partial<StorageConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = this.config.logger;
  }

  /**
   * Initialize the storage manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.logger.info('Initializing storage manager', {
        primaryBackend: this.config.primaryBackend,
      });

      // Initialize adapters
      await this.initializeAdapters();

      // Select active adapter
      await this.selectActiveAdapter();

      // Start auto-save if enabled
      if (this.config.autoSave) {
        this.startAutoSave();
      }

      this.initialized = true;
      this.logger.info('Storage manager initialized successfully', {
        activeAdapter: this.activeAdapter?.name,
      });
    } catch (error) {
      this.logger.error('Failed to initialize storage manager', error as Error);
      throw error;
    }
  }

  /**
   * Save a document
   */
  async save<T>(document: Document<T>, priority: number = 0): Promise<StorageResult<Document<T>>> {
    await this.ensureInitialized();

    if (!this.activeAdapter) {
      return this.createErrorResult(
        StorageErrorCode.STORAGE_UNAVAILABLE,
        'No storage adapter available'
      );
    }

    // Try to save with retry logic
    return await this.executeWithRetry(
      () => this.activeAdapter!.save(document),
      'save',
      { documentId: document.metadata.id }
    );
  }

  /**
   * Queue a document for auto-save
   */
  queueSave<T>(
    document: Document<T>,
    options?: {
      priority?: number;
      onSuccess?: (result: StorageResult<Document<T>>) => void;
      onError?: (error: any) => void;
    }
  ): void {
    const queueItem: SaveQueueItem<T> = {
      document,
      priority: options?.priority ?? 0,
      queuedAt: Date.now(),
      retries: 0,
      onSuccess: options?.onSuccess,
      onError: options?.onError,
    };

    // Add to queue (maintain priority order)
    this.saveQueue.push(queueItem);
    this.saveQueue.sort((a, b) => b.priority - a.priority);

    this.logger.debug('Document queued for save', {
      documentId: document.metadata.id,
      queueSize: this.saveQueue.length,
    });

    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  /**
   * Load a document by ID
   */
  async load<T>(documentId: string): Promise<StorageResult<Document<T>>> {
    await this.ensureInitialized();

    if (!this.activeAdapter) {
      return this.createErrorResult(
        StorageErrorCode.STORAGE_UNAVAILABLE,
        'No storage adapter available'
      );
    }

    return await this.executeWithRetry(
      () => this.activeAdapter!.load<T>(documentId),
      'load',
      { documentId }
    );
  }

  /**
   * Delete a document
   */
  async delete(documentId: string): Promise<StorageResult<void>> {
    await this.ensureInitialized();

    if (!this.activeAdapter) {
      return this.createErrorResult(
        StorageErrorCode.STORAGE_UNAVAILABLE,
        'No storage adapter available'
      );
    }

    return await this.executeWithRetry(
      () => this.activeAdapter!.delete(documentId),
      'delete',
      { documentId }
    );
  }

  /**
   * List documents
   */
  async list(filter?: DocumentFilter): Promise<StorageResult<DocumentMetadata[]>> {
    await this.ensureInitialized();

    if (!this.activeAdapter) {
      return this.createErrorResult(
        StorageErrorCode.STORAGE_UNAVAILABLE,
        'No storage adapter available'
      );
    }

    return await this.activeAdapter.list(filter);
  }

  /**
   * Check if document exists
   */
  async exists(documentId: string): Promise<boolean> {
    await this.ensureInitialized();

    if (!this.activeAdapter) {
      return false;
    }

    return await this.activeAdapter.exists(documentId);
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<StorageStats> {
    await this.ensureInitialized();

    if (!this.activeAdapter) {
      return {
        documentCount: 0,
        bytesUsed: 0,
      };
    }

    return await this.activeAdapter.getStats();
  }

  /**
   * Flush the save queue (save all pending documents)
   */
  async flush(): Promise<void> {
    this.logger.info('Flushing save queue', { queueSize: this.saveQueue.length });
    
    while (this.saveQueue.length > 0) {
      await this.processQueue();
    }
  }

  /**
   * Shutdown the storage manager
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down storage manager');

    // Stop auto-save
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }

    // Flush pending saves
    await this.flush();

    // Close adapters
    for (const adapter of this.adapters.values()) {
      await adapter.close();
    }

    this.initialized = false;
    this.logger.info('Storage manager shut down');
  }

  // Private methods

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private async initializeAdapters(): Promise<void> {
    // Initialize IndexedDB adapter
    const indexedDBAdapter = new IndexedDBAdapter(this.logger);
    this.adapters.set('indexeddb', indexedDBAdapter);

    // Initialize other adapters as needed
    // TODO: Add backend API adapter, memory adapter
  }

  private async selectActiveAdapter(): Promise<void> {
    // Try primary backend first
    const primaryAdapter = this.adapters.get(this.config.primaryBackend);
    
    if (primaryAdapter && await primaryAdapter.isAvailable()) {
      await primaryAdapter.initialize();
      this.activeAdapter = primaryAdapter;
      this.logger.info('Using primary storage backend', {
        backend: this.config.primaryBackend,
      });
      return;
    }

    // Try fallback backends
    if (this.config.fallbackBackends) {
      for (const backend of this.config.fallbackBackends) {
        const adapter = this.adapters.get(backend);
        
        if (adapter && await adapter.isAvailable()) {
          await adapter.initialize();
          this.activeAdapter = adapter;
          this.logger.warn('Using fallback storage backend', { backend });
          return;
        }
      }
    }

    throw new Error('No storage backend available');
  }

  private async executeWithRetry<T>(
    operation: () => Promise<StorageResult<T>>,
    operationName: string,
    context: Record<string, unknown>
  ): Promise<StorageResult<T>> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await operation();
        
        if (result.success) {
          if (attempt > 0) {
            this.logger.info(`${operationName} succeeded after ${attempt} retries`, context);
          }
          return result;
        }

        // Check if error is retryable
        if (!result.error?.retryable || attempt === this.config.maxRetries) {
          return result;
        }

        lastError = result.error;
        
        // Wait before retry
        await this.delay(this.config.retryDelay * (attempt + 1));
        
        this.logger.warn(`Retrying ${operationName} (attempt ${attempt + 1})`, context);
      } catch (error) {
        lastError = error;
        
        if (attempt === this.config.maxRetries) {
          break;
        }
        
        await this.delay(this.config.retryDelay * (attempt + 1));
      }
    }

    return this.createErrorResult(
      StorageErrorCode.UNKNOWN_ERROR,
      `${operationName} failed after ${this.config.maxRetries} retries`,
      lastError
    );
  }

  private startAutoSave(): void {
    this.autoSaveTimer = setInterval(() => {
      if (this.saveQueue.length > 0 && !this.isProcessingQueue) {
        this.processQueue();
      }
    }, this.config.autoSaveInterval);

    this.logger.info('Auto-save started', {
      interval: `${this.config.autoSaveInterval}ms`,
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.saveQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      const item = this.saveQueue.shift();
      if (!item) return;

      const result = await this.save(item.document);

      if (result.success) {
        item.onSuccess?.(result);
      } else {
        item.onError?.(result.error);
        
        // Re-queue if retryable and under retry limit
        if (result.error?.retryable && item.retries < this.config.maxRetries) {
          item.retries++;
          this.saveQueue.push(item);
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private createErrorResult<T>(
    code: StorageErrorCode,
    message: string,
    originalError?: Error
  ): StorageResult<T> {
    return {
      success: false,
      error: {
        code,
        message,
        originalError,
        timestamp: Date.now(),
        retryable: false,
      },
    };
  }
}

