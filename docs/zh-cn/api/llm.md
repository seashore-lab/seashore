# API 参考：LLM

包：`@seashorelab/llm`

Seashore 使用"适配器"以便 agent 和工作流可以交换提供商。

## 文本适配器

- `openaiText(model, options)`
- Anthropic 和 Gemini 适配器（见核心文档）

## 嵌入

- `openaiEmbed(model, dimensions?, options)`
- `generateBatchEmbeddings({ adapter, input })`

参见：

- [core/llm.md](../core/llm.md)
- [core/llm/embeddings.md](../core/llm/embeddings.md)
- [examples/04-basic-rag.md](../examples/04-basic-rag.md)
