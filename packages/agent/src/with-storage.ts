/**
 * @seashore/agent - Storage Integration
 *
 * Wrapper to add persistent storage to agents
 */

import type { Message as LLMMessage } from '@seashore/llm';
import type { Message, Thread, ThreadRepository, MessageRepository } from '@seashore/storage';
import type { Agent, AgentConfig, AgentRunResult, AgentStreamChunk, RunOptions } from './types';

/**
 * Storage-aware run options
 */
export interface StorageRunOptions extends RunOptions {
  /**
   * Thread ID for conversation persistence
   * If not provided, a new thread will be created
   */
  readonly threadId?: string;

  /**
   * Thread title for new threads
   */
  readonly threadTitle?: string;

  /**
   * Whether to load previous messages from storage
   */
  readonly loadHistory?: boolean;

  /**
   * Maximum messages to load from history
   */
  readonly maxHistoryMessages?: number;
}

/**
 * Storage integration configuration
 */
export interface WithStorageConfig {
  /**
   * Thread repository
   */
  readonly threads: ThreadRepository;

  /**
   * Message repository
   */
  readonly messages: MessageRepository;

  /**
   * Default agent ID
   */
  readonly agentId: string;

  /**
   * Auto-persist messages
   */
  readonly autoPersist?: boolean;

  /**
   * Auto-load history when thread exists
   */
  readonly autoLoadHistory?: boolean;

  /**
   * Maximum history messages
   */
  readonly maxHistoryMessages?: number;
}

/**
 * Agent with storage capabilities
 */
export interface AgentWithStorage<
  TTools extends readonly unknown[] = readonly unknown[],
> extends Agent<TTools> {
  /**
   * Run with storage integration
   */
  runWithStorage(input: string, options?: StorageRunOptions): Promise<AgentRunResult>;

  /**
   * Stream with storage integration
   */
  streamWithStorage(input: string, options?: StorageRunOptions): AsyncIterable<AgentStreamChunk>;

  /**
   * Get or create thread
   */
  getOrCreateThread(options: {
    threadId?: string;
    userId?: string;
    title?: string;
  }): Promise<Thread>;

  /**
   * Load thread history
   */
  loadThreadHistory(threadId: string, limit?: number): Promise<readonly Message[]>;

  /**
   * Get storage configuration
   */
  readonly storage: WithStorageConfig;
}

/**
 * Convert storage message to LLM message
 */
function toMessage(message: Message): LLMMessage {
  if (message.role === 'tool') {
    return {
      role: 'tool',
      content: message.content ?? '',
      toolCallId: message.toolCallId ?? undefined,
    };
  }

  return {
    role: message.role as 'user' | 'assistant' | 'system',
    content: message.content ?? '',
  };
}

/**
 * Add storage integration to an agent
 *
 * @example
 * ```typescript
 * import { createAgent, withStorage } from '@seashore/agent';
 * import { createDatabase, createThreadRepository, createMessageRepository } from '@seashore/storage';
 *
 * const db = createDatabase({ connectionString: process.env.DATABASE_URL! });
 * const agent = createAgent({
 *   name: 'Assistant',
 *   systemPrompt: 'You are helpful.',
 *   model: openaiText('gpt-4o'),
 * });
 *
 * const persistentAgent = withStorage(agent, {
 *   threads: createThreadRepository(db.db),
 *   messages: createMessageRepository(db.db),
 *   agentId: 'assistant-v1',
 *   autoPersist: true,
 * });
 *
 * // Run with automatic persistence
 * const result = await persistentAgent.runWithStorage('Hello!', {
 *   threadId: 'existing-thread-id',
 *   loadHistory: true,
 * });
 * ```
 */
