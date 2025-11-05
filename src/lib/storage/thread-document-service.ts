/**
 * @file thread-document-service.ts
 * @description Production-grade service for managing thread-document associations
 * 
 * This service provides:
 * - Thread-document linking and unlinking
 * - Automatic document creation for new threads
 * - Document lifecycle management
 * - Conflict resolution
 */

import {
  Document,
  DocumentMetadata,
  StorageResult,
  StorageError,
  StorageErrorCode,
  ThreadDocumentLink,
  Logger,
} from './types';
import { StorageManager } from './storage-manager';
import { createLogger } from './logger';

/**
 * Thread-document service configuration
 */
export interface ThreadDocumentServiceConfig {
  /** Storage manager instance */
  storageManager: StorageManager;
  
  /** Logger instance */
  logger?: Logger;
  
  /** Auto-create document when thread is created */
  autoCreateDocument?: boolean;
  
  /** Default document type for new threads */
  defaultDocumentType?: 'blocksuite' | 'spreadsheet';
}

/**
 * Thread-document association service
 */
export class ThreadDocumentService {
  private storageManager: StorageManager;
  private logger: Logger;
  private config: Required<ThreadDocumentServiceConfig>;
  
  // In-memory cache of thread-document links
  private linkCache: Map<string, ThreadDocumentLink> = new Map();
  private initialized = false;

