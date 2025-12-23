/**
 * @seashore/vectordb - 向量数据库接口契约
 *
 * 基于 PostgreSQL + pgvector，使用 Drizzle ORM
 * 支持 HNSW 索引和混合搜索
 */

// ============================================================================
// Vector Store Configuration
// ============================================================================

/**
 * 向量存储配置
 */
export interface VectorStoreConfig {
  /**
   * PostgreSQL 连接字符串
   */
  connectionString: string

  /**
   * 表名前缀
   */
  tablePrefix?: string

  /**
   * 向量维度 (默认: 1536 for OpenAI)
   */
  dimensions?: number

  /**
   * 距离度量方式
   */
  distanceMetric?: 'cosine' | 'euclidean' | 'inner_product'

  /**
   * HNSW 索引配置
   */
  hnswConfig?: HNSWConfig
}

/**
 * HNSW 索引配置
 */
export interface HNSWConfig {
  /**
   * 每个节点的最大连接数
   * 更高值提高召回率但增加索引大小
   * 默认: 16
   */
  m?: number

  /**
   * 构建时的动态候选列表大小
   * 更高值提高构建质量但增加构建时间
   * 默认: 64
   */
  efConstruction?: number
}

// ============================================================================
// Vector Entry
// ============================================================================

/**
 * 向量条目
 */
export interface VectorEntry {
  id: string
  embedding: number[]
  metadata: Record<string, unknown>
  content?: string
  createdAt: Date
}

/**
 * 向量条目输入
 */
export interface VectorEntryInput {
  id?: string
  embedding: number[]
  metadata?: Record<string, unknown>
  content?: string
}

// ============================================================================
// Search Configuration
// ============================================================================

/**
 * 搜索配置
 */
export interface VectorSearchConfig {
  /**
   * 返回结果数量
   */
  topK: number

  /**
   * 相似度阈值 (0-1)
   */
  threshold?: number

  /**
   * 元数据过滤器
   */
  filter?: MetadataFilter

  /**
   * 是否包含向量
   */
  includeEmbedding?: boolean

  /**
   * HNSW 搜索时的动态候选列表大小
   * 更高值提高召回率但降低速度
   * 默认: 40
   */
  efSearch?: number
}

/**
 * 元数据过滤器
 */
export type MetadataFilter =
  | { $eq: Record<string, unknown> }
  | { $ne: Record<string, unknown> }
  | { $in: Record<string, unknown[]> }
  | { $nin: Record<string, unknown[]> }
  | { $gt: Record<string, number | string> }
  | { $gte: Record<string, number | string> }
  | { $lt: Record<string, number | string> }
  | { $lte: Record<string, number | string> }
  | { $and: MetadataFilter[] }
  | { $or: MetadataFilter[] }

/**
 * 搜索结果
 */
export interface VectorSearchResult {
  id: string
  score: number
  metadata: Record<string, unknown>
  content?: string
  embedding?: number[]
}

// ============================================================================
// Hybrid Search
// ============================================================================

/**
 * 混合搜索配置
 */
export interface HybridSearchConfig extends VectorSearchConfig {
  /**
   * 关键词查询
   */
  query: string

  /**
   * 向量权重 (0-1)
   * 0 = 纯关键词搜索
   * 1 = 纯向量搜索
   * 默认: 0.5
   */
  alpha?: number

  /**
   * tsvector 配置 (语言)
   */
  textSearchConfig?: string
}

// ============================================================================
// Vector Store Interface
// ============================================================================

/**
 * 向量存储接口
 */
export interface VectorStore {
  /**
   * 创建集合 (namespace)
   */
  createCollection(name: string): Promise<void>

  /**
   * 删除集合
   */
  dropCollection(name: string): Promise<void>

  /**
   * 列出所有集合
   */
  listCollections(): Promise<string[]>

  /**
   * 插入向量
   */
  insert(collection: string, entries: VectorEntryInput[]): Promise<string[]>

  /**
   * 更新向量
   */
  update(
    collection: string,
    id: string,
    entry: Partial<VectorEntryInput>
  ): Promise<void>

  /**
   * 删除向量
   */
  delete(collection: string, ids: string[]): Promise<void>

  /**
   * 根据 ID 获取向量
   */
  get(collection: string, ids: string[]): Promise<VectorEntry[]>

  /**
   * 向量相似性搜索
   */
  search(
    collection: string,
    embedding: number[],
    config: VectorSearchConfig
  ): Promise<VectorSearchResult[]>

  /**
   * 混合搜索 (向量 + 全文)
   *
   * 使用 RRF (Reciprocal Rank Fusion) 算法融合结果
   */
  hybridSearch(
    collection: string,
    embedding: number[],
    config: HybridSearchConfig
  ): Promise<VectorSearchResult[]>

  /**
   * 全文搜索
   */
  textSearch(
    collection: string,
    query: string,
    config: VectorSearchConfig
  ): Promise<VectorSearchResult[]>

  /**
   * 获取集合统计信息
   */
  getStats(collection: string): Promise<CollectionStats>

  /**
   * 关闭连接
   */
  close(): Promise<void>
}

/**
 * 集合统计信息
 */
export interface CollectionStats {
  name: string
  count: number
  dimensions: number
  indexType: string
  diskUsage: number
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * 创建向量存储
 *
 * @example
 * ```typescript
 * import { createVectorStore } from "@seashore/vectordb";
 *
 * const store = await createVectorStore({
 *   connectionString: process.env.DATABASE_URL,
 *   dimensions: 1536,
 *   distanceMetric: "cosine",
 *   hnswConfig: {
 *     m: 16,
 *     efConstruction: 64,
 *   },
 * });
 *
 * // 创建集合
 * await store.createCollection("documents");
 *
 * // 插入向量
 * const ids = await store.insert("documents", [
 *   {
 *     embedding: [0.1, 0.2, ...],
 *     content: "Hello world",
 *     metadata: { source: "file.txt" },
 *   },
 * ]);
 *
 * // 搜索
 * const results = await store.search("documents", queryEmbedding, {
 *   topK: 10,
 *   threshold: 0.7,
 * });
 *
 * // 混合搜索
 * const hybridResults = await store.hybridSearch(
 *   "documents",
 *   queryEmbedding,
 *   {
 *     query: "hello",
 *     topK: 10,
 *     alpha: 0.5, // 50% vector, 50% keyword
 *   }
 * );
 * ```
 */
export function createVectorStore(config: VectorStoreConfig): Promise<VectorStore>

// ============================================================================
// SQL Generation Helpers
// ============================================================================

/**
 * 生成 HNSW 索引 SQL
 */
export function generateHNSWIndexSQL(
  tableName: string,
  columnName: string,
  config?: HNSWConfig
): string

/**
 * 生成 tsvector 索引 SQL
 */
export function generateTSVectorIndexSQL(
  tableName: string,
  columnName: string,
  config?: string
): string

/**
 * 生成混合搜索 SQL
 *
 * 使用 CTE 实现 RRF 融合
 */
export function generateHybridSearchSQL(
  tableName: string,
  vectorColumn: string,
  textColumn: string,
  config: HybridSearchConfig
): string