export function withStorage<TTools extends readonly unknown[] = readonly unknown[]>(
  agent: Agent<TTools>,
  config: WithStorageConfig
): AgentWithStorage<TTools> {
  const {
    threads,
    messages,
    agentId,
    autoPersist = true,
    autoLoadHistory = true,
    maxHistoryMessages = 50,
  } = config;

  // Create enhanced agent
  const enhancedAgent = Object.create(agent) as AgentWithStorage<TTools>;

  enhancedAgent.storage = config;

  enhancedAgent.getOrCreateThread = async (options) => {
    const { threadId, userId, title } = options;

    // Try to find existing thread
    if (threadId) {
      const existing = await threads.findById(threadId);
      if (existing) {
        return existing;
      }
    }

    // Create new thread
    return threads.create({
      agentId,
      userId,
      title: title ?? `Conversation ${new Date().toLocaleString()}`,
    });
  };

  enhancedAgent.loadThreadHistory = async (threadId, limit = maxHistoryMessages) => {
    return messages.findByThreadId(threadId, {
      limit,
      order: 'asc',
    });
  };

  enhancedAgent.runWithStorage = async (input, options = {}) => {
    const {
      threadId: requestedThreadId,
      userId,
      threadTitle,
      loadHistory = autoLoadHistory,
      maxHistoryMessages: maxHistory = maxHistoryMessages,
      ...runOptions
    } = options;

    // Get or create thread
    const thread = await enhancedAgent.getOrCreateThread({
      threadId: requestedThreadId,
      userId,
      title: threadTitle,
    });

    // Load history if enabled
    let historyMessages: readonly LLMMessage[] = [];
    if (loadHistory) {
      const storedMessages = await enhancedAgent.loadThreadHistory(thread.id, maxHistory);
      historyMessages = storedMessages.map(toMessage);
    }

    // Persist user message
    if (autoPersist) {
      await messages.create({
        threadId: thread.id,
        role: 'user',
        content: input,
      });
    }

    // Run agent with history context
    const result = await agent.run(input, {
      ...runOptions,
      threadId: thread.id,
    });

    // Persist assistant response
    if (autoPersist && result.content) {
      await messages.create({
        threadId: thread.id,
        role: 'assistant',
        content: result.content,
      });
    }

    // Persist tool calls if any
    if (autoPersist && result.toolCalls.length > 0) {
      for (const toolCall of result.toolCalls) {
        await messages.create({
          threadId: thread.id,
          role: 'tool',
          content: JSON.stringify(toolCall.result),
          toolCallId: toolCall.id,
          name: toolCall.name,
        });
      }
    }

    return result;
  };

  enhancedAgent.streamWithStorage = async function* (input, options = {}) {
    const {
      threadId: requestedThreadId,
      userId,
      threadTitle,
      loadHistory = autoLoadHistory,
      maxHistoryMessages: maxHistory = maxHistoryMessages,
      ...runOptions
    } = options;

    // Get or create thread
    const thread = await enhancedAgent.getOrCreateThread({
      threadId: requestedThreadId,
      userId,
      title: threadTitle,
    });

    // Persist user message
    if (autoPersist) {
      await messages.create({
        threadId: thread.id,
        role: 'user',
        content: input,
      });
    }

    // Collect response for persistence
    let fullContent = '';
    const toolCalls: { id: string; name: string; result: unknown }[] = [];

    // Stream agent response
    for await (const chunk of agent.stream(input, {
      ...runOptions,
      threadId: thread.id,
    })) {
      yield chunk;

      // Collect content
      if (chunk.type === 'content' && chunk.delta) {
        fullContent += chunk.delta;
      }

      // Collect tool results
      if (chunk.type === 'tool-result' && chunk.toolCall && chunk.toolResult) {
        toolCalls.push({
          id: chunk.toolCall.id,
          name: chunk.toolCall.name,
          result: chunk.toolResult,
        });
      }
    }

    // Persist collected response
    if (autoPersist && fullContent) {
      await messages.create({
        threadId: thread.id,
        role: 'assistant',
        content: fullContent,
      });
    }

    // Persist tool calls
    if (autoPersist && toolCalls.length > 0) {
      for (const toolCall of toolCalls) {
        await messages.create({
          threadId: thread.id,
          role: 'tool',
          content: JSON.stringify(toolCall.result),
          toolCallId: toolCall.id,
          name: toolCall.name,
        });
      }
    }
  };

  return enhancedAgent;
}
