# @seashore/vectordb

Vector database with PostgreSQL pgvector and hybrid search capabilities.

## Installation

```bash
pnpm add @seashore/vectordb
```

Required dependencies:
```bash
pnpm add @seashore/storage @seashore/llm
```

Requires PostgreSQL with pgvector extension:
```bash
CREATE EXTENSION IF NOT EXISTS vector;
```

## Overview

`@seashore/vectordb` provides:

- Vector storage with HNSW indexing
- Semantic similarity search
- Full-text search with tsvector
- Hybrid search combining vector and text
- Collection and document management
- Automatic embedding generation

## Quick Start

### Creating a Vector Store

```typescript
import { createVectorStore } from '@seashore/vectordb'
import { openaiEmbed } from '@seashore/llm'
import { createDatabase } from '@seashore/storage'

const db = createDatabase({ connectionString: process.env.DATABASE_URL })

const vectorStore = createVectorStore({
  db,
  embeddingAdapter: openaiEmbed('text-embedding-3-small'),
  defaultCollection: 'knowledge-base',
})
```

### Adding and Searching Documents

```typescript
// Add a document (embedding auto-generated)
const doc = await vectorStore.addDocument({
  content: 'TypeScript is a typed superset of JavaScript...',
  title: 'TypeScript Guide',
  source: 'https://example.com/ts',
  metadata: { category: 'programming', language: 'typescript' },
})

// Vector similarity search
const results = await vectorStore.search({
  query: 'What is TypeScript?',
  collection: 'knowledge-base',
  topK: 5,
  minScore: 0.7,
})

for (const result of results) {
  console.log(`Score: ${result.score}`)
  console.log(`Content: ${result.document.content}`)
}
```

## API Reference

### createVectorStore

Creates a vector store instance.

```typescript
function createVectorStore(config: VectorStoreConfig): VectorStore
```

#### Configuration

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `db` | `Database` | Yes | Database instance |
| `embeddingAdapter` | `EmbeddingAdapter` | Yes | For generating embeddings |
| `defaultCollection` | `string` | No | Default collection name |
| `chunkSize` | `number` | No | Batch embedding size (default: 100) |
| `dimensions` | `number` | No | Vector dimensions (default: 1536) |

### Collection Management

```typescript
// Create collection
const collection = await vectorStore.createCollection({
  name: 'knowledge-base',
  description: 'Company knowledge base',
  dimensions: 1536,
  metadata: { source: 'confluence' },
})

// Get collection
const found = await vectorStore.getCollection('knowledge-base')

// List all collections
const collections = await vectorStore.listCollections()

// Delete collection (cascades to documents)
await vectorStore.deleteCollection('knowledge-base')
```

### Document Operations

#### addDocument()

```typescript
const doc = await vectorStore.addDocument({
  content: string,
  title?: string,
  source?: string,
  metadata?: Record<string, unknown>,
  embedding?: number[], // Optional: pre-computed
}, collectionName?)
```

#### addDocuments()

```typescript
const docs = await vectorStore.addDocuments([
  { content: 'Doc 1', title: 'First' },
  { content: 'Doc 2', title: 'Second' },
  { content: 'Doc 3', title: 'Third' },
], 'knowledge-base')
```

#### updateDocument()

```typescript
await vectorStore.updateDocument(docId, {
  content: 'Updated content...',
  metadata: { updated: true },
})
// Embedding auto-recalculated
```

#### deleteDocument()

```typescript
// Delete single
await vectorStore.deleteDocument(docId)

// Batch delete
await vectorStore.deleteDocuments([docId1, docId2, docId3])

// Conditional delete
await vectorStore.deleteDocuments({
  collection: 'knowledge-base',
  where: { source: 'https://old-source.com' },
})
```

## Search Methods

### vectorSearch()

Pure semantic similarity search.

```typescript
import { vectorSearch } from '@seashore/vectordb'

const results = await vectorSearch({
  store: vectorStore,
  query: 'How to configure TypeScript?',
  collection: 'knowledge-base',
  topK: 5,
  minScore: 0.7,
  filter: {
    category: 'tech',
  },
})
```

Returns:
```typescript
Array<{
  document: Document
  score: number // 0-1 similarity
  distance?: number // Raw distance
}>
```

### textSearch()

Full-text search with PostgreSQL tsvector.

```typescript
import { textSearch } from '@seashore/vectordb'

const results = await textSearch({
  store: vectorStore,
  query: 'TypeScript config',
  collection: 'knowledge-base',
  topK: 10,
  language: 'english',
})
```

Advanced query syntax:
```typescript
// Phrase search
await textSearch({
  query: '"exact phrase"',
  store: vectorStore,
})

// AND search
await textSearch({
  query: 'typescript & react',
  store: vectorStore,
})

// OR search
await textSearch({
  query: 'typescript | javascript',
  store: vectorStore,
})

// NOT search
await textSearch({
  query: 'typescript & !javascript',
  store: vectorStore,
})
```

### hybridSearch()

Combines vector and text search.

```typescript
import { hybridSearch } from '@seashore/vectordb'

const results = await hybridSearch({
  store: vectorStore,
  query: 'How to configure TypeScript?',
  collection: 'knowledge-base',
  topK: 10,

  // Weight configuration
  vectorWeight: 0.7,
  textWeight: 0.3,

  // Fusion algorithm
  fusion: 'weighted', // 'weighted' | 'rrf'

  // Metadata filter
  filter: {
    category: 'tech',
  },
})
```

## Schema Definitions

### collections

```typescript
{
  id: string // UUID
  name: string // Unique
  description: string | null
  dimensions: number // Default: 1536
  metadata: Record<string, unknown> | null
  createdAt: Date
}
```

### documents

```typescript
{
  id: string // UUID
  collectionId: string // FK to collections
  content: string
  embedding: number[] | null // pgvector
  title: string | null
  source: string | null
  metadata: Record<string, unknown> | null
  createdAt: Date
}
```

## HNSW Indexing

The package automatically creates HNSW indexes for vector search:

```sql
CREATE INDEX documents_embedding_idx
ON documents
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

Configure search parameters:
```sql
SET hnsw.ef_search = 100;
```

## Vector Search SQL

### Similarity Search

```sql
SELECT
  id, content, title, metadata,
  1 - (embedding <=> $1::vector) as score
FROM documents
WHERE collection_id = $2
  AND (embedding <=> $1::vector) < (1 - $3)
ORDER BY embedding <=> $1::vector
LIMIT $4;
```

### Hybrid Search

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

## Best Practices

1. **Choose appropriate dimensions**: 1536 for OpenAI, 768 for many others
2. **Tune HNSW parameters**: Balance speed vs accuracy
3. **Use hybrid search** for better relevance on keyword-heavy queries
4. **Filter by metadata** to reduce search space
5. **Batch embeddings** for efficiency (100-500 docs at a time)

## See Also

- [RAG Package](rag.md)
- [LLM Package](llm.md)
- [Storage Package](storage.md)
