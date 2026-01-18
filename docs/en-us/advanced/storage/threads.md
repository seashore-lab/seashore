# Threads & Messages

Threads and messages provide a durable conversation history.

## Thread repository

```ts
import { createDatabase, createThreadRepository } from '@seashore/storage'

const db = createDatabase({ connectionString: process.env.DATABASE_URL })
const threads = createThreadRepository(db)

const thread = await threads.create({
  agentId: 'my-agent',
  userId: 'user-123',
  title: 'New Conversation',
})
```

## Message repository

```ts
import { createMessageRepository } from '@seashore/storage'

const messages = createMessageRepository(db)
await messages.create({
  threadId: thread.id,
  role: 'user',
  content: 'Hello!',
})
```

## Tool calls and tool results

Persist tool calls (`toolCalls`) and tool results (`role: 'tool'`) so you can replay runs and debug.
