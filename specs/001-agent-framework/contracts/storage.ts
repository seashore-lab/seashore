/**
 * @seashore/storage - 关系型存储接口契约
 *
 * 基于 Drizzle ORM + PostgreSQL
 */

// ============================================================================
// Entity Types
// ============================================================================

/**
 * 消息角色
 */
export type MessageRole = 'user' | 'assistant' | 'tool' | 'system'

/**
 * 消息部分（与 @tanstack/ai 对齐）
 */
export type MessagePart =
  | { type: 'text'; content: string }
  | { type: 'thinking'; content: string }
  | { type: 'tool-call'; id: string; name: string; arguments: unknown }
  | { type: 'tool-result'; toolCallId: string; result: unknown }

/**
 * 会话实体
 */
export interface Thread {
  id: string
  title?: string
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

/**
 * 消息实体
 */
export interface Message {
  id: string
  threadId: string
  role: MessageRole
  content?: string
  parts?: MessagePart[]
  tokenCount?: number
  metadata?: Record<string, unknown>
  createdAt: Date
}

// ============================================================================
// Repository Interfaces
// ============================================================================

/**
 * 会话仓库
 */
export interface ThreadRepository {
  /**
   * 创建会话
   */
  create(data: Omit<Thread, 'id' | 'createdAt' | 'updatedAt'>): Promise<Thread>

  /**
   * 根据 ID 获取会话
   */
  findById(id: string): Promise<Thread | null>

  /**
   * 列出所有会话
   */
  findAll(options?: {
    limit?: number
    offset?: number
    orderBy?: 'createdAt' | 'updatedAt'
    order?: 'asc' | 'desc'
  }): Promise<Thread[]>

  /**
   * 更新会话
   */
  update(id: string, data: Partial<Omit<Thread, 'id' | 'createdAt'>>): Promise<Thread>

  /**
   * 删除会话
   */
  delete(id: string): Promise<void>

  /**
   * 获取会话消息数量
   */
  getMessageCount(id: string): Promise<number>
}

/**
 * 消息仓库
 */
export interface MessageRepository {
  /**
   * 创建消息
   */
  create(data: Omit<Message, 'id' | 'createdAt'>): Promise<Message>

  /**
   * 批量创建消息
   */
  createMany(data: Array<Omit<Message, 'id' | 'createdAt'>>): Promise<Message[]>

  /**
   * 根据 ID 获取消息
   */
  findById(id: string): Promise<Message | null>

  /**
   * 获取会话的所有消息
   */
  findByThreadId(
    threadId: string,
    options?: {
      limit?: number
      offset?: number
      order?: 'asc' | 'desc'
    }
  ): Promise<Message[]>

  /**
   * 获取会话的最近消息
   */
  findRecentByThreadId(threadId: string, limit: number): Promise<Message[]>

  /**
   * 更新消息
   */
  update(
    id: string,
    data: Partial<Omit<Message, 'id' | 'threadId' | 'createdAt'>>
  ): Promise<Message>

  /**
   * 删除消息
   */
  delete(id: string): Promise<void>

  /**
   * 删除会话的所有消息
   */
  deleteByThreadId(threadId: string): Promise<void>

  /**
   * 统计会话的 Token 总数
   */
  sumTokensByThreadId(threadId: string): Promise<number>
}

// ============================================================================
// Storage Configuration
// ============================================================================

/**
 * 存储配置
 */
export interface StorageConfig {
  /**
   * PostgreSQL 连接字符串
   */
  connectionString: string

  /**
   * 连接池大小
   */
  poolSize?: number

  /**
   * 是否启用 SSL
   */
  ssl?: boolean

  /**
   * Schema 名称
   */
  schema?: string
}

/**
 * 存储实例
 */
export interface Storage {
  readonly threads: ThreadRepository
  readonly messages: MessageRepository

  /**
   * 获取底层 Drizzle 实例
   */
  getDb(): unknown

  /**
   * 运行迁移
   */
  migrate(): Promise<void>

  /**
   * 关闭连接
   */
  close(): Promise<void>
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * 创建存储实例
 *
 * @example
 * ```typescript
 * import { createStorage } from "@seashore/storage";
 *
 * const storage = createStorage({
 *   connectionString: process.env.DATABASE_URL,
 * });
 *
 * // 创建会话
 * const thread = await storage.threads.create({
 *   title: "My Chat",
 * });
 *
 * // 创建消息
 * await storage.messages.create({
 *   threadId: thread.id,
 *   role: "user",
 *   content: "Hello!",
 * });
 * ```
 */
export function createStorage(config: StorageConfig): Storage

// ============================================================================
// Migration Utilities
// ============================================================================

/**
 * 生成迁移文件
 */
export function generateMigration(name: string): Promise<string>

/**
 * 运行待执行的迁移
 */
export function runMigrations(config: StorageConfig): Promise<void>

/**
 * 回滚最近的迁移
 */
export function rollbackMigration(config: StorageConfig): Promise<void>
