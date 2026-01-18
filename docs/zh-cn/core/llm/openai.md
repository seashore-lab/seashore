# OpenAI

OpenAI 文本适配器使用 `openaiText()` 创建。

## 环境

- `OPENAI_API_KEY`（必需）
- `OPENAI_API_BASE_URL`（可选；默认为 `https://api.openai.com/v1`）

## 示例

```ts
import { openaiText } from '@seashorelab/llm'

const model = openaiText('gpt-5.1', {
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE_URL,
})
```

此适配器可以传递给：

- `createAgent({ model })`
- `createLLMNode({ model })`
