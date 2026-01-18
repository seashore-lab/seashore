# RAG（检索增强生成）

RAG 通过在生成答案之前检索相关上下文（文档/块）来增强模型响应。在 Seashore 中，RAG 模块提供：

- 文档加载器（文件、字符串、Web）
- 分割器（Markdown 感知、基于 token、递归）
- 检索器（内存中、pgvector 支持、混合）
- 高级管道 (`createRAG`)，当您需要"查询 → 检索 → 回答"一站式调用时

本章以示例为主。如果您更喜欢可运行的参考，请参见 RAG 示例：[examples/04-basic-rag.md](../examples/04-basic-rag.md)。

## 思维模型

大多数 RAG 系统有两个阶段：

1. **索引**：加载 → 分割 → 嵌入 → 存储
2. **查询**：嵌入查询 → 检索块 → 构建提示 → 生成答案

Seashore 同时支持"构建自己的管道"和"使用现成的管道"。

## 快速开始（匹配示例 04）

```ts
import 'dotenv/config'
import {
  createMarkdownStringLoader,
  createMarkdownSplitter,
  createInMemoryRetriever,
  type DocumentChunk,
} from '@seashore/rag'
import { openaiEmbed, generateBatchEmbeddings } from '@seashore/llm'

const loader = createMarkdownStringLoader('# Title\nSome content...')
const docs = await loader.load()

const splitter = createMarkdownSplitter({
  chunkSize: 200,
  chunkOverlap: 20,
  includeHeader: true,
})

const chunks: DocumentChunk[] = []
for (const doc of docs) chunks.push(...(await splitter.split(doc)))

const embeddingFn = async (texts: readonly string[]) => {
  const embedder = openaiEmbed('text-embedding-3-small', 1536, {
    baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY || '',
  })
  const result = await generateBatchEmbeddings({ adapter: embedder, input: texts })
  return result.embeddings as number[][]
}

const retriever = createInMemoryRetriever(embeddingFn)
await retriever.addDocuments(chunks)

const results = await retriever.retrieve('What is the topic?', {
  k: 3,
  searchType: 'vector',
})

console.log(results[0]?.content)
console.log(results[0]?.score)
```

## 后续步骤

- 加载器：[advanced/rag/loaders.md](./rag/loaders.md)
- 分割器：[advanced/rag/splitters.md](./rag/splitters.md)
- 检索器：[advanced/rag/retrievers.md](./rag/retrievers.md)
- 管道：[advanced/rag/pipeline.md](./rag/pipeline.md)

## 检索器

### 内存检索器

快速的内存向量搜索：

```typescript
import { createInMemoryRetriever } from '@seashore/rag'

const retriever = createInMemoryRetriever(embeddingFn, {
  scoreThreshold: 0.7, // 最小相似度分数
})

await retriever.addDocuments(chunks)

const results = await retriever.retrieve('query', {
  k: 5,
  searchType: 'vector',
})
```

### 数据库检索器

使用 PostgreSQL + pgvector 的持久向量搜索：

```typescript
import { createDatabaseRetriever } from '@seashore/rag'
import { createVectorStore } from '@seashore/vectordb'

const vectorStore = await createVectorStore({
  db: myDatabase,
  collectionName: 'knowledge_base',
  embeddingFunction: embeddingFn,
})

const retriever = createDatabaseRetriever(vectorStore)
await retriever.addDocuments(chunks)

const results = await retriever.retrieve('query', {
  k: 5,
  searchType: 'vector',
})
```

## 搜索类型

### 向量搜索

纯语义相似度：

```typescript
const results = await retriever.retrieve('machine learning', {
  k: 5,
  searchType: 'vector',
})
```

### 全文搜索

基于关键字的搜索：

```typescript
const results = await retriever.retrieve('machine learning', {
  k: 5,
  searchType: 'fulltext',
})
```

### 混合搜索

结合向量和关键字搜索：

```typescript
import { hybridSearch } from '@seashore/vectordb'

const results = await hybridSearch({
  vectorStore,
  query: 'machine learning',
  k: 5,
  alpha: 0.7, // 0=仅全文，1=仅向量，0.5=平衡
})
```

## 元数据过滤

按元数据过滤：

```typescript
await retriever.addDocuments([
  {
    content: 'Python 教程',
    metadata: { language: 'python', difficulty: 'beginner' },
  },
  {
    content: 'TypeScript 教程',
    metadata: { language: 'typescript', difficulty: 'beginner' },
  },
])

const results = await retriever.retrieve('tutorial', {
  k: 5,
  filter: {
    language: 'python',
  },
})
```

## 在智能体中使用 RAG

### 手动 RAG

