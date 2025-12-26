# API Contract: @seashore/storage

**Package**: `@seashore/storage`  
**Version**: 0.1.0

## 概述

Storage 模块提供基于 PostgreSQL + Drizzle ORM 的持久化层，包含核心数据实体的 Schema 定义和 Repository 抽象。

---

## 导出

```typescript
// Schema
export { threads, messages, traces, sessions } from './schema'

// Repository
export {
  createThreadRepository,
  createMessageRepository,
  createTraceRepository,
} from './repositories'

// Database
export { createDatabase, type Database } from './database'

// 类型
export type {
  Thread,
  Message,
  Trace,
  Session,
  NewThread,
  NewMessage,
  NewTrace,
} from './types'
```

---

## Database 初始化

### createDatabase

```typescript
import { createDatabase } from '@seashore/storage'

const db = createDatabase({
  connectionString: process.env.DATABASE_URL,
  // 可选配置
  maxConnections: 10,
  ssl: process.env.NODE_ENV === 'production',
})

// 健康检查
const isHealthy = await db.healthCheck()

// 关闭连接
await db.close()
```

### 迁移

```bash
# 生成迁移
pnpm drizzle-kit generate

# 执行迁移
pnpm drizzle-kit migrate

# 或使用 push（开发环境）
pnpm drizzle-kit push
```

---

## Schema 定义

### threads

```typescript
import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core'

export const threads = pgTable('threads', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title'),
  agentId: text('agent_id').notNull(),
  userId: text('user_id'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
```

### messages

```typescript
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id')
    .notNull()
    .references(() => threads.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['user', 'assistant', 'system', 'tool'] }).notNull(),
  content: text('content'),
  toolCalls: jsonb('tool_calls').$type<ToolCall[]>(),
  toolCallId: text('tool_call_id'),
  name: text('name'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

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
export const traces = pgTable('traces', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id').references(() => threads.id, { onDelete: 'set null' }),
  parentId: uuid('parent_id').references((): any => traces.id),
  name: text('name').notNull(),
  type: text('type', {
    enum: ['agent', 'tool', 'llm', 'retriever', 'embedding', 'chain'],
  }).notNull(),
  input: jsonb('input').$type<unknown>(),
  output: jsonb('output').$type<unknown>(),
  error: text('error'),
  tokenUsage: jsonb('token_usage').$type<TokenUsage>(),
  durationMs: integer('duration_ms'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
})

interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}
```

### sessions

```typescript
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
```

---

## Repository

### createThreadRepository

```typescript
import { createDatabase, createThreadRepository } from '@seashore/storage'

const db = createDatabase({ connectionString: process.env.DATABASE_URL })
const threadRepo = createThreadRepository(db)

// 创建 Thread
const thread = await threadRepo.create({
  agentId: 'my-agent',
  userId: 'user-123',
  title: 'New Conversation',
  metadata: { source: 'web' },
})

// 获取 Thread
const found = await threadRepo.findById(thread.id)

// 列出用户的 Threads
const userThreads = await threadRepo.findByUserId('user-123', {
  limit: 20,
  offset: 0,
  orderBy: 'createdAt',
  order: 'desc',
})

// 更新 Thread
const updated = await threadRepo.update(thread.id, {
  title: 'Updated Title',
})

// 删除 Thread（级联删除 messages）
await threadRepo.delete(thread.id)
```

### createMessageRepository

```typescript
const messageRepo = createMessageRepository(db)

// 创建 Message
const message = await messageRepo.create({
  threadId: thread.id,
  role: 'user',
  content: 'Hello!',
})

// 创建带 Tool Calls 的 Message
const assistantMessage = await messageRepo.create({
  threadId: thread.id,
  role: 'assistant',
  content: null,
  toolCalls: [
    {
      id: 'call_abc123',
      type: 'function',
      function: {
        name: 'search',
        arguments: JSON.stringify({ query: 'weather' }),
      },
    },
  ],
})

// 创建 Tool Result Message
const toolResult = await messageRepo.create({
  threadId: thread.id,
  role: 'tool',
  content: JSON.stringify({ result: 'sunny, 25°C' }),
  toolCallId: 'call_abc123',
  name: 'search',
})

// 获取 Thread 的所有 Messages
const messages = await messageRepo.findByThreadId(thread.id, {
  limit: 100,
  orderBy: 'createdAt',
  order: 'asc',
})

// 批量创建
const batchMessages = await messageRepo.createMany([
  { threadId: thread.id, role: 'user', content: 'Message 1' },
  { threadId: thread.id, role: 'assistant', content: 'Response 1' },
])

// 删除消息
await messageRepo.delete(message.id)
```

### createTraceRepository

```typescript
const traceRepo = createTraceRepository(db)

// 创建根 Trace
const rootTrace = await traceRepo.create({
  threadId: thread.id,
  name: 'agent.run',
  type: 'agent',
  input: { prompt: 'Hello' },
  startedAt: new Date(),
})

// 创建子 Trace
const childTrace = await traceRepo.create({
  threadId: thread.id,
  parentId: rootTrace.id,
  name: 'llm.generate',
  type: 'llm',
  input: { messages: [...] },
  startedAt: new Date(),
})

// 完成 Trace
await traceRepo.complete(childTrace.id, {
  output: { content: 'Hello!' },
  tokenUsage: { promptTokens: 50, completionTokens: 10, totalTokens: 60 },
  endedAt: new Date(),
})

// 查询 Thread 的 Traces（树状结构）
const traces = await traceRepo.findByThreadId(thread.id, {
  includeChildren: true,
})

// 按时间范围查询
const recentTraces = await traceRepo.findByTimeRange({
  start: new Date('2024-01-01'),
  end: new Date('2024-01-31'),
  type: 'llm',
})
```

---

## 类型定义

```typescript
// Thread
export interface Thread {
  id: string
  title: string | null
  agentId: string
  userId: string | null
  metadata: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

export interface NewThread {
  agentId: string
  title?: string
  userId?: string
  metadata?: Record<string, unknown>
}

// Message
export interface Message {
  id: string
  threadId: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string | null
  toolCalls: ToolCall[] | null
  toolCallId: string | null
  name: string | null
  metadata: Record<string, unknown> | null
  createdAt: Date
}

export interface NewMessage {
  threadId: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content?: string
  toolCalls?: ToolCall[]
  toolCallId?: string
  name?: string
  metadata?: Record<string, unknown>
}

// Trace
export interface Trace {
  id: string
  threadId: string | null
  parentId: string | null
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
```

---

## 事务支持

```typescript
import { createDatabase } from '@seashore/storage'

const db = createDatabase({ connectionString: process.env.DATABASE_URL })

// 使用事务
await db.transaction(async (tx) => {
  const thread = await tx.insert(threads).values({ agentId: 'agent-1' }).returning()
  await tx.insert(messages).values({
    threadId: thread[0].id,
    role: 'system',
    content: 'You are a helpful assistant.',
  })
})
```
