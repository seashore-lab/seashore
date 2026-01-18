# API 参考：RAG

包：`@seashorelab/rag`

## 加载器

示例：

- `createMarkdownStringLoader(...)`
- `createMarkdownLoader(...)`
- `createGlobLoader(...)`
- `createWebLoader(...)`

## 分割器

- `createMarkdownSplitter(...)`
- `createRecursiveSplitter(...)`
- `createTokenSplitter(...)`

## 检索器

- `createInMemoryRetriever(embeddingFn)`
- `createVectorRetriever(...)`
- `createHybridRetriever(...)`

## 流水线

- `createRAG(config)`
- `rag.query(...)` / `rag.queryStream(...)`

参见：

- [advanced/rag.md](../advanced/rag.md)
- [examples/04-basic-rag.md](../examples/04-basic-rag.md)