```typescript
import { createAgent } from '@seashore/agent'
import { openaiText } from '@seashore/llm'

const agent = createAgent({
  name: 'assistant',
  model: openaiText('gpt-4o'),
  systemPrompt: '使用提供的上下文回答问题。',
})

// 检索相关文档
const relevantDocs = await retriever.retrieve(userQuestion, { k: 3 })

// 构建上下文
const context = relevantDocs.map(doc => doc.content).join('\n\n')

// 使用上下文查询
const result = await agent.run(`
上下文：
${context}

问题：${userQuestion}

仅根据提供的上下文回答问题。
`)
```

### RAG 工具

创建检索信息的工具：

```typescript
import { defineTool } from '@seashore/tool'
import { z } from 'zod'

const retrievalTool = defineTool({
  name: 'search_knowledge_base',
  description: '搜索知识库以获取相关信息',
  inputSchema: z.object({
    query: z.string().describe('搜索查询'),
    k: z.number().default(3).describe('结果数量'),
  }),
  execute: async ({ query, k }) => {
    const results = await retriever.retrieve(query, { k })
    return {
      results: results.map(r => ({
        content: r.content,
        score: r.score,
        metadata: r.metadata,
      })),
    }
  },
})

const agent = createAgent({
  name: 'rag-agent',
  model: openaiText('gpt-4o'),
  systemPrompt: '在回答之前使用搜索工具查找相关信息。',
  tools: [retrievalTool],
})
```

## 高级模式

### 重排序

使用重排序改进结果：

```typescript
const initialResults = await retriever.retrieve(query, { k: 20 })

// 使用更复杂的模型重新排序
const reranked = await rerank(initialResults, query, {
  model: 'cross-encoder',
  topK: 5,
})
```

### 父文档检索

检索块但返回完整的父文档：

```typescript
const chunks = await splitter.split(document)

// 存储父引用
const chunksWithParent = chunks.map(chunk => ({
  ...chunk,
  metadata: {
    ...chunk.metadata,
    parentId: document.id,
  },
}))

await retriever.addDocuments(chunksWithParent)

// 检索并扩展到父文档
const results = await retriever.retrieve(query, { k: 5 })
const parentDocs = await getParentDocuments(results)
```

### 多查询

生成查询的多个变体：

```typescript
// 生成查询变体
const variations = await agent.run(`
生成此查询的 3 个变体："${originalQuery}"
格式化为 JSON 数组。
`)

// 使用所有变体搜索
const allResults = await Promise.all(
  variations.map(q => retriever.retrieve(q, { k: 3 }))
)

// 去重并合并
const combined = deduplicateResults(allResults.flat())
```

### 上下文压缩

压缩检索到的文档：

```typescript
const retrieved = await retriever.retrieve(query, { k: 5 })

// 将每个文档压缩为仅相关部分
const compressed = await Promise.all(
  retrieved.map(async doc => {
    const result = await agent.run(`
仅提取与此文本相关的部分："${query}"

文本：${doc.content}
`)
    return { ...doc, content: result.content }
  })
)
```

## 文档块结构

```typescript
interface DocumentChunk {
  content: string              // 块文本
  metadata: {
    source?: string           // 源文件/URL
    title?: string            // 文档标题
    chunkIndex?: number       // 文档中的位置
    [key: string]: any        // 自定义元数据
  }
  embedding?: number[]        // 向量嵌入
  score?: number              // 相关性分数（检索时）
}
```

## 最佳实践

1. **块大小**：
   - 小块（200-500 字符）：更精确的检索
   - 大块（1000+ 字符）：更多上下文但精度较低

2. **重叠**：10-20% 的重叠防止分割相关内容

3. **元数据**：添加丰富的元数据以进行过滤和源归属

4. **嵌入**：使用最新模型（text-embedding-3-small/large）

5. **混合搜索**：结合向量 + 关键字以获得最佳结果

6. **缓存**：缓存嵌入以避免重新生成

7. **更新**：当文档发生重大变化时重建索引

8. **质量**：在索引之前清理和构建文档

## 性能提示

```typescript
// 批处理
const chunks = await Promise.all(
  documents.map(doc => splitter.split(doc))
).then(results => results.flat())

// 并行嵌入
const BATCH_SIZE = 100
const batches = chunkArray(chunks, BATCH_SIZE)
for (const batch of batches) {
  await retriever.addDocuments(batch)
}

// 数据库检索器的连接池
const vectorStore = await createVectorStore({
  db: drizzle(postgres(connectionString, { max: 20 })),
  // ...
})
```

## 后续步骤

- [文档加载器](./rag/loaders.md) - 所有加载器类型
- [文本分割器](./rag/splitters.md) - 分割策略
- [检索器](./rag/retrievers.md) - 检索方法
- [RAG 管道](./rag/pipeline.md) - 完整管道设置

## 示例

- [04: 基础 RAG](../examples/04-basic-rag.md) - 内存 RAG
- [13: 向量数据库混合搜索](../examples/13-vectordb-hybrid-search.md) - PostgreSQL + pgvector
