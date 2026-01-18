# Anthropic

Anthropic 文本适配器使用 `anthropicText()` 创建。

## 环境

- `ANTHROPIC_API_KEY`

## 示例

```ts
import { anthropicText } from '@seashore/llm'

const model = anthropicText('claude-sonnet-4', {
  apiKey: process.env.ANTHROPIC_API_KEY,
})
```
