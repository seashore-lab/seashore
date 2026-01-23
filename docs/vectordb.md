# @seashorelab/vectordb

This package provides vector database capabilities using PostgreSQL with the `pgvector` extension. It supports HNSW indexing, hybrid search (vector + full-text), and efficient similarity search.

## Collection Setup

Create a vector collection with HNSW indexing:

```ts
import { createCollection } from '@seashorelab/vectordb';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

const collection = await createCollection(db, {
  name: 'documents',
  description: 'Document embeddings for semantic search',
  dimensions: 1536, // OpenAI text-embedding-3-small dimension
  distanceMetric: 'cosine', // 'cosine' | 'l2' | 'innerproduct'
  hnswConfig: {
    m: 16, // Number of bi-directional links
    efConstruction: 64, // Size of candidate list during construction
  },
});
```

## Vector Store

Create a vector store for managing documents:

```ts
import { createVectorStore } from '@seashorelab/vectordb';
import { openaiEmbed } from '@seashorelab/llm';

const embeddingFunction = async (texts: string[]) => {
  const embedder = openaiEmbed('text-embedding-3-small', 1536, {
    apiKey: process.env.OPENAI_API_KEY,
  });
  const result = await generateBatchEmbeddings({
    adapter: embedder,
    input: texts,
  });
  return result.embeddings;
};

const store = await createVectorStore({
  db,
  collectionName: 'documents',
  embeddings: embeddingFunction,
  createIfNotExists: true,
});

// Add documents
await store.addDocuments([
  {
    content: 'Machine learning is a subset of AI...',
    embedding: await embeddingFunction(['Machine learning is...'])[0],
    metadata: { topic: 'AI', category: 'intro' },
  },
]);

// Get collection statistics
const stats = await store.getStats();
console.log(`Documents: ${stats.documentCount}`);
```

## Vector Search

Perform similarity search using vector embeddings:

```ts
import { vectorSearch } from '@seashorelab/vectordb';

const query = 'What is artificial intelligence?';
const queryEmbedding = await embeddingFunction([query])[0];

const results = await vectorSearch(db, collection, queryEmbedding, {
  limit: 5,
  // Filter by metadata
  filter: {
    category: 'intro',
  },
});

results.documents.forEach((doc) => {
  console.log(`Score: ${(doc.score * 100).toFixed(1)}%`);
  console.log(`Content: ${doc.document.content}`);
});
```

## Text Search

Perform full-text search on document content:

```ts
import { textSearch } from '@seashorelab/vectordb';

const results = await textSearch(db, collection, 'machine learning AI', {
  limit: 10,
  prefixSearch: true, // Enable prefix matching
});

results.documents.forEach((doc) => {
  console.log(`Rank: ${doc.rank}`);
  console.log(`Headline: ${doc.document.headline}`);
});
```

## Hybrid Search

Combine vector and text search with Reciprocal Rank Fusion (RRF):

```ts
import { hybridSearch } from '@seashorelab/vectordb';

const query = 'neural networks explained';
const queryEmbedding = await embeddingFunction([query])[0];

const results = await hybridSearch(db, collection, query, queryEmbedding, {
  limit: 5,
  vectorWeight: 0.7, // 70% vector, 30% text
  rrfK: 60, // RRF constant
  minScore: 0.1, // Minimum score threshold
});

results.documents.forEach((doc) => {
  console.log(`RRF Score: ${(doc.score * 100).toFixed(1)}%`);
  console.log(`Content: ${doc.document.content.substring(0, 100)}...`);
});
```

## Document Management

Update and delete documents:

```ts
// Update a document
await store.updateDocuments([
  {
    id: docId,
    content: 'Updated content...',
    embedding: newEmbedding,
    metadata: { ...oldMetadata, updated: true },
  },
]);

// Delete documents
await store.deleteDocuments([docId1, docId2]);

// Delete all documents in collection
await store.clear();
```

## Collection Management

List and manage collections:

```ts
import { listCollections, getCollection, deleteCollection } from '@seashorelab/vectordb';

// List all collections
const collections = await listCollections(db);

// Get a specific collection
const collection = await getCollection(db, 'documents');

// Delete a collection
await deleteCollection(db, 'documents');
```

## Advanced Search Options

### Metadata Filtering

Filter search results by metadata:

```ts
const results = await vectorSearch(db, collection, embedding, {
  limit: 10,
  filter: {
    topic: 'AI',
    category: ['intro', 'tutorial'], // Array = OR condition
  },
});
```

### Distance Metrics

Choose the appropriate distance metric:

- **cosine**: Best for normalized embeddings (most common)
- **l2**: Euclidean distance for raw embeddings
- **innerproduct**: Negative inner product (faster but requires normalized vectors)

```ts
const collection = await createCollection(db, {
  name: 'documents',
  dimensions: 1536,
  distanceMetric: 'cosine',
});
```

### HNSW Tuning

Configure HNSW index for performance vs accuracy trade-off:

```ts
const collection = await createCollection(db, {
  name: 'documents',
  dimensions: 1536,
  distanceMetric: 'cosine',
  hnswConfig: {
    m: 32, // Higher = more accurate, slower, more memory
    efConstruction: 128, // Higher = better index quality, slower build
  },
});
```

## Batch Operations

Perform operations in batches for efficiency:

```ts
import { batchVectorSearch } from '@seashorelab/vectordb';

const queries = ['query 1', 'query 2', 'query 3'];
const embeddings = await embeddingFunction(queries);

const results = await batchVectorSearch(db, collection, embeddings, {
  limit: 5,
});

// results.length === queries.length
results.forEach((queryResults, i) => {
  console.log(`Query ${i}: ${queryResults.documents.length} results`);
});
```

## Search Suggestions

Get autocomplete suggestions for search queries:

```ts
import { getSearchSuggestions } from '@seashorelab/vectordb';

const suggestions = await getSearchSuggestions(db, collection, 'machine', {
  limit: 5,
});

console.log(suggestions); // ['machine learning', 'machine learning models', ...]
```
