# Retrievers

Retrievers take a user query and return the most relevant chunks. Seashore supports:

- In-memory vector retrieval (great for demos/tests)
- Vector-store backed retrieval (pgvector)
- Hybrid retrieval (vector + lexical)
- Multi-retriever composition

## In-memory retriever (Example 04)

```ts
import { createInMemoryRetriever } from '@seashorelab/rag'

const retriever = createInMemoryRetriever(embeddingFn)
await retriever.addDocuments(chunks)

const results = await retriever.retrieve('What is it?', {
  k: 3,
  searchType: 'vector',
})
```

## Vector retriever (pgvector-backed)

Use this when you want persistence and scalable retrieval.

```ts
import { createVectorRetriever } from '@seashorelab/rag'
import { createVectorStore } from '@seashorelab/vectordb'
import { openaiEmbed } from '@seashorelab/llm'

const vectorStore = createVectorStore({
  db,
  embeddingAdapter: openaiEmbed('text-embedding-3-small'),
  defaultCollection: 'kb',
})

const retriever = createVectorRetriever({
  store: vectorStore,
  collection: 'kb',
})
```

## Hybrid retriever

Hybrid retrieval combines vector similarity with text search for better recall.

```ts
import { createHybridRetriever } from '@seashorelab/rag'

const retriever = createHybridRetriever({
  store: vectorStore,
  collection: 'kb',
  vectorWeight: 0.7,
  textWeight: 0.3,
})
```

## Reranking and composition

For complex domains, consider:

- retrieving with multiple strategies (multi-retriever)
- reranking top-$k$ results with another model

```ts
import { createMultiRetriever, createRerankingRetriever } from '@seashorelab/rag'

const combined = createMultiRetriever([
  vectorRetriever,
  hybridRetriever,
])

const reranked = createRerankingRetriever({
  retriever: combined,
  // rerankerAdapter: ...
})
```

## Returned results

Retriever results are scored chunks (typically normalized 0–1). Keep the score around for:

- citations
- debugging “why did we retrieve this?”
- thresholding (`minScore`) to reduce low-quality context
