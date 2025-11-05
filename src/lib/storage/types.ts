/**
 * @file types.ts
 * @description Production-grade type definitions for document storage system
 * 
 * This module provides comprehensive TypeScript types for the entire storage layer,
 * ensuring type safety across the application.
 */

/**
 * Document metadata stored alongside content
 */
export interface DocumentMetadata {
  /** Unique document identifier */
  id: string;
  
  /** Associated thread ID for chat-document linking */
  threadId: string;
  
  /** Document title */
  title: string;
  
  /** Document type */
  type: 'blocksuite' | 'spreadsheet';
  
  /** Creation timestamp (Unix milliseconds) */
  createdAt: number;
  
  /** Last modification timestamp (Unix milliseconds) */
  updatedAt: number;
  
  /** Document version for conflict resolution */
  version: number;
  
  /** Optional tags for organization */
  tags?: string[];
  
  /** User who last modified (for multi-user scenarios) */
  lastModifiedBy?: string;
  
  /** Soft delete flag */
  isDeleted?: boolean;
  
  /** Custom metadata */
  customData?: Record<string, unknown>;
}

/**
 * Complete document structure with content
 */
export interface Document<T = unknown> {
  /** Document metadata */
  metadata: DocumentMetadata;
  
  /** Document content (BlockSuite snapshot or spreadsheet data) */
  content: T;
  
  /** Content hash for integrity checking */
  contentHash?: string;
}

/**
 * Storage operation result
 */
export interface StorageResult<T = unknown> {
  /** Operation success status */
  success: boolean;
  
  /** Result data (if successful) */
  data?: T;
  
  /** Error information (if failed) */
  error?: StorageError;
  
  /** Operation metadata */
  metadata?: {
    /** Operation duration in milliseconds */
    duration: number;
    
    /** Storage backend used */
    backend: StorageBackend;
    
    /** Retry count (if applicable) */
    retries?: number;
  };
}

/**
 * Storage error with detailed information
 */
export interface StorageError {
  /** Error code for programmatic handling */
  code: StorageErrorCode;
  
  /** Human-readable error message */
  message: string;
  
  /** Original error object */
  originalError?: Error;
  
  /** Additional context */
  context?: Record<string, unknown>;
  
  /** Timestamp when error occurred */
  timestamp: number;
  
  /** Whether the operation can be retried */
  retryable: boolean;
}

/**
 * Storage error codes
 */
export enum StorageErrorCode {
  // Connection errors
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  TIMEOUT = 'TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // Data errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  INVALID_DATA = 'INVALID_DATA',
  CORRUPTED_DATA = 'CORRUPTED_DATA',
  
  // Permission errors
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // Conflict errors
  VERSION_CONFLICT = 'VERSION_CONFLICT',
  CONCURRENT_MODIFICATION = 'CONCURRENT_MODIFICATION',
  
  // System errors
  STORAGE_UNAVAILABLE = 'STORAGE_UNAVAILABLE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Storage backend types
 */
export type StorageBackend = 'indexeddb' | 'backend-api' | 'memory';

/**
 * Storage configuration
 */
export interface StorageConfig {
  /** Primary storage backend */
  primaryBackend: StorageBackend;
  
  /** Fallback backends (in order of preference) */
  fallbackBackends?: StorageBackend[];
  
  /** Backend API endpoint (if using backend-api) */
  apiEndpoint?: string;
  
  /** API authentication token */
  apiToken?: string;
  
  /** Enable auto-save */
  autoSave?: boolean;
  
  /** Auto-save interval in milliseconds */
  autoSaveInterval?: number;
  
  /** Enable compression for large documents */
  enableCompression?: boolean;
  
  /** Maximum retry attempts for failed operations */
  maxRetries?: number;
  
  /** Retry delay in milliseconds */
  retryDelay?: number;
  
  /** Enable detailed logging */
  enableLogging?: boolean;
  
  /** Custom logger function */
  logger?: Logger;
}

/**
 * Logger interface for dependency injection
 */
export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
}

/**
 * Storage adapter interface - all storage backends must implement this
 */
export interface StorageAdapter {
  /** Adapter name for identification */
  readonly name: StorageBackend;
  
  /** Check if adapter is available in current environment */
  isAvailable(): Promise<boolean>;
  
  /** Initialize the storage adapter */
  initialize(): Promise<void>;
  
  /** Save a document */
  save<T>(document: Document<T>): Promise<StorageResult<Document<T>>>;
  
  /** Load a document by ID */
  load<T>(documentId: string): Promise<StorageResult<Document<T>>>;
  
  /** Delete a document */
  delete(documentId: string): Promise<StorageResult<void>>;
  
  /** List all documents (with optional filtering) */
  list(filter?: DocumentFilter): Promise<StorageResult<DocumentMetadata[]>>;
  
  /** Check if a document exists */
  exists(documentId: string): Promise<boolean>;
  
  /** Get storage usage statistics */
  getStats(): Promise<StorageStats>;
  
  /** Clear all data (use with caution) */
  clear(): Promise<StorageResult<void>>;
  
  /** Close/cleanup the adapter */
  close(): Promise<void>;
}

/**
 * Document filter for querying
 */
export interface DocumentFilter {
  /** Filter by thread ID */
  threadId?: string;
  
  /** Filter by document type */
  type?: 'blocksuite' | 'spreadsheet';
  
  /** Filter by tags */
  tags?: string[];
  
  /** Filter by date range */
  dateRange?: {
    from: number;
    to: number;
  };
  
  /** Include deleted documents */
  includeDeleted?: boolean;
  
  /** Limit number of results */
  limit?: number;
  
  /** Offset for pagination */
  offset?: number;
  
  /** Sort order */
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Storage statistics
 */
export interface StorageStats {
  /** Total number of documents */
  documentCount: number;
  
  /** Total storage used in bytes */
  bytesUsed: number;
  
  /** Available storage in bytes (if applicable) */
  bytesAvailable?: number;
  
  /** Storage quota in bytes (if applicable) */
  quota?: number;
  
  /** Percentage of quota used */
  usagePercentage?: number;
  
  /** Backend-specific stats */
  backendStats?: Record<string, unknown>;
}

/**
 * Thread-document association
 */
export interface ThreadDocumentLink {
  /** Thread ID */
  threadId: string;
  
  /** Document ID */
  documentId: string;
  
  /** Link creation timestamp */
  createdAt: number;
  
  /** Whether this is the primary document for the thread */
  isPrimary: boolean;
}

/**
 * Auto-save queue item
 */
export interface SaveQueueItem<T = unknown> {
  /** Document to save */
  document: Document<T>;
  
  /** Priority (higher = more urgent) */
  priority: number;
  
  /** Timestamp when queued */
  queuedAt: number;
  
  /** Number of retry attempts */
  retries: number;
  
  /** Callback on success */
  onSuccess?: (result: StorageResult<Document<T>>) => void;
  
  /** Callback on failure */
  onError?: (error: StorageError) => void;
}

