# Storage Architecture Documentation

## Overview

This document describes the production-grade storage system implemented for managing BlockSuite documents and spreadsheet data with thread-document associations.

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│  (React Components, Hooks, UI)                              │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Thread-Document Service                         │
│  - Thread-document linking                                   │
│  - Auto-create documents for threads                         │
│  - Document lifecycle management                             │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                Storage Manager                               │
│  - Retry logic with exponential backoff                      │
│  - Auto-save queue management                                │
│  - Multiple backend support with fallback                    │
│  - Error recovery and logging                                │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
┌────────▼────────┐    ┌────────▼────────┐
│  IndexedDB      │    │  Backend API    │
│  Adapter        │    │  Adapter        │
│  (Primary)      │    │  (Future)       │
└─────────────────┘    └─────────────────┘
```

### Key Features

1. **No localStorage** - All data stored in IndexedDB for better performance and capacity
2. **Thread-Document Association** - Each chat thread has its own persistent document
3. **Auto-save** - Debounced auto-save with queue management
4. **Retry Logic** - Automatic retry with exponential backoff for failed operations
5. **Migration** - Automatic migration from old localStorage system
6. **Type Safety** - Full TypeScript coverage with comprehensive interfaces
7. **Error Handling** - Detailed error codes and recovery strategies
8. **Logging** - Production-grade logging with multiple levels

## File Structure

```
src/lib/storage/
├── types.ts                      # Core TypeScript types and interfaces
├── logger.ts                     # Production logging system
├── storage-manager.ts            # Main storage orchestrator
├── thread-document-service.ts   # Thread-document association logic
├── migration.ts                  # localStorage → IndexedDB migration
├── index.ts                      # Public API exports
└── adapters/
    └── indexeddb-adapter.ts     # IndexedDB implementation

src/lib/
└── storage-system-singleton.ts  # Global storage instance

src/hooks/
└── useThreadDocument.ts         # React hook for document management
```

## Usage

### Basic Setup

```typescript
import { getStorageSystem } from '@/lib/storage-system-singleton';

// Initialize storage (done automatically in app)
const { storageManager, threadDocumentService } = await getStorageSystem({
  primaryBackend: 'indexeddb',
  autoSave: true,
  autoSaveInterval: 30000, // 30 seconds
  enableLogging: true,
});
```

### Using in React Components

```typescript
import { useThreadDocument } from '@/hooks/useThreadDocument';

function MyComponent({ threadId }: { threadId: string }) {
  const {
    document,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    updateContent,
    save,
  } = useThreadDocument({
    threadId,
    documentType: 'blocksuite',
    autoSave: true,
    autoSaveDelay: 2000,
  });

  // Update document content
  const handleChange = (newContent: any) => {
    updateContent(newContent);
  };

  // Manual save
  const handleSave = async () => {
    await save();
  };

  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {isSaving && <div>Saving...</div>}
      {hasUnsavedChanges && <div>Unsaved changes</div>}
      {/* Your editor component */}
    </div>
  );
}
```

### Direct Storage Operations

```typescript
import { getStorageSystem } from '@/lib/storage-system-singleton';

// Save a document
const { storageManager } = await getStorageSystem();
const result = await storageManager.save({
  metadata: {
    id: 'doc-123',
    threadId: 'thread-456',
    title: 'My Document',
    type: 'blocksuite',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
  },
  content: { /* your content */ },
});

if (result.success) {
  console.log('Saved:', result.data);
} else {
  console.error('Error:', result.error);
}

// Load a document
const loadResult = await storageManager.load('doc-123');

// List documents
const listResult = await storageManager.list({
  threadId: 'thread-456',
  type: 'blocksuite',
});

// Get storage stats
const stats = await storageManager.getStats();
console.log(`Using ${stats.bytesUsed} bytes`);
```

### Thread-Document Association

```typescript
import { getStorageSystem } from '@/lib/storage-system-singleton';

const { threadDocumentService } = await getStorageSystem();

// Get or create document for thread
const result = await threadDocumentService.getDocumentForThread('thread-123', {
  createIfMissing: true,
  documentType: 'blocksuite',
});

// Link existing document to thread
await threadDocumentService.linkDocumentToThread('thread-123', 'doc-456');

// Get all links
const links = await threadDocumentService.getAllLinks();
```

## Migration

The system automatically migrates data from localStorage to IndexedDB on first load.

### Manual Migration

```typescript
import { migrateFromLocalStorage, needsMigration } from '@/lib/storage/migration';
import { getStorageSystem } from '@/lib/storage-system-singleton';

