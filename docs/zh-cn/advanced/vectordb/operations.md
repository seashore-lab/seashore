# 向量操作

## 创建存储

```ts
import { createVectorStore } from '@seashore/vectordb'
import { openaiEmbed } from '@seashore/llm'

const store = createVectorStore({
  db,
  embeddingAdapter: openaiEmbed('text-embedding-3-small'),
  defaultCollection: 'default',
})
```

## 集合

```ts
await store.createCollection({ name: 'knowledge-base' })
const all = await store.listCollections()
```

## 文档

```ts
await store.addDocument({ content: 'hello', title: 'Greeting' }, 'knowledge-base')
```

## 搜索

- `vectorSearch` 用于语义搜索
- `textSearch` / `prefixTextSearch` 用于词法搜索
- `hybridSearch` 用于组合方法
