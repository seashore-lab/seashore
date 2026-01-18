# API Contract: @seashorelab/vectordb

**Package**: `@seashorelab/vectordb`  
**Version**: 0.1.0

## 概述

VectorDB 模块提供基于 PostgreSQL pgvector 的向量存储，支持 HNSW 算法索引和 tsvector 全文搜索的混合检索。

---

## 导出

```typescript
// 核心
export { createVectorStore, type VectorStore } from './store'

// Schema
export { documents, collections } from './schema'

// 搜索
export {
  vectorSearch,
  textSearch,
  hybridSearch,
  type SearchOptions,
  type SearchResult,
} from './search'

// 类型
export type { Document, NewDocument, Collection, EmbeddingFunction } from './types'
```

---

## Schema 定义

### collections

```typescript
import { pgTable, uuid, text, timestamp, integer } from 'drizzle-orm/pg-core'

export const collections = pgTable('collections', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  description: text('description'),
  dimensions: integer('dimensions').notNull().default(1536),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
```

### documents

```typescript
import { pgTable, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core'
import { vector } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// 自定义 tsvector 类型
const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector'
  },
})

export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    collectionId: uuid('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: 1536 }),
    search: tsvector('search').generatedAlwaysAs(
      sql`setweight(to_tsvector('english', coalesce(title, '')), 'A') || 
        setweight(to_tsvector('english', coalesce(content, '')), 'B')`
    ),
    title: text('title'),
    source: text('source'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // HNSW 向量索引
    embeddingIdx: index('documents_embedding_idx')
      .using('hnsw', table.embedding.op('vector_cosine_ops'))
      .with({ m: 16, ef_construction: 64 }),

    // GIN 全文搜索索引
    searchIdx: index('documents_search_idx').using('gin', table.search),

    // Collection 索引
    collectionIdx: index('documents_collection_idx').on(table.collectionId),
  })
)
```

---

## VectorStore

### createVectorStore

```typescript
import { createVectorStore } from '@seashorelab/vectordb'
import { openaiEmbed } from '@seashorelab/llm'

const vectorStore = createVectorStore({
  db: database,
  embeddingAdapter: openaiEmbed('text-embedding-3-small'),
  defaultCollection: 'default',
})
```

### 配置选项

```typescript
interface VectorStoreConfig {
  db: Database
  embeddingAdapter: EmbeddingAdapter
  defaultCollection?: string
  chunkSize?: number // 批量嵌入大小，默认 100
  dimensions?: number // 向量维度，默认 1536
}
```

---

## Collection 管理

```typescript
// 创建 Collection
const collection = await vectorStore.createCollection({
  name: 'knowledge-base',
  description: '公司知识库',
  dimensions: 1536,
  metadata: { source: 'confluence' },
})

// 获取 Collection
const found = await vectorStore.getCollection('knowledge-base')

// 列出所有 Collections
const collections = await vectorStore.listCollections()

// 删除 Collection（级联删除所有文档）
await vectorStore.deleteCollection('knowledge-base')
```

---

## 文档操作

### 添加文档

```typescript
// 添加单个文档（自动生成嵌入）
const doc = await vectorStore.addDocument({
  content: '这是一段示例文本内容...',
  title: '示例文档',
  source: 'https://example.com/doc',
  metadata: { author: 'John', category: 'tech' },
}, 'knowledge-base')

// 添加预计算嵌入的文档
const docWithEmbedding = await vectorStore.addDocument({
  content: '另一段内容...',
  embedding: [0.1, 0.2, ...], // 预计算的 1536 维向量
}, 'knowledge-base')

// 批量添加
const docs = await vectorStore.addDocuments([
  { content: 'Doc 1', title: 'First' },
  { content: 'Doc 2', title: 'Second' },
  { content: 'Doc 3', title: 'Third' },
], 'knowledge-base')
```

### 更新文档

```typescript
await vectorStore.updateDocument(docId, {
  content: '更新后的内容...',
  metadata: { updated: true },
})

// 更新会自动重新计算嵌入向量
```

### 删除文档

```typescript
// 删除单个
await vectorStore.deleteDocument(docId)

// 批量删除
await vectorStore.deleteDocuments([docId1, docId2, docId3])

// 按条件删除
await vectorStore.deleteDocuments({
  collection: 'knowledge-base',
  where: { source: 'https://old-source.com' },
})
```

---

## 向量搜索

### vectorSearch

基于向量相似度的语义搜索：

```typescript
import { vectorSearch } from '@seashorelab/vectordb'

const results = await vectorSearch({
  store: vectorStore,
  query: '如何配置 TypeScript 项目？',
  collection: 'knowledge-base',
  topK: 5,
  minScore: 0.7, // 最低相似度阈值
  filter: {
    // 元数据过滤
    category: 'tech',
  },
})

for (const result of results) {
  console.log(`Score: ${result.score}`)
  console.log(`Content: ${result.document.content}`)
  console.log(`Metadata: ${JSON.stringify(result.document.metadata)}`)
}
```

