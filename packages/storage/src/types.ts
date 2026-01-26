/**
 * @seashorelab/storage - Types
 *
 * Type definitions for storage entities
 */

/**
 * Thread entity - represents a conversation session
 */
export interface Thread {
  id: string;
  title: string | null;
  agentId: string;
  userId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * New thread creation input
 */
export type NewThread = Required<Pick<Thread, 'agentId'>> &
  Partial<Pick<Thread, 'title' | 'userId' | 'metadata'>>;

/**
 * Thread update input
 */
export interface UpdateThread {
  title?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Message role
 */
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

/**
 * Tool call within a message
 */
export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * Message entity
 */
export interface Message {
  id: string;
  threadId: string;
  role: MessageRole;
  content: string | null;
  toolCalls: ToolCall[] | null;
  toolCallId: string | null;
  name: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

/**
 * New message creation input
 */
export type NewMessage = Required<Pick<Message, 'threadId' | 'role'>> &
  Partial<Pick<Message, 'content' | 'toolCalls' | 'toolCallId' | 'name' | 'metadata'>>;

/**
 * Trace type
 */
export type TraceType = 'agent' | 'tool' | 'llm' | 'retriever' | 'embedding' | 'chain';

/**
 * Token usage statistics
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Trace entity - for observability
 */
export interface Trace {
  id: string;
  threadId: string | null;
  parentId: string | null;
  name: string;
  type: TraceType;
  input: unknown;
  output: unknown;
  error: string | null;
  tokenUsage: TokenUsage | null;
  durationMs: number | null;
  startedAt: Date;
  endedAt: Date | null;
}

/**
 * New trace creation input
 */
export type NewTrace = Required<Pick<Trace, 'name' | 'type'>> &
  Partial<Pick<Trace, 'threadId' | 'parentId' | 'input' | 'startedAt'>>;

/**
 * Trace update input
 */
export interface UpdateTrace {
  output?: unknown;
  error?: string;
  tokenUsage?: TokenUsage;
  durationMs?: number;
  endedAt?: Date;
}

/**
 * Session entity
 */
export interface Session {
  id: string;
  userId: string;
  metadata: Record<string, unknown> | null;
  expiresAt: Date | null;
  createdAt: Date;
}

/**
 * New session creation input
 */
export interface NewSession {
  userId: string;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

/**
 * List options with ordering
 */
export interface ListOptions extends PaginationOptions {
  orderBy?: string;
  order?: 'asc' | 'desc';
}

/**
 * Database configuration
 */
export interface DatabaseConfig {
  /** PostgreSQL connection string */
  connectionString: string;

  /** Maximum number of connections in the pool */
  maxConnections?: number;

  /** Enable SSL */
  ssl?: boolean;
}

/**
 * Database interface
 */
export interface Database {
  /** Get the underlying Drizzle database instance */
  db: unknown;

  /** Check database connection health */
  healthCheck(): Promise<boolean>;

  /** Close all connections */
  close(): Promise<void>;
}
