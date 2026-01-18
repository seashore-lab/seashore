# 嵌入

嵌入用于语义搜索和 RAG。

Seashore 提供嵌入适配器和辅助函数：

- `openaiEmbed(model, dimensions, options)`
- `generateBatchEmbeddings({ adapter, input })`

## 示例（来自 RAG 演示）

请参阅 [examples/src/04-basic-rag.ts](../../examples/04-basic-rag.md)。

```ts
import { openaiEmbed, generateBatchEmbeddings } from '@seashorelab/llm'

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
