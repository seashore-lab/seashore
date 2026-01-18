# Google Gemini

Gemini 文本适配器使用 `geminiText()` 创建。

## 环境

- `GOOGLE_API_KEY`

## 示例

```ts
import { geminiText } from '@seashorelab/llm'

const model = geminiText('gemini-2.0-flash', {
  apiKey: process.env.GOOGLE_API_KEY,
})
```
