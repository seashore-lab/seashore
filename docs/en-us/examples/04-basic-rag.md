# Example 04: Basic RAG

Source: `examples/src/04-basic-rag.ts`

## What it demonstrates

- Loading a markdown knowledge base from a string
- Splitting into chunks using a markdown-aware splitter
- Embedding chunks via `@seashore/llm` embeddings
- In-memory retrieval using vector similarity

## How to run

```bash
pnpm --filter @seashore/examples exec tsx src/04-basic-rag.ts
```

## Key concepts

- RAG overview: [advanced/rag.md](../advanced/rag.md)
- Loaders: [advanced/rag/loaders.md](../advanced/rag/loaders.md)
- Splitters: [advanced/rag/splitters.md](../advanced/rag/splitters.md)
- Retrievers: [advanced/rag/retrievers.md](../advanced/rag/retrievers.md)
