# 日志记录

使用 `createLogger` 进行一致的结构化日志记录。

## 基本用法

```ts
import { createLogger } from '@seashore/observability'

const logger = createLogger({
  name: 'my-service',
  level: 'info',
  format: 'json',
})

logger.info('request received', { path: '/api/chat' })
```

## 开发用法（漂亮输出）

示例 09 使用 `format: 'pretty'` 和 `level: 'debug'`。

## 子日志记录器

使用 `logger.child(...)` 添加稳定的上下文字段（agentId、threadId），而无需重复它们。
