# RAG 管道

如果您需要端到端的"提问并获得答案"API，请使用管道辅助工具。

在高级别：

- 您配置向量存储和文本模型。
- 管道检索上下文（向量/文本/混合）。
- 它构建上下文感知的提示。
- 它生成答案并返回源/引用。

## 创建管道

```ts
import { createRAG } from '@seashorelab/rag'
import { createVectorStore } from '@seashorelab/vectordb'
import { openaiText, openaiEmbed } from '@seashorelab/llm'

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

## 查询

```ts
const result = await rag.query('What is X?')
console.log(result.answer)
console.log(result.sources)
```

## 流式传输

```ts
for await (const chunk of rag.queryStream('Explain Y')) {
  if (chunk.type === 'text') process.stdout.write(chunk.content ?? '')
  if (chunk.type === 'sources') console.log('\nSources:', chunk.sources)
}
```

## 提示构建和引用

如果您需要更多控制（自定义引用格式、不同的上下文布局），请查看：

- `buildRAGPrompt`
- `createCitations`
- `createRAGChain`

当您想将 RAG 集成到工作流节点时，这些很有用。
