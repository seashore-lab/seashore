/**
 * @seashore/memory - 记忆系统接口契约
 *
 * 支持短期、中期、长期记忆
 * 基于 PostgreSQL 存储，支持 TTL 和压缩
 */

// ============================================================================
// Memory Types
// ============================================================================

/**
 * 记忆类型
 */
export type MemoryType = 'short' | 'mid' | 'long'

/**
 * 记忆条目
 */
export interface MemoryEntry {
  id: string
  threadId: string
  type: MemoryType
  key: string
  value: unknown
  embedding?: number[]
  importance: number // 0-1
  accessCount: number
  createdAt: Date
  updatedAt: Date
  expiresAt?: Date
  metadata?: Record<string, unknown>
}

/**
 * 记忆条目输入
 */
export interface MemoryEntryInput {
  key: string
  value: unknown
  type?: MemoryType
  importance?: number
  ttl?: number // 毫秒
  metadata?: Record<string, unknown>
}

// ============================================================================
// Memory Configuration
// ============================================================================

/**
 * 记忆配置
 */
export interface MemoryConfig {
  /**
   * 存储后端
   */
  storage: unknown // Storage from @seashore/storage

  /**
   * 向量存储 (可选，用于语义检索)
   */
  vectorStore?: unknown // VectorStore from @seashore/vectordb

  /**
   * 嵌入客户端 (可选)
   */
  embeddingClient?: unknown // EmbeddingClient from @seashore/rag

  /**
   * 短期记忆 TTL (毫秒)
   * 默认: 1 小时
   */
  shortTermTTL?: number

  /**
   * 中期记忆 TTL (毫秒)
   * 默认: 24 小时
   */
  midTermTTL?: number

  /**
   * 长期记忆 TTL (毫秒)
   * 默认: 无限
   */
  longTermTTL?: number

  /**
   * 最大短期记忆数量
   */
  maxShortTermEntries?: number

  /**
   * 最大中期记忆数量
   */
  maxMidTermEntries?: number

  /**
   * 压缩配置
   */
  compression?: CompressionConfig
}

/**
 * 压缩配置
 */
export interface CompressionConfig {
  /**
   * 是否启用压缩
   */
  enabled: boolean

  /**
   * 压缩阈值 (条目数)
   */
  threshold?: number

  /**
   * 压缩使用的 LLM
   */
  llm?: unknown // LLMClient from @seashore/llm

  /**
   * 压缩提示词
   */
  prompt?: string
}

// ============================================================================
// Memory Manager Interface
// ============================================================================

/**
 * 记忆管理器接口
 */
export interface MemoryManager {
  /**
   * 存储记忆
   */
  set(threadId: string, input: MemoryEntryInput): Promise<MemoryEntry>

  /**
   * 获取记忆
   */
  get(threadId: string, key: string): Promise<MemoryEntry | null>

  /**
   * 删除记忆
   */
  delete(threadId: string, key: string): Promise<void>

  /**
   * 列出记忆
   */
  list(threadId: string, options?: ListMemoryOptions): Promise<MemoryEntry[]>

  /**
   * 搜索记忆 (语义检索)
   */
  search(
    threadId: string,
    query: string,
    options?: SearchMemoryOptions
  ): Promise<MemorySearchResult[]>

  /**
   * 清理过期记忆
   */
  cleanup(threadId?: string): Promise<number>

  /**
   * 压缩记忆
   * 将多个短期记忆压缩为中期或长期记忆
   */
  compress(threadId: string, options?: CompressOptions): Promise<MemoryEntry[]>

  /**
   * 提升记忆重要性
   */
  promote(threadId: string, key: string): Promise<MemoryEntry | null>

  /**
   * 获取记忆统计
   */
  getStats(threadId: string): Promise<MemoryStats>

  /**
   * 清除线程所有记忆
   */
  clear(threadId: string): Promise<void>
}

/**
 * 列出记忆选项
 */
export interface ListMemoryOptions {
  type?: MemoryType
  limit?: number
  offset?: number
  orderBy?: 'createdAt' | 'updatedAt' | 'importance' | 'accessCount'
  order?: 'asc' | 'desc'
}

/**
 * 搜索记忆选项
 */
export interface SearchMemoryOptions {
  type?: MemoryType
  topK?: number
  threshold?: number
}

/**
 * 记忆搜索结果
 */
export interface MemorySearchResult {
  entry: MemoryEntry
  score: number
}

/**
 * 压缩选项
 */
