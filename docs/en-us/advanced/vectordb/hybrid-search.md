# Hybrid Search

Hybrid search combines:

- vector similarity (semantic)
- full-text / prefix matching (lexical)

This improves recall for:

- named entities
- acronyms
- exact phrases

## Using hybrid search

```ts
import { hybridSearch } from '@seashorelab/vectordb'

const results = await hybridSearch({
  store: vectorStore,
  query: 'kubernetes autoscaling',
  collection: 'knowledge-base',
  topK: 10,
  vectorWeight: 0.7,
  textWeight: 0.3,
})
```

See the hybrid search example for a complete runnable setup.
