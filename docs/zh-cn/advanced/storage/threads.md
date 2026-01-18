# 线程和消息

线程和消息提供持久的对话历史。

## 线程存储库

```ts
import { createDatabase, createThreadRepository } from '@seashorelab/storage'

const db = createDatabase({ connectionString: process.env.DATABASE_URL })
const threads = createThreadRepository(db)

const thread = await threads.create({
  agentId: 'my-agent',
  userId: 'user-123',
  title: '新对话',
})
```

## 消息存储库

```ts
import { createMessageRepository } from '@seashorelab/storage'

const messages = createMessageRepository(db)
await messages.create({
  threadId: thread.id,
  role: 'user',
  content: '你好！',
})
```

## 工具调用和工具结果

持久化工具调用 (`toolCalls`) 和工具结果 (`role: 'tool'`)，以便您可以重放运行和调试。
