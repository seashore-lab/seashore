# RAG Pipeline

If you want an end-to-end “ask a question and get an answer” API, use the pipeline helpers.

At a high level:

- You configure a vector store and a text model.
- The pipeline retrieves context (vector/text/hybrid).
- It builds a context-aware prompt.
- It generates an answer and returns sources/citations.

## Creating a pipeline

```ts
import { createRAG } from '@seashore/rag'
import { createVectorStore } from '@seashore/vectordb'
import { openaiText, openaiEmbed } from '@seashore/llm'

const rag = createRAG({
  vectorStore: createVectorStore({
    db,
    embeddingAdapter: openaiEmbed('text-embedding-3-small'),
    defaultCollection: 'knowledge-base',
  }),
  llmAdapter: openaiText('gpt-4o'),
  collection: 'knowledge-base',
  retrieval: {
    type: 'hybrid',
    topK: 5,
    minScore: 0.7,
    vectorWeight: 0.7,
    textWeight: 0.3,
  },
})
```

## Querying

```ts
const result = await rag.query('What is X?')
console.log(result.answer)
console.log(result.sources)
```

## Streaming

```ts
for await (const chunk of rag.queryStream('Explain Y')) {
  if (chunk.type === 'text') process.stdout.write(chunk.content ?? '')
  if (chunk.type === 'sources') console.log('\nSources:', chunk.sources)
}
```

## Prompt building and citations

If you need more control (custom citation format, different context layout), look at:

- `buildRAGPrompt`
- `createCitations`
- `createRAGChain`

These are useful when you want to integrate RAG into a Workflow node.
