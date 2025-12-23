# Data Model: Seashore Agent Framework

**Date**: 2025-12-24  
**Feature**: 001-agent-framework  
**Database**: PostgreSQL (with pgvector extension)

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐
│   Thread    │───────│   Message   │
└─────────────┘       └─────────────┘
      │                     │
      │                     │
      ▼                     ▼
┌─────────────┐       ┌─────────────┐
│   Memory    │       │  ToolCall   │
└─────────────┘       └─────────────┘

┌─────────────┐       ┌─────────────┐
│  Document   │───────│   Chunk     │
└─────────────┘       └─────────────┘

┌─────────────┐
│  Workflow   │
│  Definition │
└─────────────┘
```

## Core Entities

### 1. Thread (会话)

存储用户与 Agent 的会话信息。

```typescript
// packages/storage/src/schema/thread.ts
import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core'

export const threads = pgTable('threads', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type Thread = typeof threads.$inferSelect
export type NewThread = typeof threads.$inferInsert
```

**字段说明**:

- `id`: UUID 主键
- `title`: 会话标题（可选）
- `metadata`: 扩展元数据（JSON）
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

### 2. Message (消息)

存储会话中的消息记录。

```typescript
// packages/storage/src/schema/message.ts
import { pgTable, uuid, text, timestamp, jsonb, integer } from 'drizzle-orm/pg-core'
import { threads } from './thread'

export const messageRoleEnum = pgEnum('message_role', [
  'user',
  'assistant',
  'tool',
  'system',
])

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id')
    .references(() => threads.id, { onDelete: 'cascade' })
    .notNull(),
  role: messageRoleEnum('role').notNull(),
  content: text('content'),
  parts: jsonb('parts').$type<MessagePart[]>(),
  tokenCount: integer('token_count'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Message Parts 类型定义 (与 @tanstack/ai 对齐)
export type MessagePart =
  | { type: 'text'; content: string }
  | { type: 'thinking'; content: string }
  | { type: 'tool-call'; id: string; name: string; arguments: unknown }
  | { type: 'tool-result'; toolCallId: string; result: unknown }

export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert
```

**字段说明**:

- `id`: UUID 主键
- `threadId`: 关联的会话 ID
- `role`: 消息角色 (user/assistant/tool/system)
- `content`: 消息文本内容
- `parts`: 结构化消息部分（支持 tool-call 等）
- `tokenCount`: Token 数量（用于统计）
- `metadata`: 扩展元数据
- `createdAt`: 创建时间

### 3. Memory (记忆)

存储 Agent 的长期/中期/短期记忆。

```typescript
// packages/memory/src/schema/memory.ts
import { pgTable, uuid, text, timestamp, jsonb, vector } from 'drizzle-orm/pg-core'
import { customType } from 'drizzle-orm/pg-core'

const vectorType = customType<{ data: number[] }>({
  dataType() {
    return 'vector(1536)'
  },
})

export const memoryTypeEnum = pgEnum('memory_type', [
  'short_term',
  'mid_term',
  'long_term',
])

export const memories = pgTable(
  'memories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id'),
    threadId: uuid('thread_id').references(() => threads.id),
    type: memoryTypeEnum('type').notNull(),
    content: text('content').notNull(),
    embedding: vectorType('embedding'),
    importance: integer('importance').default(0),
    accessCount: integer('access_count').default(0),
    lastAccessedAt: timestamp('last_accessed_at'),
    expiresAt: timestamp('expires_at'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('idx_memory_embedding').using('hnsw', t.embedding, {
      opclass: 'vector_cosine_ops',
    }),
    index('idx_memory_user').on(t.userId),
    index('idx_memory_type').on(t.type),
  ]
)

export type Memory = typeof memories.$inferSelect
export type NewMemory = typeof memories.$inferInsert
```

**字段说明**:

- `id`: UUID 主键
- `userId`: 用户标识（用于用户级记忆）
- `threadId`: 关联的会话（可选）
- `type`: 记忆类型
- `content`: 记忆内容
- `embedding`: 向量表示（用于语义检索）
- `importance`: 重要性评分
- `accessCount`: 访问次数
- `lastAccessedAt`: 最后访问时间
- `expiresAt`: 过期时间（短期记忆）
- `metadata`: 扩展元数据

### 4. Document (文档)

存储待检索的文档元信息。

```typescript
// packages/rag/src/schema/document.ts
import { pgTable, uuid, text, timestamp, jsonb, integer } from 'drizzle-orm/pg-core'

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  source: text('source').notNull(),
  title: text('title'),
  content: text('content').notNull(),
  contentHash: text('content_hash').notNull(),
  mimeType: text('mime_type'),
  chunkCount: integer('chunk_count').default(0),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type Document = typeof documents.$inferSelect
export type NewDocument = typeof documents.$inferInsert
```

### 5. Chunk (文档块)

存储文档分块及其向量表示。

```typescript
// packages/rag/src/schema/chunk.ts
import { pgTable, uuid, text, integer, jsonb, index } from 'drizzle-orm/pg-core'
import { customType, SQL, sql } from 'drizzle-orm'
import { documents } from './document'

const vectorType = customType<{ data: number[] }>({
  dataType() {
    return 'vector(1536)'
  },
})

const tsvectorType = customType<{ data: string }>({
  dataType() {
    return 'tsvector'
  },
})

export const chunks = pgTable(
  'chunks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentId: uuid('document_id')
      .references(() => documents.id, { onDelete: 'cascade' })
      .notNull(),
    content: text('content').notNull(),
    embedding: vectorType('embedding'),
    contentSearch: tsvectorType('content_search').generatedAlwaysAs(
      (): SQL => sql`to_tsvector('english', ${chunks.content})`
    ),
    chunkIndex: integer('chunk_index').notNull(),
    startOffset: integer('start_offset'),
    endOffset: integer('end_offset'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  },
  (t) => [
    // HNSW 向量索引
    index('idx_chunk_embedding').using('hnsw', t.embedding, {
      opclass: 'vector_cosine_ops',
    }),
    // GIN 全文索引
    index('idx_chunk_search').using('gin', t.contentSearch),
    // 文档关联索引
    index('idx_chunk_document').on(t.documentId),
  ]
)

export type Chunk = typeof chunks.$inferSelect
export type NewChunk = typeof chunks.$inferInsert
```

**字段说明**:

- `id`: UUID 主键
- `documentId`: 关联的文档 ID
- `content`: 分块文本内容
- `embedding`: 向量表示 (1536 维，OpenAI text-embedding-3-small)
- `contentSearch`: tsvector 生成列（用于全文搜索）
- `chunkIndex`: 分块在文档中的索引
- `startOffset`: 在原文档中的起始位置
- `endOffset`: 在原文档中的结束位置
- `metadata`: 扩展元数据

### 6. WorkflowDefinition (工作流定义)

存储工作流的图结构定义。

```typescript
// packages/workflow/src/schema/workflow.ts
import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core'

export const workflowDefinitions = pgTable('workflow_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  description: text('description'),
  nodes: jsonb('nodes').$type<WorkflowNode[]>().notNull(),
  edges: jsonb('edges').$type<WorkflowEdge[]>().notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 节点类型
export type WorkflowNode = {
  id: string
  type: 'start' | 'end' | 'llm' | 'tool' | 'condition' | 'parallel'
  config: Record<string, unknown>
}

// 边类型
export type WorkflowEdge = {
  id: string
  source: string
  target: string
  condition?: string // 条件表达式
}

export type WorkflowDefinition = typeof workflowDefinitions.$inferSelect
export type NewWorkflowDefinition = typeof workflowDefinitions.$inferInsert
```

### 7. WorkflowExecution (工作流执行记录)

存储工作流执行的运行时状态。

```typescript
// packages/workflow/src/schema/execution.ts
import { pgTable, uuid, text, timestamp, jsonb, integer } from 'drizzle-orm/pg-core'
import { workflowDefinitions } from './workflow'

export const executionStatusEnum = pgEnum('execution_status', [
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
])

export const workflowExecutions = pgTable('workflow_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id')
    .references(() => workflowDefinitions.id)
    .notNull(),
  status: executionStatusEnum('status').notNull().default('pending'),
  input: jsonb('input').$type<Record<string, unknown>>(),
  output: jsonb('output').$type<Record<string, unknown>>(),
  currentNodeId: text('current_node_id'),
  nodeStates: jsonb('node_states').$type<Record<string, NodeState>>(),
  error: text('error'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type NodeState = {
  status: 'pending' | 'running' | 'completed' | 'failed'
  input?: unknown
  output?: unknown
  error?: string
  startedAt?: string
  completedAt?: string
}

export type WorkflowExecution = typeof workflowExecutions.$inferSelect
export type NewWorkflowExecution = typeof workflowExecutions.$inferInsert
```

## Database Migrations

### Initial Migration

```sql
-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 创建枚举类型
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'tool', 'system');
CREATE TYPE memory_type AS ENUM ('short_term', 'mid_term', 'long_term');
CREATE TYPE execution_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');

-- 创建表（见上述 schema 定义）
-- ...
```

## Indexes Summary

| 表       | 索引名               | 类型   | 字段           | 用途           |
| -------- | -------------------- | ------ | -------------- | -------------- |
| chunks   | idx_chunk_embedding  | HNSW   | embedding      | 向量相似度搜索 |
| chunks   | idx_chunk_search     | GIN    | content_search | 全文搜索       |
| chunks   | idx_chunk_document   | B-Tree | document_id    | 文档关联查询   |
| memories | idx_memory_embedding | HNSW   | embedding      | 记忆语义检索   |
| memories | idx_memory_user      | B-Tree | user_id        | 用户记忆查询   |
| memories | idx_memory_type      | B-Tree | type           | 记忆类型过滤   |
| messages | (FK)                 | B-Tree | thread_id      | 会话消息查询   |

## Validation Rules

1. **Thread**

   - `id` 必须是有效的 UUID
   - `metadata` 如果提供，必须是有效的 JSON 对象

2. **Message**

   - `threadId` 必须引用存在的 Thread
   - `role` 必须是预定义的枚举值之一
   - `content` 或 `parts` 至少有一个非空

3. **Memory**

   - `type` 必须是预定义的枚举值之一
   - `content` 不能为空
   - 短期记忆 `expiresAt` 应在创建后的合理时间内

4. **Chunk**
   - `documentId` 必须引用存在的 Document
   - `embedding` 维度必须匹配配置（默认 1536）
   - `chunkIndex` 从 0 开始递增

## State Transitions

### WorkflowExecution 状态机

```
pending → running → completed
                  ↘ failed
                  ↘ cancelled
```

### Memory 生命周期

```
短期记忆: 创建 → 访问 → 过期删除
中期记忆: 创建 → 多次访问 → 晋升为长期 / 过期降级
长期记忆: 创建 → 持久存储 → 手动删除
```
