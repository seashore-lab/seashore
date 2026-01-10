# @seashore/storage

PostgreSQL-based persistence layer with Drizzle ORM.

## Installation

```bash
pnpm add @seashore/storage
```

Required dependencies:
```bash
pnpm add drizzle-orm postgres
```

## Overview

`@seashore/storage` provides:

- PostgreSQL database connection management
- Core schema definitions (threads, messages, traces, sessions)
- Repository pattern for data access
- Transaction support
- Migration tools

## Quick Start

### Database Initialization

```typescript
import { createDatabase } from '@seashore/storage'

const db = createDatabase({
  connectionString: process.env.DATABASE_URL,
  maxConnections: 10,
  ssl: process.env.NODE_ENV === 'production',
})

// Health check
const isHealthy = await db.healthCheck()

// Close connection
await db.close()
```

### Using Repositories

```typescript
import { createThreadRepository, createMessageRepository } from '@seashore/storage'

const threadRepo = createThreadRepository(db)
const messageRepo = createMessageRepository(db)

// Create a thread
const thread = await threadRepo.create({
  agentId: 'my-agent',
  userId: 'user-123',
  title: 'New Conversation',
  metadata: { source: 'web' },
})

// Create a message
const message = await messageRepo.create({
  threadId: thread.id,
  role: 'user',
  content: 'Hello!',
})
```

## API Reference

### createDatabase

Creates a database connection pool.

```typescript
function createDatabase(config: DatabaseConfig): Database
```

#### Configuration

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `connectionString` | `string` | Yes | PostgreSQL connection string |
| `maxConnections` | `number` | No | Max pool size (default: 10) |
| `ssl` | `boolean` | No | Enable SSL (default: false) |
| `idleTimeout` | `number` | No | Idle timeout in ms |

#### Methods

| Method | Description |
|--------|-------------|
| `healthCheck()` | Check database connectivity |
| `transaction(fn)` | Execute in transaction |
| `close()` | Close all connections |

### Repository Methods

#### ThreadRepository

```typescript
const threadRepo = createThreadRepository(db)

// Create
const thread = await threadRepo.create({
  agentId: string,
  title?: string,
  userId?: string,
  metadata?: Record<string, unknown>,
})

// Find by ID
const thread = await threadRepo.findById(id)

// Find by user
const threads = await threadRepo.findByUserId(userId, {
  limit?: number,
  offset?: number,
  orderBy?: 'createdAt' | 'updatedAt',
  order?: 'asc' | 'desc',
})

// Update
const updated = await threadRepo.update(id, {
  title?: string,
  metadata?: Record<string, unknown>,
})

// Delete (cascades to messages)
await threadRepo.delete(id)
```

#### MessageRepository

```typescript
const messageRepo = createMessageRepository(db)

// Create single message
const message = await messageRepo.create({
  threadId: string,
  role: 'user' | 'assistant' | 'system' | 'tool',
  content?: string,
  toolCalls?: ToolCall[],
  toolCallId?: string,
  name?: string,
  metadata?: Record<string, unknown>,
})

// Create tool call message
const assistantMessage = await messageRepo.create({
  threadId: thread.id,
  role: 'assistant',
  toolCalls: [{
    id: 'call_abc123',
    type: 'function',
    function: {
      name: 'search',
      arguments: JSON.stringify({ query: 'weather' }),
    },
  }],
})

// Create tool result message
const toolResult = await messageRepo.create({
  threadId: thread.id,
  role: 'tool',
  content: JSON.stringify({ result: 'sunny, 25°C' }),
  toolCallId: 'call_abc123',
  name: 'search',
})

// Find by thread
const messages = await messageRepo.findByThreadId(threadId, {
  limit?: number,
  orderBy?: 'createdAt',
  order?: 'asc' | 'desc',
})

// Batch create
const batchMessages = await messageRepo.createMany([
  { threadId, role: 'user', content: 'Message 1' },
  { threadId, role: 'assistant', content: 'Response 1' },
])

// Delete
await messageRepo.delete(id)
```

