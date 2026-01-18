# Google Gemini

Gemini text adapters are created with `geminiText()`.

## Environment

- `GOOGLE_API_KEY`

## Example

```ts
import { geminiText } from '@seashorelab/llm'

const model = geminiText('gemini-2.0-flash', {
  apiKey: process.env.GOOGLE_API_KEY,
})
```
