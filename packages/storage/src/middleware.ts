/**
 * @seashorelab/storage - Automatic Persistence Middleware
 *
 * Middleware for automatic message persistence
 */

import type { DrizzleDB } from './database';
import type { MessageRepository } from './repositories/message';
import type { ThreadRepository } from './repositories/thread';
import type { TraceRepository } from './repositories/trace';
import type { Message, NewMessage, Trace, NewTrace, UpdateTrace } from './types';
import { createMessageRepository } from './repositories/message';
import { createThreadRepository } from './repositories/thread';
import { createTraceRepository } from './repositories/trace';

/**
 * Message event types
 */
export type MessageEventType = 'user' | 'assistant' | 'tool-call' | 'tool-result';

/**
 * Message event
 */
export interface MessageEvent {
  readonly type: MessageEventType;
  readonly threadId: string;
  readonly role: 'user' | 'assistant' | 'system' | 'tool';
  readonly content?: string;
  readonly toolCalls?: readonly {
    readonly id: string;
    readonly type: 'function';
    readonly function: {
      readonly name: string;
      readonly arguments: string;
    };
  }[];
  readonly toolCallId?: string;
  readonly name?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Trace event
 */
export interface TraceEvent {
  readonly traceId: string;
  readonly action: 'start' | 'end';
  readonly data: NewTrace | UpdateTrace;
}

/**
 * Persistence middleware configuration
 */
export interface PersistenceMiddlewareConfig {
  /**
   * Database connection
   */
  readonly db: DrizzleDB;

  /**
   * Auto-create threads if they don't exist
   */
  readonly autoCreateThread?: boolean;

  /**
   * Default agent ID for auto-created threads
   */
  readonly defaultAgentId?: string;

  /**
   * Enable message persistence
   */
  readonly persistMessages?: boolean;

  /**
   * Enable trace persistence
   */
  readonly persistTraces?: boolean;

  /**
   * Callback after message is persisted
   */
  readonly onMessagePersisted?: (message: Message) => void;

  /**
   * Callback after trace is persisted
   */
  readonly onTracePersisted?: (trace: Trace) => void;
}

/**
 * Persistence middleware interface
 */
export interface PersistenceMiddleware {
  /**
   * Persist a message event
   */
  persistMessage(event: MessageEvent): Promise<Message>;

  /**
   * Persist a trace event
   */
  persistTrace(event: TraceEvent): Promise<Trace>;

  /**
   * Ensure thread exists, create if needed
   */
  ensureThread(
    threadId: string,
    options?: { agentId?: string; userId?: string; title?: string }
  ): Promise<boolean>;

  /**
   * Get thread messages
   */
  getThreadMessages(threadId: string, limit?: number): Promise<readonly Message[]>;

  /**
   * Get thread traces
   */
  getThreadTraces(threadId: string, limit?: number): Promise<readonly Trace[]>;

  /**
   * Get repositories for direct access
   */
  readonly repositories: {
    readonly threads: ThreadRepository;
    readonly messages: MessageRepository;
    readonly traces: TraceRepository;
  };
}

/**
 * Create persistence middleware
 *
 * @example
 * ```typescript
 * import { createDatabase, createPersistenceMiddleware } from '@seashorelab/storage';
 *
 * const db = createDatabase({ connectionString: process.env.DATABASE_URL! });
 * const middleware = createPersistenceMiddleware({
 *   db: db.db,
 *   autoCreateThread: true,
 *   defaultAgentId: 'my-agent',
 * });
 *
 * // Auto-persist messages
 * await middleware.persistMessage({
 *   type: 'user',
 *   threadId: 'thread-123',
 *   role: 'user',
 *   content: 'Hello!',
 * });
 * ```
 */
export function createPersistenceMiddleware(
  config: PersistenceMiddlewareConfig
): PersistenceMiddleware {
  const {
    db,
    autoCreateThread = true,
    defaultAgentId = 'default',
    persistMessages = true,
    persistTraces = true,
    onMessagePersisted,
    onTracePersisted,
  } = config;

  // Create repositories
  const threads = createThreadRepository(db);
  const messages = createMessageRepository(db);
  const traces = createTraceRepository(db);

  // Track created threads to avoid duplicate lookups
  const createdThreads = new Set<string>();

  return {
    repositories: { threads, messages, traces },

    async ensureThread(
      threadId: string,
      options: { agentId?: string; userId?: string; title?: string } = {}
    ): Promise<boolean> {
      // Check cache first
      if (createdThreads.has(threadId)) {
        return false; // Already exists
      }

      // Check database
      const existing = await threads.findById(threadId);
      if (existing) {
        createdThreads.add(threadId);
        return false; // Already exists
      }

      // Create new thread
      if (autoCreateThread) {
        await threads.create({
          agentId: options.agentId ?? defaultAgentId,
          userId: options.userId,
          title: options.title,
        });
        createdThreads.add(threadId);
        return true; // Created
      }

      throw new Error(`Thread ${threadId} does not exist`);
    },

    async persistMessage(event: MessageEvent): Promise<Message> {
      if (!persistMessages) {
        throw new Error('Message persistence is disabled');
      }

      // Ensure thread exists
      await this.ensureThread(event.threadId);

      // Create message
      const newMessage: NewMessage = {
        threadId: event.threadId,
        role: event.role,
        content: event.content,
        toolCalls: event.toolCalls,
        toolCallId: event.toolCallId,
        name: event.name,
        metadata: event.metadata,
      };

      const message = await messages.create(newMessage);

      // Callback
      onMessagePersisted?.(message);

      return message;
    },

    async persistTrace(event: TraceEvent): Promise<Trace> {
      if (!persistTraces) {
        throw new Error('Trace persistence is disabled');
      }

      if (event.action === 'start') {
        const trace = await traces.create(event.data as NewTrace);
        onTracePersisted?.(trace);
        return trace;
      } else {
        const trace = await traces.update(event.traceId, event.data as UpdateTrace);
        if (!trace) {
          throw new Error(`Trace ${event.traceId} not found`);
        }
        onTracePersisted?.(trace);
        return trace;
      }
    },

    async getThreadMessages(threadId: string, limit = 50): Promise<readonly Message[]> {
      return messages.findByThreadId(threadId, { limit, order: 'asc' });
    },

    async getThreadTraces(threadId: string, limit = 50): Promise<readonly Trace[]> {
      return traces.findByThreadId(threadId, { limit, order: 'desc' });
    },
  };
}

/**
 * Create a message handler that auto-persists
 */
export function createAutoPersistedMessageHandler(middleware: PersistenceMiddleware) {
  return {
    /**
     * Handle user message
     */
    async onUserMessage(threadId: string, content: string): Promise<Message> {
      return middleware.persistMessage({
        type: 'user',
        threadId,
        role: 'user',
        content,
      });
    },

    /**
     * Handle assistant message
     */
    async onAssistantMessage(
      threadId: string,
      content: string,
      toolCalls?: MessageEvent['toolCalls']
    ): Promise<Message> {
      return middleware.persistMessage({
        type: 'assistant',
        threadId,
        role: 'assistant',
        content,
        toolCalls,
      });
    },

    /**
     * Handle tool result
     */
    async onToolResult(
      threadId: string,
      toolCallId: string,
      toolName: string,
      result: string
    ): Promise<Message> {
      return middleware.persistMessage({
        type: 'tool-result',
        threadId,
        role: 'tool',
        content: result,
        toolCallId,
        name: toolName,
      });
    },
  };
}
