# 检索器

检索器接受用户查询并返回最相关的块。Seashore 支持：

- 内存向量检索（非常适合演示/测试）
- 向量存储支持的检索（pgvector）
- 混合检索（向量 + 词法）
- 多检索器组合

## 内存检索器（示例 04）

```ts
import { createInMemoryRetriever } from '@seashorelab/rag'

const retriever = createInMemoryRetriever(embeddingFn)
await retriever.addDocuments(chunks)

const results = await retriever.retrieve('What is it?', {
  k: 3,
  searchType: 'vector',
})
```

## 向量检索器（pgvector 支持）

当您需要持久化和可扩展的检索时使用此选项。

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

## 混合检索器

混合检索将向量相似度与文本搜索结合以获得更好的召回率。

```ts
import { createHybridRetriever } from '@seashorelab/rag'

const retriever = createHybridRetriever({
  store: vectorStore,
  collection: 'kb',
  vectorWeight: 0.7,
  textWeight: 0.3,
})
```

## 重排序和组合

对于复杂域，请考虑：

- 使用多种策略检索（多检索器）
- 使用另一个模型重新排列 top-$k$ 结果

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

## 返回的结果

检索器结果是已评分的块（通常归一化为 0–1）。保留分数以用于：

- 引用
- 调试"我们为什么要检索这个？"
- 阈值 (`minScore`) 以减少低质量上下文
