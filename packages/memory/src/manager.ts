/**
 * @seashore/memory - Memory Manager
 *
 * Unified interface for managing short-term and long-term memory
 */

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { VectorStore, EmbeddingFunction } from '@seashore/vectordb';
import { ShortTermMemory, createShortTermMemory } from './short-term';
import { LongTermMemory, createLongTermMemory } from './long-term';
import { defaultImportanceEvaluator } from './importance';
import type {
  MemoryManager,
  MemoryManagerConfig,
  MemoryEntry,
  MemoryStats,
  RememberOptions,
  RecallOptions,
  ContextOptions,
  ConsolidationResult,
  ImportanceEvaluator,
} from './types';

/**
 * Default memory manager configuration
 */
const DEFAULT_CONFIG = {
  shortTerm: {
    maxEntries: 10,
  },
  longTerm: {
    maxEntries: 1000,
    importanceThreshold: 0.7,
    enableVectorSearch: true,
  },
  autoConsolidate: true,
  consolidationInterval: 300000, // 5 minutes
};

/**
 * Memory manager implementation
 */
class MemoryManagerImpl implements MemoryManager {
  private agentId: string;
  private shortTerm: ShortTermMemory;
  private longTerm: LongTermMemory;
  private embeddings?: EmbeddingFunction;
  private importanceEvaluator: ImportanceEvaluator;
  private consolidationTimer?: ReturnType<typeof setInterval>;
  private config: typeof DEFAULT_CONFIG;

  constructor(
    agentId: string,
    db: PostgresJsDatabase,
    options: {
      vectorStore?: VectorStore;
      embeddings?: EmbeddingFunction;
      shortTerm?: ShortTermMemory;
      longTerm?: LongTermMemory;
      importanceEvaluator?: ImportanceEvaluator;
      config?: Partial<typeof DEFAULT_CONFIG>;
    } = {}
  ) {
    this.agentId = agentId;
    this.config = { ...DEFAULT_CONFIG, ...options.config };
    this.embeddings = options.embeddings;

    // Initialize memory stores
    this.shortTerm = options.shortTerm ?? createShortTermMemory(this.config.shortTerm);

    this.longTerm =
      options.longTerm ??
      createLongTermMemory(db, this.config.longTerm, {
        vectorStore: options.vectorStore,
        embeddings: options.embeddings,
      });

    // Initialize importance evaluator
    this.importanceEvaluator = options.importanceEvaluator ?? defaultImportanceEvaluator;

    // Start auto-consolidation if enabled
    if (this.config.autoConsolidate) {
      this.startConsolidationTimer();
    }
  }

  /**
   * Start periodic consolidation
   */
  private startConsolidationTimer(): void {
    this.consolidationTimer = setInterval(
      () => this.consolidate().catch(console.error),
      this.config.consolidationInterval
    );
  }

  /**
   * Stop consolidation timer
   */
  public dispose(): void {
    if (this.consolidationTimer) {
      clearInterval(this.consolidationTimer);
    }
    this.shortTerm.dispose();
  }

  /**
   * Remember something (add to memory)
   */
  public async remember(content: string, options: RememberOptions = {}): Promise<MemoryEntry> {
    const { threadId, importance: overrideImportance, type, metadata } = options;

    // Calculate importance
    let importance: number;
    if (overrideImportance !== undefined) {
      importance = overrideImportance;
    } else {
      importance = await this.importanceEvaluator(content, {
        threadId,
        recentMemories: this.shortTerm.queryByAgent(this.agentId, {
          threadId,
          limit: 5,
        }),
      });
    }

    // Generate embedding for semantic search
    let embedding: readonly number[] | undefined;
    if (this.embeddings) {
      const [emb] = await this.embeddings([content]);
      embedding = emb;
    }

    const newEntry = {
      agentId: this.agentId,
      threadId,
      content,
      importance,
      embedding,
      metadata,
    };

    // Determine memory type
    let memoryType = type;
    if (!memoryType) {
      // Use importance threshold to decide between short and long-term
      if (importance >= this.config.longTerm.importanceThreshold) {
        memoryType = 'long';
      } else {
        memoryType = 'short';
      }
    }

    // Add to appropriate store
    switch (memoryType) {
      case 'long':
        return this.longTerm.add({ ...newEntry, type: 'long' });
      case 'short':
      default:
        return this.shortTerm.add({ ...newEntry, type: 'short' });
    }
  }

  /**
   * Recall memories relevant to a query
   */
  public async recall(query: string, options: RecallOptions = {}): Promise<readonly MemoryEntry[]> {
    const {
      threadId,
      types = ['short', 'long'],
      limit = 10,
      minScore = 0.5,
      includeRecent = true,
    } = options;

    const results: MemoryEntry[] = [];

    // Get recent short-term memories
    if (includeRecent && types.includes('short')) {
      const recent = this.shortTerm.queryByAgent(this.agentId, {
        threadId,
        limit: 5,
      });
      results.push(...recent);
    }

    // Semantic search in long-term memory
    if (types.includes('long')) {
      const longTermResults = await this.longTerm.search({
        agentId: this.agentId,
        threadId,
        query,
        limit: Math.ceil(limit / 2),
        minScore,
      });
      results.push(...longTermResults);
    }

    // Deduplicate and sort by importance/recency
    const seen = new Set<string>();
    const unique: MemoryEntry[] = [];

    for (const memory of results) {
      if (!seen.has(memory.id)) {
        seen.add(memory.id);
        unique.push(memory);
      }
    }

    // Sort: short-term first (for recency), then by importance
    unique.sort((a, b) => {
      if (a.type === 'short' && b.type !== 'short') return -1;
      if (a.type !== 'short' && b.type === 'short') return 1;
      return b.importance - a.importance;
    });

    return unique.slice(0, limit);
  }

