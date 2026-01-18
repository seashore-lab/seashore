# RAG (Retrieval-Augmented Generation)

RAG enhances model responses by retrieving relevant context (documents/chunks) before generating an answer. In Seashore, the RAG module gives you:

- Document loaders (files, strings, web)
- Splitters (markdown-aware, token-based, recursive)
- Retrievers (in-memory, pgvector-backed, hybrid)
- A higher-level pipeline (`createRAG`) when you want “query → retrieve → answer” in one call

This chapter is example-driven. If you prefer a runnable reference, see the RAG example: [examples/04-basic-rag.md](../examples/04-basic-rag.md).

## The mental model

Most RAG systems have two phases:

1. **Indexing**: load → split → embed → store
2. **Querying**: embed query → retrieve chunks → build prompt → generate answer

Seashore supports both “build your own pipeline” and “use a ready-to-go pipeline”.

## Quick start (matches Example 04)

```ts
import 'dotenv/config'
import {
  createMarkdownStringLoader,
  createMarkdownSplitter,
  createInMemoryRetriever,
  type DocumentChunk,
} from '@seashorelab/rag'
import { openaiEmbed, generateBatchEmbeddings } from '@seashorelab/llm'

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

## Next steps

- Loaders: [advanced/rag/loaders.md](./rag/loaders.md)
- Splitters: [advanced/rag/splitters.md](./rag/splitters.md)
- Retrievers: [advanced/rag/retrievers.md](./rag/retrievers.md)
- Pipeline: [advanced/rag/pipeline.md](./rag/pipeline.md)

## Retrievers

### In-Memory Retriever

Fast, in-memory vector search:

```typescript
import { createInMemoryRetriever } from '@seashorelab/rag'

const retriever = createInMemoryRetriever(embeddingFn, {
  scoreThreshold: 0.7, // Minimum similarity score
})

await retriever.addDocuments(chunks)

const results = await retriever.retrieve('query', {
  k: 5,
  searchType: 'vector',
})
```

### Database Retriever

Persistent vector search with PostgreSQL + pgvector:

```typescript
import { createDatabaseRetriever } from '@seashorelab/rag'
import { createVectorStore } from '@seashorelab/vectordb'

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

## Search Types

### Vector Search

Pure semantic similarity:

```typescript
const results = await retriever.retrieve('machine learning', {
  k: 5,
  searchType: 'vector',
})
```

### Full-Text Search

Keyword-based search:

```typescript
const results = await retriever.retrieve('machine learning', {
  k: 5,
  searchType: 'fulltext',
})
```

### Hybrid Search

Combine vector and keyword search:

```typescript
import { hybridSearch } from '@seashorelab/vectordb'

const results = await hybridSearch({
  vectorStore,
  query: 'machine learning',
  k: 5,
  alpha: 0.7, // 0=fulltext only, 1=vector only, 0.5=balanced
})
```

## Metadata Filtering

Filter by metadata:

```typescript
await retriever.addDocuments([
  {
    content: 'Python tutorial',
    metadata: { language: 'python', difficulty: 'beginner' },
  },
  {
    content: 'TypeScript tutorial',
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

## Using RAG with Agents

### Manual RAG

```typescript
import { createAgent } from '@seashorelab/agent'
import { openaiText } from '@seashorelab/llm'

const agent = createAgent({
  name: 'assistant',
  model: openaiText('gpt-4o'),
  systemPrompt: 'Answer questions using the provided context.',
})

// Retrieve relevant documents
const relevantDocs = await retriever.retrieve(userQuestion, { k: 3 })

// Build context
const context = relevantDocs.map(doc => doc.content).join('\n\n')

// Query with context
const result = await agent.run(`
Context:
${context}

Question: ${userQuestion}

Answer the question based only on the context provided.
`)
```

### RAG Tool

Create a tool that retrieves information:

```typescript
import { defineTool } from '@seashorelab/tool'
import { z } from 'zod'