### 返回类型

```typescript
interface SearchResult {
  document: Document
  score: number // 0-1 相似度分数
  distance?: number // 原始距离值
}
```

---

## 全文搜索

### textSearch

基于 PostgreSQL tsvector 的全文搜索：

```typescript
import { textSearch } from '@seashorelab/vectordb'

const results = await textSearch({
  store: vectorStore,
  query: 'TypeScript config',
  collection: 'knowledge-base',
  topK: 10,
  language: 'english', // PostgreSQL text search config
})
```

### 高级查询语法

```typescript
// 短语搜索
const phrase = await textSearch({
  store: vectorStore,
  query: '"exact phrase"',
  collection: 'docs',
})

// AND 搜索
const and = await textSearch({
  store: vectorStore,
  query: 'typescript & react',
  collection: 'docs',
})

// OR 搜索
const or = await textSearch({
  store: vectorStore,
  query: 'typescript | javascript',
  collection: 'docs',
})

// NOT 搜索
const not = await textSearch({
  store: vectorStore,
  query: 'typescript & !javascript',
  collection: 'docs',
})
```

---

## 混合搜索

### hybridSearch

结合向量相似度和全文搜索的混合检索：

```typescript
import { hybridSearch } from '@seashorelab/vectordb'

const results = await hybridSearch({
  store: vectorStore,
  query: '如何配置 TypeScript 项目？',
  collection: 'knowledge-base',
  topK: 10,

  // 权重配置
  vectorWeight: 0.7, // 向量搜索权重
  textWeight: 0.3, // 全文搜索权重

  // 可选：RRF 融合参数
  rrf: {
    k: 60, // RRF k 参数
  },

  // 元数据过滤
  filter: {
    category: 'tech',
  },
})
```

### 融合算法

支持两种融合算法：

```typescript
// 1. 加权求和（默认）
const weighted = await hybridSearch({
  query: 'query',
  collection: 'docs',
  vectorWeight: 0.7,
  textWeight: 0.3,
  fusion: 'weighted',
})

// 2. Reciprocal Rank Fusion (RRF)
const rrf = await hybridSearch({
  query: 'query',
  collection: 'docs',
  fusion: 'rrf',
  rrf: { k: 60 },
})
```

---

## SQL 实现细节

### HNSW 索引创建

```sql
-- 创建 HNSW 索引
CREATE INDEX documents_embedding_idx
ON documents
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 设置搜索参数
SET hnsw.ef_search = 100;
```

### 向量搜索 SQL

```sql
SELECT
  id, content, title, metadata,
  1 - (embedding <=> $1::vector) as score
FROM documents
WHERE collection_id = $2
  AND (embedding <=> $1::vector) < (1 - $3)  -- minScore 转换
ORDER BY embedding <=> $1::vector
LIMIT $4;
```

### 混合搜索 SQL

```sql
WITH vector_results AS (
  SELECT id, 1 - (embedding <=> $1::vector) as v_score
  FROM documents
  WHERE collection_id = $2
  ORDER BY embedding <=> $1::vector
  LIMIT 50
),
text_results AS (
  SELECT id, ts_rank_cd(search, websearch_to_tsquery('english', $3)) as t_score
  FROM documents
  WHERE collection_id = $2 AND search @@ websearch_to_tsquery('english', $3)
  ORDER BY t_score DESC
  LIMIT 50
)
SELECT
  d.*,
  COALESCE(v.v_score * $4, 0) + COALESCE(t.t_score * $5, 0) as combined_score
FROM documents d
LEFT JOIN vector_results v ON d.id = v.id
LEFT JOIN text_results t ON d.id = t.id
WHERE v.id IS NOT NULL OR t.id IS NOT NULL
ORDER BY combined_score DESC
LIMIT $6;
```

---

## 类型定义

```typescript
export interface Document {
  id: string
  collectionId: string
  content: string
  embedding: number[] | null
  title: string | null
  source: string | null
  metadata: Record<string, unknown> | null
  createdAt: Date
}

export interface NewDocument {
  content: string
  embedding?: number[]
  title?: string
  source?: string
  metadata?: Record<string, unknown>
}

export interface Collection {
  id: string
  name: string
  description: string | null
  dimensions: number
  metadata: Record<string, unknown> | null
  createdAt: Date
}

export interface SearchOptions {
  query: string
  collection: string
  topK?: number
  minScore?: number
  filter?: Record<string, unknown>
}

export type EmbeddingFunction = (texts: string[]) => Promise<number[][]>
```