  /**
   * Get conversation context for a thread
   */
  public async getContext(threadId: string, options: ContextOptions = {}): Promise<string> {
    const { maxMessages = 10, includeLongTerm = true, format = 'text' } = options;

    const memories: MemoryEntry[] = [];

    // Get short-term (recent conversation)
    const shortTerm = this.shortTerm.queryByAgent(this.agentId, {
      threadId,
      limit: maxMessages,
    });
    memories.push(...shortTerm);

    // Get relevant long-term memories if we have recent context
    if (includeLongTerm && memories.length > 0) {
      const recentContent = memories[0]?.content ?? '';
      const longTerm = await this.longTerm.search({
        agentId: this.agentId,
        query: recentContent,
        limit: 3,
        minScore: 0.6,
      });
      memories.push(...longTerm);
    }

    // Format output
    if (format === 'json') {
      return JSON.stringify(
        memories.map((m) => ({
          type: m.type,
          content: m.content,
          importance: m.importance,
        })),
        null,
        2
      );
    }

    // Text format
    const sections: string[] = [];

    const shortTermMemories = memories.filter((m) => m.type === 'short');
    if (shortTermMemories.length > 0) {
      sections.push(
        '## Recent Conversation\n' + shortTermMemories.map((m) => `- ${m.content}`).join('\n')
      );
    }

    const longTermMemories = memories.filter((m) => m.type === 'long');
    if (longTermMemories.length > 0) {
      sections.push(
        '## Relevant Knowledge\n' + longTermMemories.map((m) => `- ${m.content}`).join('\n')
      );
    }

    return sections.join('\n\n');
  }

  /**
   * Forget a specific memory
   */
  public async forget(id: string): Promise<void> {
    // Try to delete from all stores (only one will succeed)
    this.shortTerm.delete(id);
    await this.longTerm.delete(id);
  }

  /**
   * Consolidate memories (promote important short-term to long-term)
   */
  public async consolidate(): Promise<ConsolidationResult> {
    const result: ConsolidationResult = {
      promotedToMid: 0, // Deprecated, kept for compatibility
      promotedToLong: 0,
      expiredShort: 0,
      expiredMid: 0, // Deprecated, kept for compatibility
      removed: 0,
    };

    // Get candidates from short-term for promotion to long-term
    const shortCandidates = this.shortTerm.getConsolidationCandidates(
      this.agentId,
      this.config.longTerm.importanceThreshold
    );

    // Promote important short-term memories to long-term
    for (const memory of shortCandidates) {
      if (memory.importance >= this.config.longTerm.importanceThreshold) {
        await this.longTerm.add({
          agentId: memory.agentId,
          threadId: memory.threadId,
          content: memory.content,
          importance: memory.importance,
          embedding: memory.embedding,
          metadata: memory.metadata,
          type: 'long',
        });
        this.shortTerm.delete(memory.id);
        result.promotedToLong++;
      }
    }

    return result;
  }

  /**
   * Get memory statistics
   */
  public async getStats(): Promise<MemoryStats> {
    const shortStats = this.shortTerm.getStats(this.agentId);
    const longStats = await this.longTerm.getStats(this.agentId);

    const totalCount = shortStats.count + longStats.count;
    const totalImportance =
      shortStats.avgImportance * shortStats.count + longStats.avgImportance * longStats.count;

    return {
      totalCount,
      byType: {
        short: shortStats.count,
        long: longStats.count,
      },
      avgImportance: totalCount > 0 ? totalImportance / totalCount : 0,
      oldestMemory: longStats.oldestMemory,
      newestMemory: longStats.newestMemory,
    };
  }

  /**
   * Clear all memories
   */
  public async clear(): Promise<void> {
    this.shortTerm.clear(this.agentId);
    await this.longTerm.clear(this.agentId);
  }
}

/**
 * Create a memory manager
 */
export async function createMemoryManager(config: MemoryManagerConfig): Promise<MemoryManager> {
  const {
    agentId,
    store,
    embeddings,
    shortTerm,
    longTerm,
    autoConsolidate,
    consolidationInterval,
  } = config;

  // Get database from store if available
  // Note: In a real implementation, store would expose the db
  const db = (store as unknown as { db: PostgresJsDatabase }).db;

  if (!db) {
    throw new Error('Memory store must provide database access');
  }

  return new MemoryManagerImpl(agentId, db, {
    embeddings,
    config: {
      shortTerm: {
        maxEntries: shortTerm?.maxEntries ?? DEFAULT_CONFIG.shortTerm.maxEntries,
      },
      longTerm: {
        maxEntries: longTerm?.maxEntries ?? DEFAULT_CONFIG.longTerm.maxEntries,
        importanceThreshold:
          longTerm?.importanceThreshold ?? DEFAULT_CONFIG.longTerm.importanceThreshold,
        enableVectorSearch:
          longTerm?.enableVectorSearch ?? DEFAULT_CONFIG.longTerm.enableVectorSearch,
      },
      autoConsolidate: autoConsolidate ?? DEFAULT_CONFIG.autoConsolidate,
      consolidationInterval: consolidationInterval ?? DEFAULT_CONFIG.consolidationInterval,
    },
  });
}

/**
 * Create a standalone memory manager (without existing store)
 */
export function createStandaloneMemoryManager(
  agentId: string,
  db: PostgresJsDatabase,
  options?: {
    vectorStore?: VectorStore;
    embeddings?: EmbeddingFunction;
    importanceEvaluator?: ImportanceEvaluator;
    config?: Partial<typeof DEFAULT_CONFIG>;
  }
): MemoryManager {
  return new MemoryManagerImpl(agentId, db, options);
}
