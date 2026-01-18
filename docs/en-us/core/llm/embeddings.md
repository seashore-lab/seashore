# Embeddings

Embeddings are used for semantic search and RAG.

Seashore provides embedding adapters and helpers:

- `openaiEmbed(model, dimensions, options)`
- `generateBatchEmbeddings({ adapter, input })`

## Example (from the RAG demo)

See [examples/src/04-basic-rag.ts](../../examples/04-basic-rag.md).

```ts
import { openaiEmbed, generateBatchEmbeddings } from '@seashore/llm'

const embedder = openaiEmbed('text-embedding-3-small', 1536, {
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE_URL,
})

const result = await generateBatchEmbeddings({
  adapter: embedder,
  input: ['hello', 'world'],
})

console.log(result.embeddings)
```
