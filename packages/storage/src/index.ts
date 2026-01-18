/**
 * @seashorelab/storage
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
} from './types';

// Database
export { createDatabase, type DrizzleDB } from './database';
export { sql, eq, and, or, desc, asc, gt, gte, lt, lte, isNull, isNotNull } from './database';

// Schema
export { threads, messages, traces, sessions } from './schema/index';

// Repositories
export {
  createThreadRepository,
  createMessageRepository,
  createTraceRepository,
  type ThreadRepository,
  type MessageRepository,
  type TraceRepository,
} from './repositories/index';

// Middleware
export {
  createPersistenceMiddleware,
  createAutoPersistedMessageHandler,
  type PersistenceMiddleware,
  type PersistenceMiddlewareConfig,
  type MessageEvent,
  type MessageEventType,
  type TraceEvent,
} from './middleware';

// Query Builder
export {
  ThreadQueryBuilder,
  MessageQueryBuilder,
  TraceQueryBuilder,
  createQueryBuilders,
  queryThreads,
  queryMessages,
  queryTraces,
  type ThreadQueryOptions,
  type MessageQueryOptions,
  type TraceQueryOptions,
  type DateRangeFilter,
} from './query-builder';
