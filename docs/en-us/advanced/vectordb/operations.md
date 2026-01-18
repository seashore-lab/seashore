# Vector Operations

## Creating a store

```ts
import { createVectorStore } from '@seashorelab/vectordb'
import { openaiEmbed } from '@seashorelab/llm'

const store = createVectorStore({
  db,
  embeddingAdapter: openaiEmbed('text-embedding-3-small'),
  defaultCollection: 'default',
})
```

## Collections

```ts
await store.createCollection({ name: 'knowledge-base' })
const all = await store.listCollections()
```

## Documents

```ts
await store.addDocument({ content: 'hello', title: 'Greeting' }, 'knowledge-base')
```

## Search

- `vectorSearch` for semantic search
- `textSearch` / `prefixTextSearch` for lexical search
- `hybridSearch` for a combined approach