#### TraceRepository

```typescript
const traceRepo = createTraceRepository(db)

// Create root trace
const rootTrace = await traceRepo.create({
  threadId?: string,
  name: 'agent.run',
  type: 'agent',
  input: { prompt: 'Hello' },
  startedAt: new Date(),
})

// Create child trace
const childTrace = await traceRepo.create({
  threadId,
  parentId: rootTrace.id,
  name: 'llm.generate',
  type: 'llm',
  input: { messages: [...] },
  startedAt: new Date(),
})

// Complete trace
await traceRepo.complete(childTrace.id, {
  output: { content: 'Hello!' },
  tokenUsage: {
    promptTokens: 50,
    completionTokens: 10,
    totalTokens: 60,
  },
  endedAt: new Date(),
})

// Query with children
const traces = await traceRepo.findByThreadId(threadId, {
  includeChildren: true,
})

// Query by time range
const recentTraces = await traceRepo.findByTimeRange({
  start: new Date('2024-01-01'),
  end: new Date('2024-01-31'),
  type: 'llm',
})
```

## Schema Definitions

### threads

```typescript
{
  id: string // UUID
  title: string | null
  agentId: string
  userId: string | null
  metadata: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}
```

### messages

```typescript
{
  id: string // UUID
  threadId: string // FK to threads
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string | null
  toolCalls: ToolCall[] | null
  toolCallId: string | null
  name: string | null
  metadata: Record<string, unknown> | null
  createdAt: Date
}

interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}
```

### traces

```typescript
{
  id: string // UUID
  threadId: string | null // FK to threads
  parentId: string | null // FK to traces (self-referencing)
  name: string
  type: 'agent' | 'tool' | 'llm' | 'retriever' | 'embedding' | 'chain'
  input: unknown
  output: unknown
  error: string | null
  tokenUsage: TokenUsage | null
  durationMs: number | null
  startedAt: Date
  endedAt: Date | null
}

interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}
```

### sessions

```typescript
{
  id: string // UUID
  userId: string
  metadata: Record<string, unknown> | null
  expiresAt: Date | null
  createdAt: Date
}
```

## Migrations

### Generating Migrations

```bash
pnpm drizzle-kit generate
```

This generates SQL migration files in the `drizzle/` directory.

### Running Migrations

```bash
pnpm drizzle-kit migrate
```

### Development (Push)

For quick development without migration files:

```bash
pnpm drizzle-kit push
```

## Transactions

### Using Transactions

```typescript
await db.transaction(async (tx) => {
  // All operations run in a single transaction
  const thread = await tx.insert(threads).values({
    agentId: 'agent-1',
  }).returning()

  await tx.insert(messages).values({
    threadId: thread[0].id,
    role: 'system',
    content: 'You are a helpful assistant.',
  })

  // If anything throws, the entire transaction rolls back
})
```

### Transaction with Repositories

```typescript
await db.transaction(async (tx) => {
  const threadRepo = createThreadRepository(tx)
  const messageRepo = createMessageRepository(tx)

  const thread = await threadRepo.create({
    agentId: 'agent-1',
    userId: 'user-123',
  })

  await messageRepo.create({
    threadId: thread.id,
    role: 'user',
    content: 'Hello!',
  })

  // All or nothing
})
```

## Environment Variables

```bash
# PostgreSQL connection
DATABASE_URL=postgresql://user:password@host:5432/database

# Connection pool (optional)
DB_MAX_CONNECTIONS=10
DB_IDLE_TIMEOUT=30000
```

## Best Practices

1. **Always use transactions** for multi-step operations
2. **Use repository pattern** instead of raw queries
3. **Index appropriately** for your query patterns
4. **Handle connection errors** gracefully
5. **Use migrations** in production, push only in development

## See Also

- [Database Setup Guide](../guides/database-setup.md)
- [Memory Package](memory.md)
- [Observability Package](observability.md)
