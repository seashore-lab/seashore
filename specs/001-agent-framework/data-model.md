# Data Model: Agent 研发框架

**Feature**: 001-agent-framework  
**Date**: 2025-12-25

## 概述

本文档定义 Seashore Agent 框架的核心数据模型，基于 PostgreSQL + Drizzle ORM 实现。

---

## 核心实体

### 1. Thread (对话线程)

表示一个完整的对话会话。

| 字段      | 类型      | 约束       | 说明            |
| --------- | --------- | ---------- | --------------- |
| id        | uuid      | PK, auto   | 唯一标识        |
| title     | text      | nullable   | 对话标题        |
| agentId   | text      | not null   | 关联的 Agent ID |
| userId    | text      | nullable   | 用户标识        |
| metadata  | jsonb     | default {} | 扩展元数据      |
| createdAt | timestamp | not null   | 创建时间        |
| updatedAt | timestamp | not null   | 更新时间        |

```typescript
// packages/storage/src/schema.ts
export const threads = pgTable('threads', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title'),
  agentId: text('agent_id').notNull(),
  userId: text('user_id'),
  metadata: jsonb('metadata').default({}).$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
```

### 2. Message (消息)

表示对话中的单条消息。

| 字段       | 类型      | 约束         | 说明                       |
| ---------- | --------- | ------------ | -------------------------- |
| id         | uuid      | PK, auto     | 唯一标识                   |
| threadId   | uuid      | FK, not null | 所属线程                   |
| role       | text      | not null     | user/assistant/system/tool |
| content    | text      | nullable     | 文本内容                   |
| toolCalls  | jsonb     | nullable     | 工具调用列表               |
| toolCallId | text      | nullable     | 工具响应关联 ID            |
| metadata   | jsonb     | default {}   | 扩展元数据                 |
| createdAt  | timestamp | not null     | 创建时间                   |

```typescript
export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    threadId: uuid('thread_id')
      .notNull()
      .references(() => threads.id, { onDelete: 'cascade' }),
    role: text('role').notNull().$type<'user' | 'assistant' | 'system' | 'tool'>(),
    content: text('content'),
    toolCalls: jsonb('tool_calls').$type<ToolCall[] | null>(),
    toolCallId: text('tool_call_id'),
    metadata: jsonb('metadata').default({}).$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_messages_thread').on(table.threadId),
    index('idx_messages_created').on(table.createdAt),
  ]
)
```

### 3. Document (文档)

用于 RAG 检索的知识库文档。

| 字段         | 类型         | 约束       | 说明         |
| ------------ | ------------ | ---------- | ------------ |
| id           | uuid         | PK, auto   | 唯一标识     |
| collectionId | text         | not null   | 所属集合     |
| content      | text         | not null   | 文档内容     |
| embedding    | vector(1536) | nullable   | 向量嵌入     |
| search       | tsvector     | generated  | 全文搜索向量 |
| metadata     | jsonb        | default {} | 扩展元数据   |
| createdAt    | timestamp    | not null   | 创建时间     |

```typescript
export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    collectionId: text('collection_id').notNull(),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: 1536 }),
    search: tsvector('search').generatedAlwaysAs(
      (): SQL => sql`to_tsvector('english', ${documents.content})`
    ),
    metadata: jsonb('metadata').default({}).$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_documents_collection').on(table.collectionId),
    index('idx_documents_embedding').using(
      'hnsw',
      table.embedding.op('vector_cosine_ops')
    ),
    index('idx_documents_search').using('gin', table.search),
  ]
)
```

### 4. Memory (记忆)

存储长期记忆信息。

| 字段           | 类型         | 约束        | 说明         |
| -------------- | ------------ | ----------- | ------------ |
| id             | uuid         | PK, auto    | 唯一标识     |
| userId         | text         | not null    | 用户标识     |
| agentId        | text         | not null    | Agent 标识   |
| key            | text         | not null    | 记忆键       |
| value          | text         | not null    | 记忆值       |
| embedding      | vector(1536) | nullable    | 语义向量     |
| importance     | real         | default 0.5 | 重要性评分   |
| accessCount    | integer      | default 0   | 访问次数     |
| lastAccessedAt | timestamp    | nullable    | 最后访问时间 |
| createdAt      | timestamp    | not null    | 创建时间     |

```typescript
export const memories = pgTable(
  'memories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    agentId: text('agent_id').notNull(),
    key: text('key').notNull(),
    value: text('value').notNull(),
    embedding: vector('embedding', { dimensions: 1536 }),
    importance: real('importance').default(0.5),
    accessCount: integer('access_count').default(0),
    lastAccessedAt: timestamp('last_accessed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_memories_user_agent').on(table.userId, table.agentId),
    index('idx_memories_embedding').using(
      'hnsw',
      table.embedding.op('vector_cosine_ops')
    ),
    uniqueIndex('idx_memories_unique').on(table.userId, table.agentId, table.key),
  ]
)
```

