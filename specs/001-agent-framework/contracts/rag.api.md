# API Contract: @seashorelab/rag

**Package**: `@seashorelab/rag`  
**Version**: 0.1.0

## 概述

RAG 模块提供完整的检索增强生成能力，包括文档加载器、文本分割器、检索器和 RAG 管道编排。

---

## 导出

```typescript
// RAG 管道
export { createRAG, type RAG, type RAGConfig } from './rag'

// 文档加载器
export {
  createTextLoader,
  createMarkdownLoader,
  createPDFLoader,
  createWebLoader,
  type DocumentLoader,
} from './loaders'

// 文本分割器
export {
  createCharacterSplitter,
  createTokenSplitter,
  createMarkdownSplitter,
  createRecursiveSplitter,
  type TextSplitter,
} from './splitters'

// 检索器
export {
  createVectorRetriever,
  createHybridRetriever,
  createContextualRetriever,
  type Retriever,
} from './retrievers'

// 类型
export type { LoadedDocument, DocumentChunk, RetrievalResult } from './types'
```

---

## RAG 管道

### createRAG

```typescript
import { createRAG } from '@seashorelab/rag'
import { createVectorStore } from '@seashorelab/vectordb'
import { openaiText, openaiEmbed } from '@seashorelab/llm'

const rag = createRAG({
  vectorStore: createVectorStore({
    db: database,
    embeddingAdapter: openaiEmbed('text-embedding-3-small'),
  }),
  llmAdapter: openaiText('gpt-4o'),
  collection: 'knowledge-base',

  // 检索配置
  retrieval: {
    type: 'hybrid', // 'vector' | 'text' | 'hybrid'
    topK: 5,
    minScore: 0.7,
    vectorWeight: 0.7,
    textWeight: 0.3,
  },

  // 提示词模板
  systemPrompt: `你是一个知识库助手。基于以下上下文回答问题：

{context}

如果上下文中没有相关信息，请说"我没有找到相关信息"。`,
})
```

### 配置选项

```typescript
interface RAGConfig {
  vectorStore: VectorStore
  llmAdapter: TextAdapter
  collection: string

  retrieval?: {
    type?: 'vector' | 'text' | 'hybrid'
    topK?: number
    minScore?: number
    vectorWeight?: number
    textWeight?: number
    filter?: Record<string, unknown>
  }

  systemPrompt?: string
  includeMetadata?: boolean
  maxContextTokens?: number
}
```

---

## RAG 查询

### query

```typescript
// 简单查询
const result = await rag.query('如何配置 TypeScript？')

console.log('Answer:', result.answer)
console.log('Sources:', result.sources)

// 带选项的查询
const result2 = await rag.query('什么是 React Hooks？', {
  topK: 3,
  filter: { category: 'frontend' },
})
```

### 流式查询

```typescript
// 流式响应
for await (const chunk of rag.queryStream('解释一下 ESM 模块')) {
  if (chunk.type === 'text') {
    process.stdout.write(chunk.content)
  } else if (chunk.type === 'sources') {
    console.log('\nSources:', chunk.sources)
  }
}
```

### 查询结果

```typescript
interface RAGQueryResult {
  answer: string
  sources: Array<{
    document: Document
    score: number
    relevantChunk: string
  }>
  usage?: TokenUsage
}

interface RAGStreamChunk {
  type: 'text' | 'sources'
  content?: string
  sources?: Source[]
}
```

---

## 文档加载器

### createTextLoader

```typescript
import { createTextLoader } from '@seashorelab/rag'

const loader = createTextLoader()

// 从文件加载
const docs = await loader.load('./document.txt')

// 从字符串加载
const doc = await loader.loadFromString('Hello World', {
  source: 'manual-input',
  metadata: { type: 'greeting' },
})
```

### createMarkdownLoader

```typescript
import { createMarkdownLoader } from '@seashorelab/rag'

const loader = createMarkdownLoader({
  extractFrontmatter: true, // 提取 YAML frontmatter
  removeCodeBlocks: false,
  extractHeadings: true, // 将 heading 加入 metadata
})

const docs = await loader.load('./README.md')
// docs[0].metadata.frontmatter = { title: '...', ... }
// docs[0].metadata.headings = ['h1', 'h2', ...]
```

### createPDFLoader

```typescript
import { createPDFLoader } from '@seashorelab/rag'

const loader = createPDFLoader({
  splitPages: true, // 按页分割
  extractImages: false, // 是否提取图片
})

const docs = await loader.load('./document.pdf')
// 每页一个 Document
```

### createWebLoader

```typescript
import { createWebLoader } from '@seashorelab/rag'

const loader = createWebLoader({
  // 可选：使用 Firecrawl 进行高质量抓取
  firecrawlApiKey: process.env.FIRECRAWL_API_KEY,

  // 或使用简单抓取
  selector: 'article', // CSS 选择器
  removeSelectors: ['nav', 'footer', '.ads'],
  waitForSelector: '.content', // 等待元素出现
  timeout: 10000,
})

const docs = await loader.load('https://example.com/article')
```