if (needsMigration()) {
  const { storageManager } = await getStorageSystem();
  
  const result = await migrateFromLocalStorage(storageManager, {
    deleteAfterMigration: true, // Remove from localStorage after migration
    dryRun: false, // Set to true to test without migrating
  });

  console.log(`Migrated ${result.migratedCount} documents`);
  console.log(`Failed: ${result.failedCount}`);
}
```

### Backup Before Migration

```typescript
import { backupLocalStorage } from '@/lib/storage/migration';

// Downloads a JSON backup file
backupLocalStorage();
```

## Error Handling

All storage operations return a `StorageResult<T>` with detailed error information:

```typescript
interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: StorageError;
  metadata?: {
    duration: number;
    backend: StorageBackend;
    retries?: number;
  };
}

interface StorageError {
  code: StorageErrorCode;
  message: string;
  originalError?: Error;
  timestamp: number;
  retryable: boolean;
  context?: Record<string, unknown>;
}
```

### Error Codes

- `CONNECTION_FAILED` - Network or database connection failed
- `TIMEOUT` - Operation timed out
- `NOT_FOUND` - Document not found
- `ALREADY_EXISTS` - Document already exists
- `INVALID_DATA` - Data validation failed
- `QUOTA_EXCEEDED` - Storage quota exceeded
- `VERSION_CONFLICT` - Concurrent modification detected
- `STORAGE_UNAVAILABLE` - Storage backend unavailable
- `UNKNOWN_ERROR` - Unexpected error

## Performance Considerations

### Auto-save Queue

The storage manager uses a priority queue for auto-save operations:

```typescript
storageManager.queueSave(document, {
  priority: 10, // Higher = more urgent
  onSuccess: (result) => console.log('Saved!'),
  onError: (error) => console.error('Failed:', error),
});
```

### Debouncing

The `useThreadDocument` hook automatically debounces updates:

```typescript
const { updateContent } = useThreadDocument({
  threadId: 'thread-123',
  autoSaveDelay: 2000, // Wait 2s after last change before saving
});
```

### Batch Operations

For bulk operations, use the storage manager directly:

```typescript
const documents = [doc1, doc2, doc3];

for (const doc of documents) {
  storageManager.queueSave(doc, { priority: 5 });
}

// Flush all pending saves
await storageManager.flush();
```

## Monitoring

### Storage Statistics

```typescript
const stats = await storageManager.getStats();

console.log({
  documentCount: stats.documentCount,
  bytesUsed: stats.bytesUsed,
  bytesAvailable: stats.bytesAvailable,
  usagePercentage: stats.usagePercentage,
});
```

### Logging

Configure logging level:

```typescript
import { createLogger, LogLevel } from '@/lib/storage/logger';

const logger = createLogger({
  enabled: true,
  minLevel: LogLevel.DEBUG, // DEBUG, INFO, WARN, ERROR
  prefix: '[MyApp]',
});
```

## Testing

### Reset Storage (for testing)

```typescript
import { resetStorageSystem } from '@/lib/storage-system-singleton';

// Clear and reset storage
await resetStorageSystem();
```

### Mock Storage

```typescript
import { StorageManager } from '@/lib/storage';

const mockStorage = new StorageManager({
  primaryBackend: 'memory', // Use in-memory storage for tests
  enableLogging: false,
});
```

## Future Enhancements

1. **Backend API Adapter** - Server-side storage with sync
2. **Conflict Resolution** - Automatic merge strategies
3. **Compression** - Compress large documents
4. **Encryption** - Client-side encryption for sensitive data
5. **Offline Support** - Queue operations when offline
6. **Real-time Sync** - WebSocket-based multi-device sync

## Troubleshooting

### Storage Quota Exceeded

```typescript
const stats = await storageManager.getStats();

if (stats.usagePercentage && stats.usagePercentage > 90) {
  // Clean up old documents
  const oldDocs = await storageManager.list({
    dateRange: {
      from: 0,
      to: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
    },
  });

  for (const doc of oldDocs.data || []) {
    await storageManager.delete(doc.id);
  }
}
```

### Migration Issues

```typescript
import { getMigrationStats } from '@/lib/storage/migration';

const stats = getMigrationStats();
console.log(`Found ${stats.documentCount} documents to migrate`);
console.log(`Estimated size: ${stats.estimatedSize} bytes`);
```

## Security Considerations

1. **No Sensitive Data in Logs** - Logger filters sensitive information
2. **Input Validation** - All data validated before storage
3. **Quota Management** - Prevents storage exhaustion attacks
4. **Error Sanitization** - Error messages don't leak system details

## License

This storage system is part of the BlockSuite application and follows the same license.

