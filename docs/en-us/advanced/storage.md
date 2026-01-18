# Storage & Persistence

The Storage module (`@seashore/storage`) provides:

- PostgreSQL + Drizzle database setup
- schemas for threads, messages, traces, sessions
- repositories for common data access patterns

If you want a runnable reference, see [examples/12-storage-persistence.md](../examples/12-storage-persistence.md).

## Next steps

- [advanced/storage/database.md](./storage/database.md)
- [advanced/storage/threads.md](./storage/threads.md)
- [advanced/storage/middleware.md](./storage/middleware.md)
- [advanced/storage/continuation.md](./storage/continuation.md)
# Storage & Persistence

The storage layer provides database persistence for conversations, messages, and agent state. Built on Drizzle ORM with PostgreSQL support.

## Overview

Storage features:

- **Threads**: Conversation containers
- **Messages**: Individual messages in threads
- **Persistence Middleware**: Automatic message saving
- **Thread Continuation**: Resume conversations
- **Repositories**: Type-safe database access

## Database Setup

### PostgreSQL with Drizzle

```typescript
import { createDatabase } from '@seashore/storage'

const database = createDatabase({
  connectionString: process.env.DATABASE_URL,
  maxConnections: 20,
  ssl: true,
})

// Health check
const healthy = await database.healthCheck()
console.log('Database healthy:', healthy)
```

### Run Migrations

```typescript
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const client = postgres(connectionString)
const db = drizzle(client)

await migrate(db, {
  migrationsFolder: './node_modules/@seashore/storage/drizzle',
})
```

Or run the SQL file directly:

```typescript
import { readFileSync } from 'fs'
import postgres from 'postgres'

const client = postgres(connectionString)
const migrationSql = readFileSync(
  './node_modules/@seashore/storage/drizzle/0000_initial.sql',
  'utf-8'
)
await client.unsafe(migrationSql)
```

## Threads

Threads represent conversations:

```typescript
import { createThreadRepository } from '@seashore/storage'

const threadRepo = createThreadRepository(database.db)

// Create thread
const thread = await threadRepo.create({
  userId: 'user-123',
  title: 'Technical Support',
  metadata: { category: 'support', priority: 'high' },
})

// Get thread
const found = await threadRepo.getById(thread.id)

// Update thread
await threadRepo.update(thread.id, {
  title: 'Resolved: Technical Support',
})

// List threads
const threads = await threadRepo.listByUser('user-123', {
  limit: 10,
  offset: 0,
})

// Delete thread
await threadRepo.delete(thread.id)
```

**Thread Structure:**

```typescript
interface Thread {
  id: string
  userId: string
  title?: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}
```

## Messages

Messages within threads:

```typescript
import { createMessageRepository } from '@seashore/storage'

const messageRepo = createMessageRepository(database.db)

// Create message
const message = await messageRepo.create({
  threadId: thread.id,
  role: 'user',
  content: 'How do I reset my password?',
  metadata: { ip: '192.168.1.1' },
})

// Get messages in thread
const messages = await messageRepo.listByThread(thread.id, {
  limit: 50,
  offset: 0,
})

// Update message
await messageRepo.update(message.id, {
  content: 'Updated content',
})

// Delete message
await messageRepo.delete(message.id)
```

**Message Structure:**

```typescript
interface Message {
  id: string
  threadId: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  name?: string          // For tool messages
  toolCallId?: string    // For tool responses
  toolCalls?: ToolCall[] // For assistant tool calls
  metadata?: Record<string, any>
  createdAt: Date
}
```

## Persistence Middleware

Automatically save agent conversations:

```typescript
import { createAgent, withStorage } from '@seashore/agent'
import { createPersistenceMiddleware } from '@seashore/storage'

const agent = createAgent({
  name: 'assistant',
  model: openaiText('gpt-4o'),
  systemPrompt: 'You are helpful.',
})

// Wrap with storage
const persistentAgent = withStorage(agent, {
  database,
  autoSave: true,
})

// Messages are automatically saved
const result = await persistentAgent.run('Hello!', {
  threadId: thread.id,
  userId: 'user-123',
})

// Retrieve history
const messages = await messageRepo.listByThread(thread.id)
```

## Thread Continuation

Resume conversations from database:

```typescript
import { continueThread, streamContinueThread } from '@seashore/agent'

// Non-streaming
const result = await continueThread({
  agent,
  threadId: thread.id,
  database,
  newMessage: 'Continue our previous conversation',
})

// Streaming
for await (const chunk of streamContinueThread({
  agent,
  threadId: thread.id,
  database,
  newMessage: 'What were we discussing?',
})) {
  if (chunk.type === 'content' && chunk.delta) {
    process.stdout.write(chunk.delta)
  }
}
```

