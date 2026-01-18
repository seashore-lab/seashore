# Anthropic

Anthropic text adapters are created with `anthropicText()`.

## Environment

- `ANTHROPIC_API_KEY`

## Example

```ts
import { anthropicText } from '@seashorelab/llm'

const model = anthropicText('claude-sonnet-4', {
  apiKey: process.env.ANTHROPIC_API_KEY,
})
```
