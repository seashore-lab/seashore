# API Reference: LLM

Package: `@seashorelab/llm`

Seashore uses “adapters” so agents and workflows can swap providers.

## Text adapters

- `openaiText(model, options)`
- Anthropic and Gemini adapters (see Core docs)

## Embeddings

- `openaiEmbed(model, dimensions?, options)`
- `generateBatchEmbeddings({ adapter, input })`

See:

- [core/llm.md](../core/llm.md)
- [core/llm/embeddings.md](../core/llm/embeddings.md)
- [examples/04-basic-rag.md](../examples/04-basic-rag.md)
