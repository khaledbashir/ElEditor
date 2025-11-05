/**
 * @file migration.ts
 * @description Migration utilities for moving from localStorage to IndexedDB
 * 
 * This module provides safe migration of existing BlockSuite documents
 * from localStorage to the new IndexedDB storage system.
 */

import { StorageManager } from './storage-manager';
import { Document, DocumentMetadata, Logger } from './types';
import { createLogger } from './logger';

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  failedCount: number;
  errors: Array<{ key: string; error: string }>;
  duration: number;
}

export interface LocalStorageDocument {
  id: string;
  title: string;
  data: any;
  timestamp: number;
}

/**
 * Migrate documents from localStorage to IndexedDB
 */
export async function migrateFromLocalStorage(
  storageManager: StorageManager,
  options?: {
    logger?: Logger;
    deleteAfterMigration?: boolean;
    dryRun?: boolean;
  }
): Promise<MigrationResult> {
  const logger = options?.logger || createLogger({ prefix: '[Migration]' });
  const startTime = performance.now();
  
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    failedCount: 0,
    errors: [],
    duration: 0,
  };

  try {
    logger.info('Starting localStorage migration', {
      dryRun: options?.dryRun ?? false,
    });

    // Find all BlockSuite documents in localStorage
    const documentsToMigrate: Array<{ key: string; data: LocalStorageDocument }> = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('blocksuite-')) continue;

      try {
        const rawData = localStorage.getItem(key);
        if (!rawData) continue;

        const data = JSON.parse(rawData) as LocalStorageDocument;
        documentsToMigrate.push({ key, data });
      } catch (error) {
        logger.warn('Failed to parse localStorage item', { key, error });
        result.errors.push({
          key,
          error: `Parse error: ${(error as Error).message}`,
        });
      }
    }

    logger.info(`Found ${documentsToMigrate.length} documents to migrate`);

    if (options?.dryRun) {
      logger.info('Dry run - no documents will be migrated');
      result.migratedCount = documentsToMigrate.length;
      result.duration = performance.now() - startTime;
      return result;
    }

    // Migrate each document
    for (const { key, data } of documentsToMigrate) {
      try {
        // Convert to new document format
        const document: Document = {
          metadata: {
            id: data.id,
            threadId: extractThreadIdFromKey(key) || data.id,
            title: data.title || 'Untitled',
            type: 'blocksuite',
            createdAt: data.timestamp || Date.now(),
            updatedAt: data.timestamp || Date.now(),
            version: 1,
            customData: {
              migratedFromLocalStorage: true,
              originalKey: key,
            },
          },
          content: data.data,
        };

        // Save to new storage
        const saveResult = await storageManager.save(document);

        if (saveResult.success) {
          result.migratedCount++;
          
          // Delete from localStorage if requested
          if (options?.deleteAfterMigration) {
            localStorage.removeItem(key);
            logger.debug('Deleted from localStorage', { key });
          }
        } else {
          result.failedCount++;
          result.errors.push({
            key,
            error: saveResult.error?.message || 'Unknown error',
          });
          logger.error('Failed to migrate document', undefined, {
            key,
            error: saveResult.error,
          });
        }
      } catch (error) {
        result.failedCount++;
        result.errors.push({
          key,
          error: (error as Error).message,
        });
        logger.error('Migration error', error as Error, { key });
      }
    }

    result.duration = performance.now() - startTime;
    result.success = result.failedCount === 0;

    logger.info('Migration completed', {
      migratedCount: result.migratedCount,
      failedCount: result.failedCount,
      duration: `${result.duration.toFixed(2)}ms`,
    });

    return result;
  } catch (error) {
    logger.error('Migration failed', error as Error);
    result.success = false;
    result.duration = performance.now() - startTime;
    return result;
  }
}

/**
 * Check if migration is needed
 */
export function needsMigration(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  // Check if there are any blocksuite-* keys in localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('blocksuite-')) {
      return true;
    }
  }

  return false;
}

/**
 * Get migration statistics without performing migration
 */
export function getMigrationStats(): {
  documentCount: number;
  estimatedSize: number;
  keys: string[];
} {
  const stats = {
    documentCount: 0,
    estimatedSize: 0,
    keys: [] as string[],
  };

  if (typeof window === 'undefined' || !window.localStorage) {
    return stats;
  }

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('blocksuite-')) continue;

    const data = localStorage.getItem(key);
    if (data) {
      stats.documentCount++;
      stats.estimatedSize += data.length * 2; // Rough estimate (UTF-16)
      stats.keys.push(key);
    }
  }

  return stats;
}

/**
 * Extract thread ID from localStorage key
 */
function extractThreadIdFromKey(key: string): string | null {
  // Key format: blocksuite-{doc-id}
  // Try to extract thread ID from doc ID if it follows a pattern
  const match = key.match(/blocksuite-(.+)/);
  if (match) {
    return match[1];
  }
  return null;
}

/**
 * Backup localStorage data to a downloadable file
 */
export function backupLocalStorage(): void {
  const backup: Record<string, any> = {};
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('blocksuite-')) continue;

    const data = localStorage.getItem(key);
    if (data) {
      try {
        backup[key] = JSON.parse(data);
      } catch {
        backup[key] = data;
      }
    }
  }

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `blocksuite-backup-${new Date().toISOString()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

