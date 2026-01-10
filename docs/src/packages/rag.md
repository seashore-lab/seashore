# @seashore/rag

Retrieval-Augmented Generation pipeline with vector search and document processing.

## Installation

```bash
pnpm add @seashore/rag
```

Required peer dependencies:
```bash
pnpm add @seashore/vectordb @seashore/llm
```

## Overview

`@seashore/rag` provides:

- Document loaders (text, markdown, PDF, web)
- Text splitters for chunking
- Vector and hybrid retrievers
- RAG query pipeline
- Document ingestion and sync

## Quick Start

### Basic RAG

```typescript
import { createRAG } from '@seashore/rag'
import { createVectorStore } from '@seashore/vectordb'
import { openaiText, openaiEmbed } from '@seashore/llm'

const rag = createRAG({
  vectorStore: createVectorStore({
    db: database,
    embeddingAdapter: openaiEmbed('text-embedding-3-small'),
  }),
  llmAdapter: openaiText('gpt-4o'),
  collection: 'knowledge-base',
  systemPrompt: `Answer using this context:
{context}

If unsure, say "I don't have information about this."`,
})

// Query
const result = await rag.query('How do I configure TypeScript?')
console.log(result.answer)
console.log(result.sources)
```

### Ingest Documents

```typescript
import { createMarkdownLoader, createRecursiveSplitter } from '@seashore/rag'

await rag.ingest({
  loader: createMarkdownLoader(),
  splitter: createRecursiveSplitter({ chunkSize: 1000 }),
  source: './docs',
  glob: '**/*.md',
})
```

## API Reference

### createRAG

Creates a RAG pipeline instance.

```typescript
function createRAG(config: RAGConfig): RAG
```

#### Configuration

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `vectorStore` | `VectorStore` | Yes | Vector database instance |
| `llmAdapter` | `TextAdapter` | Yes | LLM for generating answers |
| `collection` | `string` | Yes | Vector collection name |
| `retrieval.type` | `'vector' \| 'text' \| 'hybrid'` | No | Retrieval type (default: `'hybrid'`) |
| `retrieval.topK` | `number` | No | Number of results (default: `5`) |
| `retrieval.minScore` | `number` | No | Minimum similarity (default: `0.7`) |
| `systemPrompt` | `string` | No | Template with `{context}` placeholder |

### RAG Methods

#### query()

Execute a RAG query.

```typescript
const result = await rag.query('Query text', {
  topK?: number,
  filter?: Record<string, unknown>,
})
```

Returns:
```typescript
{
  answer: string
  sources: Array<{
    document: Document
    score: number
    relevantChunk: string
  }>
  usage?: TokenUsage
}
```

#### queryStream()

Streaming RAG query.

```typescript
for await (const chunk of rag.queryStream('Query text')) {
  if (chunk.type === 'text') {
    process.stdout.write(chunk.content)
  } else if (chunk.type === 'sources') {
    console.log('Sources:', chunk.sources)
  }
}
```

#### ingest()

Load and index documents.

```typescript
await rag.ingest({
  loader: DocumentLoader,
  splitter: TextSplitter,
  source: string | string[],
  glob?: string,
})
```

## Document Loaders

### createTextLoader

```typescript
import { createTextLoader } from '@seashore/rag'

const loader = createTextLoader()

// From file
const docs = await loader.load('./document.txt')

// From string
const doc = await loader.loadFromString('Hello World', {
  source: 'manual',
  metadata: { type: 'greeting' },
})
```

### createMarkdownLoader

```typescript
import { createMarkdownLoader } from '@seashore/rag'

const loader = createMarkdownLoader({
  extractFrontmatter: true,
  removeCodeBlocks: false,
  extractHeadings: true,
})

const docs = await loader.load('./README.md')
// Includes metadata.frontmatter and metadata.headings
```

### createPDFLoader

```typescript
import { createPDFLoader } from '@seashore/rag'

const loader = createPDFLoader({
  splitPages: true,
  extractImages: false,
})

const docs = await loader.load('./document.pdf')
```

### createWebLoader

```typescript
import { createWebLoader } from '@seashore/rag'

const loader = createWebLoader({
  firecrawlApiKey: process.env.FIRECRAWL_API_KEY,
  selector: 'article',
  removeSelectors: ['nav', 'footer', '.ads'],
  timeout: 10000,
})

const docs = await loader.load('https://example.com/article')
```

### Load Directory

```typescript
const loader = createMarkdownLoader()

const docs = await loader.loadDirectory('./docs', {
  glob: '**/*.md',
  recursive: true,
  ignore: ['**/node_modules/**'],
})
```

## Text Splitters

### createRecursiveSplitter

Recommended for most use cases:

```typescript
import { createRecursiveSplitter } from '@seashore/rag'

const splitter = createRecursiveSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ['\n\n', '\n', ' ', ''],
})

const chunks = await splitter.split(document)
```

### createTokenSplitter

For token-based splitting:

```typescript
import { createTokenSplitter } from '@seashore/rag'

const splitter = createTokenSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
  encoding: 'cl100k_base', // OpenAI tokenizer
})
```

### createMarkdownSplitter

Preserves markdown structure:

```typescript
import { createMarkdownSplitter } from '@seashore/rag'

const splitter = createMarkdownSplitter({
  chunkSize: 1000,
  chunkOverlap: 100,
  headingSeparators: ['#', '##', '###'],
  preserveCodeBlocks: true,
})
```

## Retrievers

### createVectorRetriever

Pure vector similarity search:

```typescript
import { createVectorRetriever } from '@seashore/rag'

const retriever = createVectorRetriever({
  vectorStore,
  collection: 'docs',
  topK: 5,
  minScore: 0.7,
})

const results = await retriever.retrieve('query text')
```

### createHybridRetriever

Combines vector and full-text search:

```typescript
import { createHybridRetriever } from '@seashore/rag'

const retriever = createHybridRetriever({
  vectorStore,
  collection: 'docs',
  topK: 10,
  vectorWeight: 0.7,
  textWeight: 0.3,
  fusion: 'rrf', // Reciprocal rank fusion
})
```

### createContextualRetriever

LLM-enhanced retrieval with query expansion:

```typescript
import { createContextualRetriever } from '@seashore/rag'

const retriever = createContextualRetriever({
  vectorStore,
  llmAdapter: openaiText('gpt-4o-mini'),
  collection: 'docs',
  topK: 5,
  multiQuery: true,
  numQueries: 3,
})
```

## Best Practices

1. **Chunk size**: 500-1000 characters for most text
2. **Overlap**: 10-20% of chunk size
3. **TopK**: 3-10 results typically sufficient
4. **Use hybrid retrieval** for better relevance
5. **Split by structure** when possible (markdown headers, code blocks)

## See Also

- [RAG Tutorial](../tutorials/rag-pipeline.md)
- [VectorDB Package](vectordb.md)
- [LLM Package](llm.md)