### 加载目录

```typescript
import { createMarkdownLoader } from '@seashorelab/rag'

const loader = createMarkdownLoader()

// 加载整个目录
const docs = await loader.loadDirectory('./docs', {
  glob: '**/*.md',
  recursive: true,
  ignore: ['**/node_modules/**', '**/draft/**'],
})
```

---

## 文本分割器

### createRecursiveSplitter

推荐使用的通用分割器：

```typescript
import { createRecursiveSplitter } from '@seashorelab/rag'

const splitter = createRecursiveSplitter({
  chunkSize: 1000, // 目标块大小（字符数）
  chunkOverlap: 200, // 重叠字符数
  separators: ['\n\n', '\n', ' ', ''], // 分隔符优先级
})

const chunks = await splitter.split(document)
```

### createTokenSplitter

基于 Token 数量的分割：

```typescript
import { createTokenSplitter } from '@seashorelab/rag'

const splitter = createTokenSplitter({
  chunkSize: 500, // Token 数量
  chunkOverlap: 50,
  encoding: 'cl100k_base', // OpenAI tokenizer
})

const chunks = await splitter.split(document)
```

### createMarkdownSplitter

保留 Markdown 结构的分割：

```typescript
import { createMarkdownSplitter } from '@seashorelab/rag'

const splitter = createMarkdownSplitter({
  chunkSize: 1000,
  chunkOverlap: 100,
  headingSeparators: ['#', '##', '###'],
  preserveCodeBlocks: true, // 不拆分代码块
})

const chunks = await splitter.split(markdownDocument)
```

---

## 检索器

### createVectorRetriever

```typescript
import { createVectorRetriever } from '@seashorelab/rag'

const retriever = createVectorRetriever({
  vectorStore,
  collection: 'docs',
  topK: 5,
  minScore: 0.7,
})

const results = await retriever.retrieve('query text')
```

### createHybridRetriever

```typescript
import { createHybridRetriever } from '@seashorelab/rag'

const retriever = createHybridRetriever({
  vectorStore,
  collection: 'docs',
  topK: 10,
  vectorWeight: 0.7,
  textWeight: 0.3,
  fusion: 'rrf',
})

const results = await retriever.retrieve('query text')
```

### createContextualRetriever

使用 LLM 生成上下文增强的检索：

```typescript
import { createContextualRetriever } from '@seashorelab/rag'

const retriever = createContextualRetriever({
  vectorStore,
  llmAdapter: openaiText('gpt-4o-mini'),
  collection: 'docs',
  topK: 5,

  // 生成多个查询视角
  multiQuery: true,
  numQueries: 3,
})

const results = await retriever.retrieve('how to use react hooks')
// 内部会生成多个查询变体并合并结果
```

---

## 文档摄入

### ingest

一站式文档摄入：

```typescript
import { createRAG, createMarkdownLoader, createRecursiveSplitter } from '@seashorelab/rag'

const rag = createRAG({ ... })

// 摄入文档
await rag.ingest({
  loader: createMarkdownLoader(),
  splitter: createRecursiveSplitter({ chunkSize: 1000 }),
  source: './docs',
  glob: '**/*.md',
})

// 摄入 URL
await rag.ingest({
  loader: createWebLoader({ firecrawlApiKey: '...' }),
  splitter: createRecursiveSplitter({ chunkSize: 500 }),
  source: [
    'https://example.com/page1',
    'https://example.com/page2',
  ],
})
```

### 增量更新

```typescript
// 检查并更新变化的文档
const result = await rag.sync({
  loader: createMarkdownLoader(),
  splitter: createRecursiveSplitter(),
  source: './docs',

  // 基于文件修改时间判断
  checkModified: true,

  // 或基于内容 hash
  checkHash: true,
})

console.log(
  `Added: ${result.added}, Updated: ${result.updated}, Deleted: ${result.deleted}`
)
```

---

## 类型定义

```typescript
export interface LoadedDocument {
  content: string
  source: string
  metadata: Record<string, unknown>
}

export interface DocumentChunk {
  content: string
  source: string
  metadata: Record<string, unknown>
  chunkIndex: number
  startOffset: number
  endOffset: number
}

export interface RetrievalResult {
  document: Document
  score: number
  relevantChunk?: string
}

export interface DocumentLoader {
  load(source: string): Promise<LoadedDocument[]>
  loadDirectory?(dir: string, options?: LoadDirectoryOptions): Promise<LoadedDocument[]>
  loadFromString?(
    content: string,
    metadata?: LoadedDocument['metadata']
  ): Promise<LoadedDocument>
}

export interface TextSplitter {
  split(document: LoadedDocument): Promise<DocumentChunk[]>
  splitText(text: string): Promise<string[]>
}

export interface Retriever {
  retrieve(query: string, options?: RetrievalOptions): Promise<RetrievalResult[]>
}
```