const retrievalTool = defineTool({
  name: 'search_knowledge_base',
  description: 'Search the knowledge base for relevant information',
  inputSchema: z.object({
    query: z.string().describe('Search query'),
    k: z.number().default(3).describe('Number of results'),
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
  systemPrompt: 'Use the search tool to find relevant information before answering.',
  tools: [retrievalTool],
})
```

## Advanced Patterns

### Re-ranking

Improve results with re-ranking:

```typescript
const initialResults = await retriever.retrieve(query, { k: 20 })

// Re-rank using a more sophisticated model
const reranked = await rerank(initialResults, query, {
  model: 'cross-encoder',
  topK: 5,
})
```

### Parent Document Retrieval

Retrieve chunks but return full parent documents:

```typescript
const chunks = await splitter.split(document)

// Store parent reference
const chunksWithParent = chunks.map(chunk => ({
  ...chunk,
  metadata: {
    ...chunk.metadata,
    parentId: document.id,
  },
}))

await retriever.addDocuments(chunksWithParent)

// Retrieve and expand to parent
const results = await retriever.retrieve(query, { k: 5 })
const parentDocs = await getParentDocuments(results)
```

### Multi-Query

Generate multiple variations of a query:

```typescript
// Generate query variations
const variations = await agent.run(`
Generate 3 variations of this query: "${originalQuery}"
Format as JSON array.
`)

// Search with all variations
const allResults = await Promise.all(
  variations.map(q => retriever.retrieve(q, { k: 3 }))
)

// Deduplicate and combine
const combined = deduplicateResults(allResults.flat())
```

### Contextual Compression

Compress retrieved documents:

```typescript
const retrieved = await retriever.retrieve(query, { k: 5 })

// Compress each document to only relevant parts
const compressed = await Promise.all(
  retrieved.map(async doc => {
    const result = await agent.run(`
Extract only the parts of this text relevant to: "${query}"

Text: ${doc.content}
`)
    return { ...doc, content: result.content }
  })
)
```

## Document Chunk Structure

```typescript
interface DocumentChunk {
  content: string              // Chunk text
  metadata: {
    source?: string           // Source file/URL
    title?: string            // Document title
    chunkIndex?: number       // Position in document
    [key: string]: any        // Custom metadata
  }
  embedding?: number[]        // Vector embedding
  score?: number              // Relevance score (when retrieved)
}
```

## Best Practices

1. **Chunk Size**: 
   - Small chunks (200-500 chars): More precise retrieval
   - Large chunks (1000+ chars): More context but less precise

2. **Overlap**: 10-20% overlap prevents splitting related content

3. **Metadata**: Add rich metadata for filtering and source attribution

4. **Embeddings**: Use latest models (text-embedding-3-small/large)

5. **Hybrid Search**: Combine vector + keyword for best results

6. **Caching**: Cache embeddings to avoid regenerating

7. **Updates**: Rebuild index when documents change significantly

8. **Quality**: Clean and structure documents before indexing

## Performance Tips

```typescript
// Batch processing
const chunks = await Promise.all(
  documents.map(doc => splitter.split(doc))
).then(results => results.flat())

// Parallel embedding
const BATCH_SIZE = 100
const batches = chunkArray(chunks, BATCH_SIZE)
for (const batch of batches) {
  await retriever.addDocuments(batch)
}

// Connection pooling for database retriever
const vectorStore = await createVectorStore({
  db: drizzle(postgres(connectionString, { max: 20 })),
  // ...
})
```

## Next Steps

- [Document Loaders](./rag/loaders.md) - All loader types
- [Text Splitters](./rag/splitters.md) - Splitting strategies
- [Retrievers](./rag/retrievers.md) - Retrieval methods
- [RAG Pipeline](./rag/pipeline.md) - Complete pipeline setup

## Examples

- [04: Basic RAG](../examples/04-basic-rag.md) - In-memory RAG
- [13: Vector DB Hybrid Search](../examples/13-vectordb-hybrid-search.md) - PostgreSQL + pgvector
