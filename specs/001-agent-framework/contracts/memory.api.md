# API Contract: @seashore/memory

**Package**: `@seashore/memory`  
**Version**: 0.1.0

## 概述

Memory 模块提供短期、中期和长期记忆管理，支持基于重要性的记忆筛选和语义检索。

---

## 导出

```typescript
// 记忆管理器
export { createMemoryManager, type MemoryManager, type MemoryConfig } from './manager'

// 记忆类型
export {
  createShortTermMemory,
  createMidTermMemory,
  createLongTermMemory,
  type Memory,
  type MemoryType,
} from './types'

// Schema
export { memories } from './schema'

// 类型
export type { MemoryEntry, NewMemory, MemoryQuery, MemorySearchResult } from './types'
```

---

## Schema 定义

### memories

```typescript
import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  real,
  integer,
  index,
} from 'drizzle-orm/pg-core'
import { vector } from 'drizzle-orm/pg-core'

export const memories = pgTable(
  'memories',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // 所属关系
    userId: text('user_id'),
    agentId: text('agent_id'),
    sessionId: uuid('session_id'),

    // 记忆内容
    type: text('type', { enum: ['short', 'mid', 'long'] }).notNull(),
    key: text('key').notNull(),
    value: jsonb('value').$type<unknown>().notNull(),

    // 语义向量
    embedding: vector('embedding', { dimensions: 1536 }),

    // 重要性和访问
    importance: real('importance').default(0.5),
    accessCount: integer('access_count').default(0),
    lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),

    // 过期时间
    expiresAt: timestamp('expires_at', { withTimezone: true }),

    // 元数据
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // 查询索引
    userIdx: index('memories_user_idx').on(table.userId),
    agentIdx: index('memories_agent_idx').on(table.agentId),
    typeIdx: index('memories_type_idx').on(table.type),

    // 向量索引
    embeddingIdx: index('memories_embedding_idx').using(
      'hnsw',
      table.embedding.op('vector_cosine_ops')
    ),

    // 复合索引
    userAgentIdx: index('memories_user_agent_idx').on(table.userId, table.agentId),
  })
)
```

---

## MemoryManager

### createMemoryManager

```typescript
import { createMemoryManager } from '@seashore/memory'
import { openaiEmbed } from '@seashore/llm'

const memoryManager = createMemoryManager({
  db: database,
  embeddingAdapter: openaiEmbed('text-embedding-3-small'),

  // 短期记忆配置（会话缓冲）
  shortTerm: {
    maxEntries: 100,
  },

  // 长期记忆配置（知识库）
  longTerm: {
    maxEntries: 1000,
    importanceThreshold: 0.7, // 只保存重要记忆
    enableVectorSearch: true, // 启用语义搜索
  },
})
```

---

## 记忆操作

### 存储记忆

```typescript
// 存储短期记忆
await memoryManager.store({
  type: 'short',
  key: 'current_task',
  value: { task: 'Write a report', progress: 0.5 },
  userId: 'user-123',
  agentId: 'assistant',
})

// 存储带重要性评分的记忆
await memoryManager.store({
  type: 'mid',
  key: 'user_preference',
  value: { language: 'zh-CN', timezone: 'Asia/Shanghai' },
  importance: 0.8,
  userId: 'user-123',
})

// 存储长期记忆（会自动生成嵌入向量）
await memoryManager.store({
  type: 'long',
  key: 'learned_fact',
  value: { fact: '用户是一名软件工程师，专注于前端开发' },
  importance: 0.9,
  userId: 'user-123',
  agentId: 'assistant',
})
```

### 检索记忆

```typescript
// 按 key 检索
const memory = await memoryManager.get('current_task', {
  userId: 'user-123',
  agentId: 'assistant',
})

// 语义搜索
const results = await memoryManager.search({
  query: '用户的编程偏好',
  type: 'long',
  userId: 'user-123',
  topK: 5,
  minScore: 0.7,
})

for (const result of results) {
  console.log(`Key: ${result.memory.key}`)
  console.log(`Value: ${JSON.stringify(result.memory.value)}`)
  console.log(`Score: ${result.score}`)
}
```

### 列出记忆

```typescript
// 列出用户的所有长期记忆
const memories = await memoryManager.list({
  userId: 'user-123',
  type: 'long',
  orderBy: 'importance',
  order: 'desc',
  limit: 20,
})

// 列出最近访问的记忆
const recentMemories = await memoryManager.list({
  userId: 'user-123',
  orderBy: 'lastAccessedAt',
  order: 'desc',
  limit: 10,
})
```

### 更新记忆

