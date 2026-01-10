/**
 * @seashore/memory
 *
 * Memory management for seashore agents
 * Short-term and long-term memory with vector search
 */

// Types
export type {
  MemoryType,
  MemoryEntry,
  NewMemoryEntry,
  MemoryQueryOptions,
  SemanticSearchOptions,
  MemoryStore,
  MemoryStats,
  ShortTermMemoryConfig,
  LongTermMemoryConfig,
  MemoryManagerConfig,
  MemoryManager,
  RememberOptions,
  RecallOptions,
  ContextOptions,
  ConsolidationResult,
  ImportanceEvaluator,
  WithMemoryOptions,
} from './types';

// Schema
export {
  memories,
  memorySummaries,
  memoryFacts,
  memoriesRelations,
  memorySummariesRelations,
  memoryFactsRelations,
  type Memory,
  type NewMemory,
  type MemorySummary,
  type NewMemorySummary,
  type MemoryFact,
  type NewMemoryFact,
} from './schema';

// Short-term memory
export { ShortTermMemory, createShortTermMemory } from './short-term';

// Long-term memory
export { LongTermMemory, createLongTermMemory } from './long-term';

// Memory manager
export { createMemoryManager, createStandaloneMemoryManager } from './manager';

// Consolidation utilities
export {
  mergeMemories,
  calculateSimilarity,
  deduplicateMemories,
  groupByThread,
  groupByTimeWindow,
  extractKeyPoints,
  generateBasicSummary,
  createConsolidationPipeline,
  type SummarizeFn,
  type ConsolidationStrategy,
  type ConsolidationOptions,
} from './consolidation';

// Importance evaluation
export {
  detectSignals,
  calculateImportance,
  defaultImportanceEvaluator,
  createImportanceEvaluator,
  createHybridEvaluator,
  parseImportanceResponse,
  IMPORTANCE_PROMPT_TEMPLATE,
  type ImportanceSignals,
} from './importance';

// Agent integration
export {
  withMemory,
  createMemorySystemPrompt,
  createMemoryProcessor,
  createMemoryMiddleware,
  type MemoryEnhancedMessage,
  type AgentWithMemory,
  type MemoryMiddleware,
} from './agent-integration';
