# Long-Term Memory

Long-term memory is durable storage of:

- user preferences
- stable facts
- important decisions

It is usually backed by a database and can optionally support vector search so you can recall by meaning, not just keys.

## LongTermMemory vs MemoryManager

- `createLongTermMemory` is a store abstraction.
- `createMemoryManager` coordinates storage, importance, and embedding.

## Creating long-term memory

```ts
import { createLongTermMemory } from '@seashorelab/memory'

const longTerm = createLongTermMemory({
  db,
  // optional: embeddingAdapter: openaiEmbed('text-embedding-3-small'),
})
```

## Semantic recall

If embeddings are enabled, you can query by meaning (e.g. “what does the user prefer?”) instead of exact keys.

## Importance

In practice, you only store items above a threshold. The memory module provides importance evaluators to help decide what becomes long-term.