```typescript
// 更新记忆值
await memoryManager.update(
  'user_preference',
  {
    value: { language: 'en-US', timezone: 'UTC' },
  },
  {
    userId: 'user-123',
  }
)

// 更新重要性
await memoryManager.updateImportance('learned_fact', 0.95, {
  userId: 'user-123',
  agentId: 'assistant',
})

// 记录访问（更新 accessCount 和 lastAccessedAt）
await memoryManager.recordAccess('user_preference', {
  userId: 'user-123',
})
```

### 删除记忆

```typescript
// 删除单个
await memoryManager.delete('old_memory', {
  userId: 'user-123',
})

// 删除所有过期记忆
const deleted = await memoryManager.deleteExpired()
console.log(`Deleted ${deleted} expired memories`)

// 清空用户的短期记忆
await memoryManager.clear({
  userId: 'user-123',
  type: 'short',
})
```

---

## 记忆整合

### consolidate

将短期/中期记忆整合为长期记忆：

```typescript
// 手动整合
const consolidated = await memoryManager.consolidate({
  userId: 'user-123',
  agentId: 'assistant',

  // 整合策略
  strategy: 'importance', // 'importance' | 'frequency' | 'recency'
  threshold: 0.7,
})

console.log(`Consolidated ${consolidated.count} memories`)
```

### 自动整合

```typescript
const memoryManager = createMemoryManager({
  db: database,
  embeddingAdapter: openaiEmbed('text-embedding-3-small'),

  // 启用自动整合
  autoConsolidate: {
    enabled: true,
    intervalMs: 1000 * 60 * 60, // 每小时
    strategy: 'importance',
    threshold: 0.7,
  },
})

// 手动触发整合周期
await memoryManager.runConsolidationCycle()
```

---

## 重要性评估

### 使用 LLM 评估重要性

```typescript
import { createImportanceEvaluator } from '@seashore/memory'
import { openaiText } from '@seashore/llm'

const evaluator = createImportanceEvaluator({
  adapter: openaiText('gpt-4o-mini'),
})

// 评估单条记忆
const score = await evaluator.evaluate({
  key: 'user_statement',
  value: { statement: '我正在学习 Rust 编程语言' },
  context: '用户与编程助手对话',
})

console.log('Importance score:', score) // 0.0 - 1.0

// 批量评估
const scores = await evaluator.evaluateBatch([
  { key: 'greeting', value: { message: '你好' } },
  { key: 'goal', value: { goal: '我想成为全栈开发者' } },
])
```

---

## Agent 集成

### withMemory

为 Agent 添加记忆能力：

```typescript
import { createAgent } from '@seashore/agent'
import { withMemory } from '@seashore/memory'

const agent = createAgent({
  name: 'memory-agent',
  adapter: openaiText('gpt-4o'),
})

const agentWithMemory = withMemory(agent, {
  memoryManager,

  // 自动记忆策略
  autoStore: {
    // 存储用户偏好
    userPreferences: true,
    // 存储重要事实
    facts: true,
    // 存储对话摘要
    summaries: {
      enabled: true,
      afterMessages: 10, // 每 10 条消息后生成摘要
    },
  },

  // 自动检索策略
  autoRetrieve: {
    // 检索相关记忆注入上下文
    contextInjection: true,
    maxMemories: 5,
    minScore: 0.7,
  },
})

// 运行时会自动管理记忆
const result = await agentWithMemory.run({
  userId: 'user-123',
  messages: [{ role: 'user', content: '记住我喜欢使用 TypeScript' }],
})
```

---

## 类型定义

```typescript
export interface MemoryEntry {
  id: string
  type: 'short' | 'mid' | 'long'
  key: string
  value: unknown
  userId: string | null
  agentId: string | null
  sessionId: string | null
  embedding: number[] | null
  importance: number
  accessCount: number
  lastAccessedAt: Date | null
  expiresAt: Date | null
  metadata: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

export interface NewMemory {
  type: 'short' | 'mid' | 'long'
  key: string
  value: unknown
  userId?: string
  agentId?: string
  sessionId?: string
  importance?: number
  expiresAt?: Date
  metadata?: Record<string, unknown>
}

export interface MemoryQuery {
  userId?: string
  agentId?: string
  sessionId?: string
  type?: 'short' | 'mid' | 'long'
}

export interface MemorySearchResult {
  memory: MemoryEntry
  score: number
}

export interface MemoryConfig {
  db: Database
  embeddingAdapter: EmbeddingAdapter
  shortTerm?: {
    maxEntries?: number
    maxTokens?: number
  }
  longTerm?: {
    maxEntries?: number
    importanceThreshold?: number
    enableVectorSearch?: boolean
  }
    importanceThreshold?: number
    consolidationInterval?: number
  }
  autoConsolidate?: {
    enabled: boolean
    intervalMs: number
    strategy: 'importance' | 'frequency' | 'recency'
    threshold: number
  }
}
```
