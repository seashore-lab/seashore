/**
 * @seashore/agent - Thread Continuation
 *
 * Support for continuing conversations across threads
 */

import type { Message as LLMMessage } from '@seashore/llm';
import type { Message, Thread, ThreadRepository, MessageRepository } from '@seashore/storage';
import type { Agent, AgentRunResult, AgentStreamChunk, RunOptions } from './types.js';

/**
 * Thread continuation options
 */
export interface ThreadContinuationOptions extends RunOptions {
  /**
   * Number of recent messages to include
   */
  readonly messageLimit?: number;

  /**
   * Whether to include tool messages
   */
  readonly includeToolMessages?: boolean;

  /**
   * Custom message filter
   */
  readonly messageFilter?: (message: Message) => boolean;
}

/**
 * Thread context for an agent
 */
export interface ThreadContext {
  /**
   * Thread information
   */
  readonly thread: Thread;

  /**
   * Message history
   */
  readonly messages: readonly Message[];

  /**
   * Get messages formatted for LLM
   */
  toLLMMessages(): readonly LLMMessage[];

  /**
   * Get summary of the thread
   */
  getSummary(): string;
}

/**
 * Thread manager for conversation continuity
 */
export interface ThreadManager {
  /**
   * Get or create a thread
   */
  getOrCreateThread(options: {
    threadId?: string;
    agentId: string;
    userId?: string;
    title?: string;
  }): Promise<Thread>;

  /**
   * Load thread context
   */
  loadContext(threadId: string, options?: ThreadContinuationOptions): Promise<ThreadContext>;

