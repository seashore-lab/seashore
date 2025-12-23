/**
 * @seashore/rag - 检索增强接口契约
 */

// ============================================================================
// Document Types
// ============================================================================

/**
 * 文档实体
 */
export interface Document {
  id: string
  source: string
  title?: string
  content: string
  contentHash: string
  mimeType?: string
  chunkCount: number
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

/**
 * 文档块实体
 */
export interface Chunk {
  id: string
  documentId: string
  content: string
  embedding?: number[]
  chunkIndex: number
  startOffset?: number
  endOffset?: number
  metadata?: Record<string, unknown>
}

/**
 * 检索结果
 */
export interface RetrievalResult {
  chunk: Chunk
  document: Document
  score: number
  method: 'vector' | 'keyword' | 'hybrid'
}

// ============================================================================
// Chunking
// ============================================================================

/**
 * 分块策略
 */
export type ChunkingStrategy = 'fixed' | 'sentence' | 'paragraph' | 'semantic'

/**
 * 分块配置
 */
export interface ChunkingConfig {
  strategy: ChunkingStrategy
  chunkSize: number
  chunkOverlap: number
  separators?: string[]
}

/**
 * 分块器
 */
export interface Chunker {
  /**
   * 将文本分块
   */
  chunk(text: string, config?: Partial<ChunkingConfig>): string[]

  /**
   * 将文档分块
   */
  chunkDocument(document: {
    content: string
    metadata?: Record<string, unknown>
  }): Array<{
    content: string
    index: number
    startOffset: number
    endOffset: number
  }>
}

// ============================================================================
// Embedding
// ============================================================================

/**
 * Embedding 模型配置
 */
export interface EmbeddingConfig {
  provider: 'openai' | 'anthropic' | 'local'
  model: string
  apiKey?: string
  dimensions?: number
}

/**
 * Embedding 客户端
 */
export interface EmbeddingClient {
  /**
   * 生成单个文本的 embedding
   */
  embed(text: string): Promise<number[]>

  /**
   * 批量生成 embedding
   */
  embedMany(texts: string[]): Promise<number[][]>

  /**
   * 获取 embedding 维度
   */
  getDimensions(): number
}

// ============================================================================
// Retriever
// ============================================================================

/**
 * 检索配置
 */
export interface RetrievalConfig {
  /**
   * 检索方法
   */
  method: 'vector' | 'keyword' | 'hybrid'

  /**
   * 返回结果数量
   */
  topK: number

  /**
   * 相似度阈值
   */
  threshold?: number

  /**
   * 混合检索权重 (仅 hybrid 模式)
   * 0 = 纯关键词, 1 = 纯向量
   */
  alpha?: number

  /**
   * 过滤条件
   */
  filter?: Record<string, unknown>
}

/**
 * 检索器
 */
export interface Retriever {
  /**
   * 检索相关文档块
   */
  retrieve(query: string, config?: Partial<RetrievalConfig>): Promise<RetrievalResult[]>

  /**
   * 向量检索
   */
  vectorSearch(
    queryEmbedding: number[],
    config?: Partial<RetrievalConfig>
  ): Promise<RetrievalResult[]>

  /**
   * 关键词检索 (基于 tsvector)
   */
  keywordSearch(
    query: string,
    config?: Partial<RetrievalConfig>
  ): Promise<RetrievalResult[]>

  /**
   * 混合检索 (RRF 融合)
   */
  hybridSearch(
    query: string,
    queryEmbedding: number[],
    config?: Partial<RetrievalConfig>
  ): Promise<RetrievalResult[]>
}

// ============================================================================
// RAG Pipeline
// ============================================================================

/**
 * RAG 配置
 */
export interface RAGConfig {
  /**
   * Embedding 配置
   */
  embedding: EmbeddingConfig

  /**
   * 分块配置
   */
  chunking?: Partial<ChunkingConfig>

  /**
   * 检索配置
   */
  retrieval?: Partial<RetrievalConfig>

  /**
   * 数据库连接
   */
  connectionString: string
}

/**
 * RAG 实例
 */
export interface RAG {
  readonly chunker: Chunker
  readonly embedder: EmbeddingClient
  readonly retriever: Retriever

  /**
   * 导入文档
   */
  ingest(
    documents: Array<{
      source: string
      content: string
      title?: string
      mimeType?: string
      metadata?: Record<string, unknown>
    }>
  ): Promise<Document[]>

  /**
   * 从 URL 导入
   */
  ingestFromUrl(
    url: string,
    options?: {
      crawl?: boolean
      maxDepth?: number
    }
  ): Promise<Document[]>

  /**
   * 检索相关上下文
   */
  retrieve(
    query: string,
    options?: Partial<RetrievalConfig>
  ): Promise<RetrievalResult[]>

  /**
   * 增强 Prompt
   */
  augmentPrompt(
    query: string,
    options?: {
      maxTokens?: number
      template?: string
    }
  ): Promise<string>

  /**
   * 删除文档
   */
  deleteDocument(documentId: string): Promise<void>

  /**
   * 删除所有文档
   */
  deleteAllDocuments(): Promise<void>
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * 创建 RAG 实例
 *
 * @example
 * ```typescript
 * import { createRAG } from "@seashore/rag";
 *
 * const rag = createRAG({
 *   embedding: {
 *     provider: "openai",
 *     model: "text-embedding-3-small",
 *     apiKey: process.env.OPENAI_API_KEY,
 *   },
 *   connectionString: process.env.DATABASE_URL,
 * });
 *
 * // 导入文档
 * await rag.ingest([
 *   { source: "manual.txt", content: "..." },
 * ]);
 *
 * // 检索
 * const results = await rag.retrieve("How to configure?");
 * ```
 */
export function createRAG(config: RAGConfig): RAG

/**
 * 创建分块器
 */
export function createChunker(config?: Partial<ChunkingConfig>): Chunker

/**
 * 创建 Embedding 客户端
 */
export function createEmbeddingClient(config: EmbeddingConfig): EmbeddingClient

/**
 * 创建检索器
 */
export function createRetriever(config: {
  connectionString: string
  embedder: EmbeddingClient
  defaultConfig?: Partial<RetrievalConfig>
}): Retriever
