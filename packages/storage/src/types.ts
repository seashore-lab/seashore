/**
 * @seashore/storage - Types
 *
 * Type definitions for storage entities
 */

/**
 * Thread entity - represents a conversation session
 */
export interface Thread {
  readonly id: string;
  readonly title: string | null;
  readonly agentId: string;
  readonly userId: string | null;
  readonly metadata: Record<string, unknown> | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * New thread creation input
 */
export interface NewThread {
  readonly agentId: string;
  readonly title?: string;
  readonly userId?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Thread update input
 */
export interface UpdateThread {
  readonly title?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Message role
 */
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

/**
 * Tool call within a message
 */
export interface ToolCall {
  readonly id: string;
  readonly type: 'function';
  readonly function: {
    readonly name: string;
    readonly arguments: string;
  };
}

/**
 * Message entity
 */
export interface Message {
  readonly id: string;
  readonly threadId: string;
  readonly role: MessageRole;
  readonly content: string | null;
  readonly toolCalls: readonly ToolCall[] | null;
  readonly toolCallId: string | null;
  readonly name: string | null;
  readonly metadata: Record<string, unknown> | null;
  readonly createdAt: Date;
}

/**
 * New message creation input
 */
export interface NewMessage {
  readonly threadId: string;
  readonly role: MessageRole;
  readonly content?: string;
  readonly toolCalls?: readonly ToolCall[];
  readonly toolCallId?: string;
  readonly name?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Trace type
 */
export type TraceType = 'agent' | 'tool' | 'llm' | 'retriever' | 'embedding' | 'chain';

/**
 * Token usage statistics
 */
export interface TokenUsage {
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
}

/**
 * Trace entity - for observability
 */
export interface Trace {
  readonly id: string;
  readonly threadId: string | null;
  readonly parentId: string | null;
  readonly name: string;
  readonly type: TraceType;
  readonly input: unknown;
  readonly output: unknown;
  readonly error: string | null;
  readonly tokenUsage: TokenUsage | null;
  readonly durationMs: number | null;
  readonly startedAt: Date;
  readonly endedAt: Date | null;
}

/**
 * New trace creation input
 */
export interface NewTrace {
  readonly threadId?: string;
  readonly parentId?: string;
  readonly name: string;
  readonly type: TraceType;
  readonly input?: unknown;
  readonly startedAt?: Date;
}

/**
 * Trace update input
 */
export interface UpdateTrace {
  readonly output?: unknown;
  readonly error?: string;
  readonly tokenUsage?: TokenUsage;
  readonly durationMs?: number;
  readonly endedAt?: Date;
}

/**
 * Session entity
 */
export interface Session {
  readonly id: string;
  readonly userId: string;
  readonly metadata: Record<string, unknown> | null;
  readonly expiresAt: Date | null;
  readonly createdAt: Date;
}

/**
 * New session creation input
 */
export interface NewSession {
  readonly userId: string;
  readonly metadata?: Record<string, unknown>;
  readonly expiresAt?: Date;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * List options with ordering
 */
export interface ListOptions extends PaginationOptions {
  readonly orderBy?: string;
  readonly order?: 'asc' | 'desc';
}

/**
 * Database configuration
 */
export interface DatabaseConfig {
  /** PostgreSQL connection string */
  readonly connectionString: string;

  /** Maximum number of connections in the pool */
  readonly maxConnections?: number;

  /** Enable SSL (recommended for production) */
  readonly ssl?: boolean;
}

/**
 * Database interface
 */
export interface Database {
  /** Get the underlying Drizzle database instance */
  readonly db: unknown;

  /** Check database connection health */
  healthCheck(): Promise<boolean>;

  /** Close all connections */
  close(): Promise<void>;
}