  /**
   * Save message to thread
   */
  saveMessage(
    threadId: string,
    message: {
      role: 'user' | 'assistant' | 'tool' | 'system';
      content: string;
      toolCallId?: string;
      name?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<Message>;

  /**
   * List user's threads
   */
  listThreads(
    userId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<readonly Thread[]>;

  /**
   * Delete a thread
   */
  deleteThread(threadId: string): Promise<boolean>;

  /**
   * Fork a thread (create a new thread with same history)
   */
  forkThread(
    threadId: string,
    options?: {
      title?: string;
      messageLimit?: number;
    }
  ): Promise<Thread>;
}

/**
 * Convert storage message to LLM format
 */
function toLLMMessage(message: Message): LLMMessage {
  if (message.role === 'tool') {
    return {
      role: 'tool',
      content: message.content ?? '',
      tool_call_id: message.toolCallId ?? undefined,
    };
  }

  return {
    role: message.role as 'user' | 'assistant' | 'system',
    content: message.content ?? '',
  };
}

/**
 * Create a thread context
 */
function createThreadContext(thread: Thread, messages: readonly Message[]): ThreadContext {
  return {
    thread,
    messages,

    toLLMMessages() {
      return messages.map(toLLMMessage);
    },

    getSummary() {
      const userMessages = messages.filter((m) => m.role === 'user');
      const assistantMessages = messages.filter((m) => m.role === 'assistant');

      return [
        `Thread: ${thread.title ?? thread.id}`,
        `Created: ${thread.createdAt.toLocaleString()}`,
        `Messages: ${messages.length} total (${userMessages.length} user, ${assistantMessages.length} assistant)`,
        `Last updated: ${thread.updatedAt.toLocaleString()}`,
      ].join('\n');
    },
  };
}

/**
 * Create a thread manager
 *
 * @example
 * ```typescript
 * import { createThreadManager } from '@seashore/agent';
 * import { createDatabase, createThreadRepository, createMessageRepository } from '@seashore/storage';
 *
 * const db = createDatabase({ connectionString: process.env.DATABASE_URL! });
 * const threadManager = createThreadManager(
 *   createThreadRepository(db.db),
 *   createMessageRepository(db.db)
 * );
 *
 * // Load existing thread
 * const context = await threadManager.loadContext('thread-123', {
 *   messageLimit: 20,
 * });
 *
 * // Use with agent
 * const result = await agent.chat(context.toLLMMessages(), { threadId: context.thread.id });
 * ```
 */
export function createThreadManager(
  threads: ThreadRepository,
  messages: MessageRepository
): ThreadManager {
  return {
    async getOrCreateThread(options) {
      const { threadId, agentId, userId, title } = options;

      if (threadId) {
        const existing = await threads.findById(threadId);
        if (existing) {
          return existing;
        }
      }

      return threads.create({
        agentId,
        userId,
        title: title ?? `Conversation ${new Date().toLocaleString()}`,
      });
    },

    async loadContext(threadId, options = {}) {
      const { messageLimit = 50, includeToolMessages = true, messageFilter } = options;

      // Get thread
      const thread = await threads.findById(threadId);
      if (!thread) {
        throw new Error(`Thread ${threadId} not found`);
      }

      // Load messages
      let threadMessages = await messages.findByThreadId(threadId, {
        limit: messageLimit * 2, // Load extra to account for filtering
        order: 'asc',
      });

      // Apply filters
      if (!includeToolMessages) {
        threadMessages = threadMessages.filter((m) => m.role !== 'tool');
      }

      if (messageFilter) {
        threadMessages = threadMessages.filter(messageFilter);
      }

      // Limit final result
      threadMessages = threadMessages.slice(-messageLimit);

      return createThreadContext(thread, threadMessages);
    },

    async saveMessage(threadId, message) {
      return messages.create({
        threadId,
        role: message.role,
        content: message.content,
        toolCallId: message.toolCallId,
        name: message.name,
        metadata: message.metadata,
      });
    },

    async listThreads(userId, options = {}) {
      const { limit = 20, offset = 0 } = options;
      return threads.findByUserId(userId, { limit, offset, order: 'desc' });
    },

    async deleteThread(threadId) {
      return threads.delete(threadId);
    },

    async forkThread(threadId, options = {}) {
      const { title, messageLimit = 50 } = options;

      // Load original thread
      const original = await threads.findById(threadId);
      if (!original) {
        throw new Error(`Thread ${threadId} not found`);
      }

      // Load messages
      const originalMessages = await messages.findByThreadId(threadId, {
        limit: messageLimit,
        order: 'asc',
      });

      // Create new thread
      const forkedThread = await threads.create({
        agentId: original.agentId,
        userId: original.userId ?? undefined,
        title: title ?? `Fork of ${original.title ?? original.id}`,
      });

      // Copy messages
      for (const msg of originalMessages) {
        await messages.create({
          threadId: forkedThread.id,
          role: msg.role,
          content: msg.content ?? undefined,
          toolCalls: msg.toolCalls ?? undefined,
          toolCallId: msg.toolCallId ?? undefined,
          name: msg.name ?? undefined,
          metadata: msg.metadata ?? undefined,
        });
      }

      return forkedThread;
    },
  };
}

/**
 * Continue an agent conversation in a thread
 *
 * Helper function that wraps agent execution with thread context
 */
export async function continueThread<TTools extends readonly unknown[]>(
  agent: Agent<TTools>,
  threadManager: ThreadManager,
  input: string,
  options: {
    threadId: string;
    loadHistory?: boolean;
    messageLimit?: number;
    persistMessages?: boolean;
  }
): Promise<AgentRunResult> {
  const { threadId, loadHistory = true, messageLimit = 50, persistMessages = true } = options;

  // Load context if requested
  let history: readonly LLMMessage[] = [];
  if (loadHistory) {
    const context = await threadManager.loadContext(threadId, { messageLimit });
    history = context.toLLMMessages();
  }

  // Save user message
  if (persistMessages) {
    await threadManager.saveMessage(threadId, {
      role: 'user',
      content: input,
    });
  }

  // Run agent with history
  const result = await agent.run(input, { threadId });

  // Save assistant response
  if (persistMessages && result.content) {
    await threadManager.saveMessage(threadId, {
      role: 'assistant',
      content: result.content,
    });
  }

  return result;
}

/**
 * Stream continue an agent conversation in a thread
 */
export async function* streamContinueThread<TTools extends readonly unknown[]>(
  agent: Agent<TTools>,
  threadManager: ThreadManager,
  input: string,
  options: {
    threadId: string;
    loadHistory?: boolean;
    messageLimit?: number;
    persistMessages?: boolean;
  }
): AsyncIterable<AgentStreamChunk> {
  const { threadId, loadHistory = true, messageLimit = 50, persistMessages = true } = options;

  // Load context if requested
  if (loadHistory) {
    await threadManager.loadContext(threadId, { messageLimit });
  }

  // Save user message
  if (persistMessages) {
    await threadManager.saveMessage(threadId, {
      role: 'user',
      content: input,
    });
  }

  // Collect response
  let fullContent = '';

  // Stream agent response
  for await (const chunk of agent.stream(input, { threadId })) {
    yield chunk;

    if (chunk.type === 'content' && chunk.delta) {
      fullContent += chunk.delta;
    }
  }

  // Save assistant response
  if (persistMessages && fullContent) {
    await threadManager.saveMessage(threadId, {
      role: 'assistant',
      content: fullContent,
    });
  }
}
