# Token Counting

Token counting lets you:

- estimate prompt budgets
- approximate costs
- detect runaway context growth

## Basic usage

```ts
import { createTokenCounter } from '@seashorelab/observability'

const counter = createTokenCounter({ defaultEncoding: 'cl100k_base' })
const inputTokens = counter.count('Hello')
```

Example 09 uses token estimation before and after `agent.run()`.