## Thread Manager

High-level thread management:

```typescript
import { createThreadManager } from '@seashore/agent'

const manager = createThreadManager({
  database,
  agent,
})

// Create and start conversation
const thread = await manager.createThread({
  userId: 'user-123',
  title: 'New Chat',
})

const result = await manager.sendMessage(thread.id, {
  role: 'user',
  content: 'Hello!',
})

// Continue conversation
const result2 = await manager.sendMessage(thread.id, {
  role: 'user',
  content: 'How are you?',
})

// Get full history
const history = await manager.getHistory(thread.id)
```

## Advanced Querying

### Search Messages

```typescript
const results = await messageRepo.search({
  userId: 'user-123',
  content: 'password', // Text search
  role: 'user',
  fromDate: new Date('2024-01-01'),
  limit: 100,
})
```

### Filter by Metadata

```typescript
const messages = await messageRepo.listByThread(thread.id, {
  filter: {
    metadata: {
      category: 'technical',
    },
  },
})
```

### Pagination

```typescript
const page1 = await messageRepo.listByThread(thread.id, {
  limit: 20,
  offset: 0,
})

const page2 = await messageRepo.listByThread(thread.id, {
  limit: 20,
  offset: 20,
})
```

## Bulk Operations

### Bulk Insert

```typescript
await messageRepo.bulkCreate([
  { threadId, role: 'user', content: 'Message 1' },
  { threadId, role: 'assistant', content: 'Response 1' },
  { threadId, role: 'user', content: 'Message 2' },
])
```

### Bulk Delete

```typescript
await messageRepo.bulkDelete({
  threadId,
  olderThan: new Date('2024-01-01'),
})
```

## Data Export/Import

### Export Thread

```typescript
const exported = await threadRepo.export(thread.id)
// {
//   thread: { ... },
//   messages: [ ... ]
// }

fs.writeFileSync('thread-export.json', JSON.stringify(exported))
```

### Import Thread

```typescript
const data = JSON.parse(fs.readFileSync('thread-export.json'))
const newThread = await threadRepo.import(data, {
  userId: 'new-user-123',
})
```

## Testing with Testcontainers

Use testcontainers for integration tests:

```typescript
import { PostgreSqlContainer } from '@testcontainers/postgresql'

// Start container
const container = await new PostgreSqlContainer('postgres:16')
  .withDatabase('test_db')
  .withUsername('test')
  .withPassword('test')
  .start()

const database = createDatabase({
  connectionString: container.getConnectionUri(),
})

// Run migrations and tests...

// Cleanup
await container.stop()
```

## Best Practices

1. **Connection Pooling**: Set appropriate max connections
2. **Indexes**: Use database indexes for frequently queried fields
3. **Pagination**: Always paginate large result sets
4. **Transactions**: Use transactions for multi-step operations
5. **Cleanup**: Regularly archive or delete old conversations
6. **Backups**: Implement regular database backups
7. **Monitoring**: Monitor database performance and query times

## Example: Complete Storage Setup

```typescript
import { createDatabase, createThreadRepository, createMessageRepository } from '@seashore/storage'
import { createAgent, withStorage } from '@seashore/agent'
import { openaiText } from '@seashore/llm'

// Setup database
const database = createDatabase({
  connectionString: process.env.DATABASE_URL,
  maxConnections: 20,
})

// Setup repositories
const threadRepo = createThreadRepository(database.db)
const messageRepo = createMessageRepository(database.db)

// Create agent with storage
const agent = withStorage(
  createAgent({
    name: 'assistant',
    model: openaiText('gpt-4o'),
    systemPrompt: 'You are helpful.',
  }),
  { database }
)

// Usage
async function chatWithPersistence(userId: string, message: string) {
  // Find or create thread
  let thread = await threadRepo.findActive(userId)
  if (!thread) {
    thread = await threadRepo.create({
      userId,
      title: 'New Conversation',
    })
  }
  
  // Send message (auto-saves)
  const result = await agent.run(message, {
    threadId: thread.id,
    userId,
  })
  
  // History is automatically saved
  return result.content
}
```

## Next Steps

- [Database Setup](./storage/database.md) - Database configuration
- [Threads & Messages](./storage/threads.md) - Working with conversations
- [Persistence Middleware](./storage/middleware.md) - Automatic saving
- [Thread Continuation](./storage/continuation.md) - Resume conversations

## Examples

- [12: Storage Persistence](../examples/12-storage-persistence.md) - Complete storage example
