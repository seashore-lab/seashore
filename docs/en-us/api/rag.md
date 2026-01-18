# API Reference: RAG

Package: `@seashorelab/rag`

## Loaders

Examples:

- `createMarkdownStringLoader(...)`
- `createMarkdownLoader(...)`
- `createGlobLoader(...)`
- `createWebLoader(...)`

## Splitters

- `createMarkdownSplitter(...)`
- `createRecursiveSplitter(...)`
- `createTokenSplitter(...)`

## Retrievers

- `createInMemoryRetriever(embeddingFn)`
- `createVectorRetriever(...)`
- `createHybridRetriever(...)`

## Pipeline

- `createRAG(config)`
- `rag.query(...)` / `rag.queryStream(...)`

See:

- [advanced/rag.md](../advanced/rag.md)
- [examples/04-basic-rag.md](../examples/04-basic-rag.md)
