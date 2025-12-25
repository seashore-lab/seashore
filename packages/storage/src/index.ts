/**
 * @seashore/storage
 *
 * PostgreSQL storage layer with Drizzle ORM for Seashore Agent Framework
 */

// Types
export type {
  Thread,
  NewThread,
  UpdateThread,
  Message,
  NewMessage,
  MessageRole,
  ToolCall,
  Trace,
  NewTrace,
  UpdateTrace,
  TraceType,
  TokenUsage,
  Session,
  NewSession,
  Database,
  DatabaseConfig,
  ListOptions,
  PaginationOptions,
} from './types.js';

// Database
export { createDatabase, type DrizzleDB } from './database.js';
export { sql, eq, and, or, desc, asc, gt, gte, lt, lte, isNull, isNotNull } from './database.js';

// Schema
export { threads, messages, traces, sessions } from './schema/index.js';

// Repositories
export {
  createThreadRepository,
  createMessageRepository,
  createTraceRepository,
  type ThreadRepository,
  type MessageRepository,
  type TraceRepository,
} from './repositories/index.js';