### 5. Trace (调用链路)

记录 Agent 执行的可观测性数据。

| 字段       | 类型      | 约束         | 说明                    |
| ---------- | --------- | ------------ | ----------------------- |
| id         | uuid      | PK, auto     | 唯一标识                |
| threadId   | uuid      | FK, nullable | 关联线程                |
| parentId   | uuid      | FK, nullable | 父 Span                 |
| name       | text      | not null     | 操作名称                |
| type       | text      | not null     | llm/tool/agent/workflow |
| input      | jsonb     | nullable     | 输入数据                |
| output     | jsonb     | nullable     | 输出数据                |
| error      | text      | nullable     | 错误信息                |
| startTime  | timestamp | not null     | 开始时间                |
| endTime    | timestamp | nullable     | 结束时间                |
| durationMs | integer   | nullable     | 耗时(毫秒)              |
| tokenUsage | jsonb     | nullable     | Token 消耗              |
| metadata   | jsonb     | default {}   | 扩展元数据              |

```typescript
export const traces = pgTable(
  'traces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    threadId: uuid('thread_id').references(() => threads.id, { onDelete: 'set null' }),
    parentId: uuid('parent_id').references((): AnyPgColumn => traces.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    type: text('type').notNull().$type<'llm' | 'tool' | 'agent' | 'workflow'>(),
    input: jsonb('input'),
    output: jsonb('output'),
    error: text('error'),
    startTime: timestamp('start_time').notNull().defaultNow(),
    endTime: timestamp('end_time'),
    durationMs: integer('duration_ms'),
    tokenUsage: jsonb('token_usage').$type<TokenUsage | null>(),
    metadata: jsonb('metadata').default({}).$type<Record<string, unknown>>(),
  },
  (table) => [
    index('idx_traces_thread').on(table.threadId),
    index('idx_traces_parent').on(table.parentId),
    index('idx_traces_start_time').on(table.startTime),
  ]
)
```

---

## 类型定义

```typescript
// packages/storage/src/types.ts

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  model?: string
  cost?: number
}

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool'
export type TraceType = 'llm' | 'tool' | 'agent' | 'workflow'
```

---

## 关系图

```
┌──────────────────┐       ┌──────────────────┐
│     threads      │───────│     messages     │
│                  │ 1:N   │                  │
│ id (PK)          │       │ id (PK)          │
│ title            │       │ threadId (FK)    │
│ agentId          │       │ role             │
│ userId           │       │ content          │
│ metadata         │       │ toolCalls        │
│ createdAt        │       │ toolCallId       │
│ updatedAt        │       │ metadata         │
└──────────────────┘       │ createdAt        │
         │                 └──────────────────┘
         │
         │ 1:N
         ▼
┌──────────────────┐
│      traces      │
│                  │
│ id (PK)          │
│ threadId (FK)    │◄──────┐
│ parentId (FK)    │───────┘ Self-ref
│ name             │
│ type             │
│ input/output     │
│ tokenUsage       │
│ durationMs       │
└──────────────────┘


┌──────────────────┐       ┌──────────────────┐
│    documents     │       │     memories     │
│                  │       │                  │
│ id (PK)          │       │ id (PK)          │
│ collectionId     │       │ userId           │
│ content          │       │ agentId          │
│ embedding        │       │ key              │
│ search (gen)     │       │ value            │
│ metadata         │       │ embedding        │
│ createdAt        │       │ importance       │
└──────────────────┘       │ accessCount      │
                           │ lastAccessedAt   │
                           │ createdAt        │
                           └──────────────────┘
```

---

## 索引策略

| 表        | 索引                     | 类型   | 用途              |
| --------- | ------------------------ | ------ | ----------------- |
| messages  | idx_messages_thread      | btree  | 按线程查询消息    |
| messages  | idx_messages_created     | btree  | 按时间排序        |
| documents | idx_documents_collection | btree  | 按集合筛选        |
| documents | idx_documents_embedding  | hnsw   | 向量相似度搜索    |
| documents | idx_documents_search     | gin    | 全文搜索          |
| memories  | idx_memories_user_agent  | btree  | 按用户+Agent 查询 |
| memories  | idx_memories_embedding   | hnsw   | 语义记忆检索      |
| memories  | idx_memories_unique      | unique | 去重约束          |
| traces    | idx_traces_thread        | btree  | 按线程查询        |
| traces    | idx_traces_parent        | btree  | 查询子 Span       |
| traces    | idx_traces_start_time    | btree  | 按时间范围查询    |

---

## 迁移说明

### 前置条件

```sql
-- 安装 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 安装 uuid 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Drizzle 迁移命令

```bash
# 生成迁移文件
pnpm exec drizzle-kit generate

# 执行迁移
pnpm exec drizzle-kit migrate

# 推送 schema（开发环境）
pnpm exec drizzle-kit push
```