  constructor(config: ThreadDocumentServiceConfig) {
    this.storageManager = config.storageManager;
    this.logger = config.logger || createLogger({ prefix: '[ThreadDocService]' });
    this.config = {
      ...config,
      autoCreateDocument: config.autoCreateDocument ?? true,
      defaultDocumentType: config.defaultDocumentType ?? 'blocksuite',
      logger: this.logger,
    };
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.logger.info('Initializing thread-document service');
      
      // Load existing links into cache
      await this.loadLinksIntoCache();
      
      this.initialized = true;
      this.logger.info('Thread-document service initialized', {
        linkCount: this.linkCache.size,
      });
    } catch (error) {
      this.logger.error('Failed to initialize thread-document service', error as Error);
      throw error;
    }
  }

  /**
   * Get document for a thread (creates one if it doesn't exist)
   */
  async getDocumentForThread<T = unknown>(
    threadId: string,
    options?: {
      createIfMissing?: boolean;
      documentType?: 'blocksuite' | 'spreadsheet';
    }
  ): Promise<StorageResult<Document<T>>> {
    try {
      await this.ensureInitialized();

      // Check cache first
      const link = this.linkCache.get(threadId);
      
      if (link) {
        // Load existing document
        const result = await this.storageManager.load<T>(link.documentId);
        
        if (result.success && result.data) {
          this.logger.debug('Document found for thread', { threadId, documentId: link.documentId });
          return result;
        }
        
        // Link exists but document is missing - clean up and recreate
        this.logger.warn('Document missing for thread link, recreating', {
          threadId,
          documentId: link.documentId,
        });
        this.linkCache.delete(threadId);
      }

      // No document exists - create one if allowed
      if (options?.createIfMissing ?? this.config.autoCreateDocument) {
        return await this.createDocumentForThread<T>(
          threadId,
          options?.documentType ?? this.config.defaultDocumentType
        );
      }

      // No document and not creating one
      return {
        success: false,
        error: {
          code: StorageErrorCode.NOT_FOUND,
          message: `No document found for thread: ${threadId}`,
          timestamp: Date.now(),
          retryable: false,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get document for thread', error as Error, { threadId });
      return {
        success: false,
        error: {
          code: StorageErrorCode.UNKNOWN_ERROR,
          message: `Failed to get document for thread: ${(error as Error).message}`,
          originalError: error as Error,
          timestamp: Date.now(),
          retryable: true,
        },
      };
    }
  }

  /**
   * Create a new document for a thread
   */
  async createDocumentForThread<T = unknown>(
    threadId: string,
    documentType: 'blocksuite' | 'spreadsheet' = 'blocksuite',
    initialContent?: T
  ): Promise<StorageResult<Document<T>>> {
    try {
      await this.ensureInitialized();

      // Check if document already exists
      const existing = this.linkCache.get(threadId);
      if (existing) {
        this.logger.warn('Document already exists for thread', { threadId });
        return await this.storageManager.load<T>(existing.documentId);
      }

      // Generate document ID
      const documentId = this.generateDocumentId(threadId);
      
      // Create document metadata
      const metadata: DocumentMetadata = {
        id: documentId,
        threadId,
        title: `Thread ${threadId.slice(0, 8)} Document`,
        type: documentType,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
      };

      // Create document
      const document: Document<T> = {
        metadata,
        content: initialContent ?? this.getDefaultContent<T>(documentType),
      };

      // Save document
      const saveResult = await this.storageManager.save(document);
      
      if (!saveResult.success) {
        return saveResult;
      }

      // Create link
      const link: ThreadDocumentLink = {
        threadId,
        documentId,
        createdAt: Date.now(),
        isPrimary: true,
      };

      // Cache the link
      this.linkCache.set(threadId, link);
      
      // Persist link
      await this.persistLink(link);

      this.logger.info('Created document for thread', { threadId, documentId });

      return saveResult;
    } catch (error) {
      this.logger.error('Failed to create document for thread', error as Error, { threadId });
      return {
        success: false,
        error: {
          code: StorageErrorCode.UNKNOWN_ERROR,
          message: `Failed to create document: ${(error as Error).message}`,
          originalError: error as Error,
          timestamp: Date.now(),
          retryable: true,
        },
      };
    }
  }

  /**
   * Link an existing document to a thread
   */
  async linkDocumentToThread(
    threadId: string,
    documentId: string,
    isPrimary: boolean = true
  ): Promise<StorageResult<void>> {
    try {
      await this.ensureInitialized();

      // Verify document exists
      const docExists = await this.storageManager.exists(documentId);
      if (!docExists) {
        return {
          success: false,
          error: {
            code: StorageErrorCode.NOT_FOUND,
            message: `Document not found: ${documentId}`,
            timestamp: Date.now(),
            retryable: false,
          },
        };
      }

      // Create link
      const link: ThreadDocumentLink = {
        threadId,
        documentId,
        createdAt: Date.now(),
        isPrimary,
      };

      // Cache and persist
      this.linkCache.set(threadId, link);
      await this.persistLink(link);

      this.logger.info('Linked document to thread', { threadId, documentId });

      return { success: true };
    } catch (error) {
      this.logger.error('Failed to link document to thread', error as Error, {
        threadId,
        documentId,
      });
      return {
        success: false,
        error: {
          code: StorageErrorCode.UNKNOWN_ERROR,
          message: `Failed to link document: ${(error as Error).message}`,
          originalError: error as Error,
          timestamp: Date.now(),
          retryable: true,
        },
      };
    }
  }

  /**
   * Unlink document from thread
   */
  async unlinkDocumentFromThread(threadId: string): Promise<StorageResult<void>> {
    try {
      await this.ensureInitialized();

      this.linkCache.delete(threadId);
      await this.removePersistedLink(threadId);

      this.logger.info('Unlinked document from thread', { threadId });

      return { success: true };
    } catch (error) {
      this.logger.error('Failed to unlink document from thread', error as Error, { threadId });
      return {
        success: false,
        error: {
          code: StorageErrorCode.UNKNOWN_ERROR,
          message: `Failed to unlink document: ${(error as Error).message}`,
          originalError: error as Error,
          timestamp: Date.now(),
          retryable: true,
        },
      };
    }
  }

  /**
   * Get all thread-document links
   */
  async getAllLinks(): Promise<ThreadDocumentLink[]> {
    await this.ensureInitialized();
    return Array.from(this.linkCache.values());
  }

  // Private helper methods

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private generateDocumentId(threadId: string): string {
    return `doc_${threadId}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  private getDefaultContent<T>(documentType: 'blocksuite' | 'spreadsheet'): T {
    if (documentType === 'spreadsheet') {
      return {} as T; // Empty spreadsheet data
    }
    // Empty BlockSuite content
    return {} as T;
  }

  private async loadLinksIntoCache(): Promise<void> {
    // Load links from storage (stored as special documents)
    const result = await this.storageManager.list({
      type: 'blocksuite', // Links stored as metadata
    });

    if (result.success && result.data) {
      // Extract thread links from custom metadata
      for (const meta of result.data) {
        if (meta.customData?.isThreadLink) {
          const link: ThreadDocumentLink = {
            threadId: meta.threadId,
            documentId: meta.id,
            createdAt: meta.createdAt,
            isPrimary: true,
          };
          this.linkCache.set(meta.threadId, link);
        }
      }
    }
  }

  private async persistLink(link: ThreadDocumentLink): Promise<void> {
    // Store link as metadata in a special document
    // This ensures links survive browser restarts
    const linkDoc: Document<ThreadDocumentLink> = {
      metadata: {
        id: `link_${link.threadId}`,
        threadId: link.threadId,
        title: `Link: ${link.threadId}`,
        type: 'blocksuite',
        createdAt: link.createdAt,
        updatedAt: Date.now(),
        version: 1,
        customData: {
          isThreadLink: true,
          documentId: link.documentId,
        },
      },
      content: link,
    };

    await this.storageManager.save(linkDoc);
  }

  private async removePersistedLink(threadId: string): Promise<void> {
    await this.storageManager.delete(`link_${threadId}`);
  }
}

