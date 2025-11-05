/**
 * @file logger.ts
 * @description Production-grade logging system with multiple levels and contexts
 */

import { Logger } from './types';

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

/**
 * Production-ready logger implementation
 */
export class ProductionLogger implements Logger {
  private minLevel: LogLevel;
  private prefix: string;

  constructor(options: { minLevel?: LogLevel; prefix?: string } = {}) {
    this.minLevel = options.minLevel ?? LogLevel.INFO;
    this.prefix = options.prefix ?? '[Storage]';
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.minLevel <= LogLevel.DEBUG) {
      console.debug(`${this.prefix} [DEBUG]`, message, context || '');
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (this.minLevel <= LogLevel.INFO) {
      console.info(`${this.prefix} [INFO]`, message, context || '');
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (this.minLevel <= LogLevel.WARN) {
      console.warn(`${this.prefix} [WARN]`, message, context || '');
    }
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    if (this.minLevel <= LogLevel.ERROR) {
      console.error(`${this.prefix} [ERROR]`, message, error || '', context || '');
    }
  }

  /**
   * Set minimum log level
   */
  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }
}

/**
 * No-op logger for production (when logging is disabled)
 */
export class NoOpLogger implements Logger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
}

/**
 * Create a logger instance
 */
export function createLogger(options?: {
  enabled?: boolean;
  minLevel?: LogLevel;
  prefix?: string;
}): Logger {
  if (options?.enabled === false) {
    return new NoOpLogger();
  }
  
  return new ProductionLogger({
    minLevel: options?.minLevel,
    prefix: options?.prefix,
  });
}

