# Token 计数

Token 计数让您能够：

- 估算提示词预算
- 近似成本
- 检测上下文失控增长

## 基本用法

```ts
import { createTokenCounter } from '@seashore/observability'

const counter = createTokenCounter({ defaultEncoding: 'cl100k_base' })
const inputTokens = counter.count('Hello')
```

示例 09 在 `agent.run()` 前后使用 Token 估算。