export interface CompressOptions {
  /**
   * 源类型
   */
  sourceType?: MemoryType

  /**
   * 目标类型
   */
  targetType?: MemoryType

  /**
   * 最少条目数 (达到此数量才压缩)
   */
  minEntries?: number
}

/**
 * 记忆统计
 */
export interface MemoryStats {
  threadId: string
  shortTermCount: number
  midTermCount: number
  longTermCount: number
  totalSize: number
  oldestEntry?: Date
  newestEntry?: Date
}

// ============================================================================
// Conversation Summarizer
// ============================================================================

/**
 * 对话摘要器配置
 */
export interface SummarizerConfig {
  /**
   * LLM 客户端
   */
  llm: unknown // LLMClient from @seashore/llm

  /**
   * 摘要提示词
   */
  prompt?: string

  /**
   * 最大上下文长度 (token 数)
   */
  maxContextLength?: number

  /**
   * 摘要更新间隔 (消息数)
   */
  updateInterval?: number
}

/**
 * 对话摘要器接口
 */
export interface ConversationSummarizer {
  /**
   * 生成摘要
   */
  summarize(
    threadId: string,
    messages: unknown[] // Message[]
  ): Promise<string>

  /**
   * 更新摘要 (增量)
   */
  update(
    threadId: string,
    currentSummary: string,
    newMessages: unknown[]
  ): Promise<string>

  /**
   * 获取摘要
   */
  getSummary(threadId: string): Promise<string | null>
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * 创建记忆管理器
 *
 * @example
 * ```typescript
 * import { createMemoryManager } from "@seashore/memory";
 *
 * const memory = await createMemoryManager({
 *   storage,
 *   vectorStore,
 *   embeddingClient,
 *   shortTermTTL: 60 * 60 * 1000, // 1 小时
 *   midTermTTL: 24 * 60 * 60 * 1000, // 24 小时
 *   compression: {
 *     enabled: true,
 *     threshold: 10,
 *     llm,
 *   },
 * });
 *
 * // 存储记忆
 * await memory.set("thread-1", {
 *   key: "user_preference",
 *   value: { theme: "dark" },
 *   type: "long",
 * });
 *
 * // 检索记忆
 * const pref = await memory.get("thread-1", "user_preference");
 *
 * // 语义搜索
 * const results = await memory.search("thread-1", "用户偏好设置", {
 *   topK: 5,
 * });
 *
 * // 压缩短期记忆
 * await memory.compress("thread-1", {
 *   sourceType: "short",
 *   targetType: "mid",
 *   minEntries: 10,
 * });
 * ```
 */
export function createMemoryManager(config: MemoryConfig): Promise<MemoryManager>

/**
 * 创建对话摘要器
 *
 * @example
 * ```typescript
 * import { createConversationSummarizer } from "@seashore/memory";
 *
 * const summarizer = createConversationSummarizer({
 *   llm,
 *   maxContextLength: 4000,
 *   updateInterval: 10,
 * });
 *
 * // 生成摘要
 * const summary = await summarizer.summarize("thread-1", messages);
 *
 * // 增量更新
 * const updated = await summarizer.update("thread-1", summary, newMessages);
 * ```
 */
export function createConversationSummarizer(
  config: SummarizerConfig
): ConversationSummarizer

// ============================================================================
// Memory Middleware
// ============================================================================

/**
 * 记忆中间件配置
 */
export interface MemoryMiddlewareConfig {
  /**
   * 记忆管理器
   */
  memory: MemoryManager

  /**
   * 自动保存用户消息
   */
  saveUserMessages?: boolean

  /**
   * 自动保存助手消息
   */
  saveAssistantMessages?: boolean

  /**
   * 消息保存的记忆类型
   */
  messageMemoryType?: MemoryType

  /**
   * 自动检索相关记忆
   */
  autoRetrieve?: boolean

  /**
   * 检索数量
   */
  retrieveTopK?: number
}

/**
 * 创建记忆中间件
 *
 * 用于 Agent 执行流程中自动保存和检索记忆
 *
 * @example
 * ```typescript
 * import { createMemoryMiddleware } from "@seashore/memory";
 *
 * const middleware = createMemoryMiddleware({
 *   memory,
 *   saveUserMessages: true,
 *   autoRetrieve: true,
 *   retrieveTopK: 5,
 * });
 *
 * const agent = createReActAgent({
 *   llm,
 *   middleware: [middleware],
 * });
 * ```
 */
export function createMemoryMiddleware(config: MemoryMiddlewareConfig): unknown // AgentMiddleware
