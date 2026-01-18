# Logging

Use `createLogger` for consistent structured logs.

## Basic usage

```ts
import { createLogger } from '@seashore/observability'

const logger = createLogger({
  name: 'my-service',
  level: 'info',
  format: 'json',
})

logger.info('request received', { path: '/api/chat' })
```

## Development usage (pretty output)

Example 09 uses `format: 'pretty'` and `level: 'debug'`.

## Child loggers

Use `logger.child(...)` to add stable context fields (agentId, threadId) without repeating them.
