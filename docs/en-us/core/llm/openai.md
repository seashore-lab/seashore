# OpenAI

OpenAI text adapters are created with `openaiText()`.

## Environment

- `OPENAI_API_KEY` (required)
- `OPENAI_API_BASE_URL` (optional; defaults to `https://api.openai.com/v1`)

## Example

```ts
import { openaiText } from '@seashore/llm'

const model = openaiText('gpt-5.1', {
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE_URL,
})
```

This adapter can be passed to:

- `createAgent({ model })`
- `createLLMNode({ model })`
