# Example 13: Vector DB Hybrid Search

Source: `examples/src/13-vectordb-hybrid-search.ts`

## What it demonstrates

- Starting a pgvector-enabled Postgres container
- Creating a collection with HNSW indexing
- Adding documents with embeddings
- Running hybrid search (vector + full-text with RRF)

## Prerequisites

- Docker running locally

## How to run

```bash
pnpm --filter @seashorelab/examples exec tsx src/13-vectordb-hybrid-search.ts
```

## Key concepts

- Vector DB overview: [advanced/vectordb.md](../advanced/vectordb.md)
- Hybrid search: [advanced/vectordb/hybrid-search.md](../advanced/vectordb/hybrid-search.md)
