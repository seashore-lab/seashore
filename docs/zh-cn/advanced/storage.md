# 存储与持久化

存储模块 (`@seashore/storage`) 提供：

- PostgreSQL + Drizzle 数据库设置
- 线程、消息、跟踪、会话的模式
- 常用数据访问模式的存储库

如果需要可运行的参考，请参见 [examples/12-storage-persistence.md](../examples/12-storage-persistence.md)。

## 后续步骤

- [advanced/storage/database.md](./storage/database.md)
- [advanced/storage/threads.md](./storage/threads.md)
- [advanced/storage/middleware.md](./storage/middleware.md)
- [advanced/storage/continuation.md](./storage/continuation.md)
# 存储与持久化

存储层为对话、消息和智能体状态提供数据库持久化。基于 Drizzle ORM 构建，支持 PostgreSQL。

## 概述

存储功能：

- **线程**：对话容器
- **消息**：线程中的单个消息
- **持久化中间件**：自动消息保存
- **线程续接**：恢复对话
- **存储库**：类型安全的数据库访问

## 数据库设置

### 使用 Drizzle 的 PostgreSQL

```typescript
import { createDatabase } from '@seashore/storage'

const database = createDatabase({
  connectionString: process.env.DATABASE_URL,
  maxConnections: 20,
  ssl: true,
})

// 健康检查
const healthy = await database.healthCheck()
console.log('数据库健康：', healthy)
```

### 运行迁移

```typescript
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const client = postgres(connectionString)
const db = drizzle(client)

await migrate(db, {
  migrationsFolder: './node_modules/@seashore/storage/drizzle',
})
```

或直接运行 SQL 文件：

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

## 线程

线程代表对话：

```typescript
import { createThreadRepository } from '@seashore/storage'

const threadRepo = createThreadRepository(database.db)

// 创建线程
const thread = await threadRepo.create({
  userId: 'user-123',
  title: '技术支持',
  metadata: { category: 'support', priority: 'high' },
})

// 获取线程
const found = await threadRepo.getById(thread.id)

// 更新线程
await threadRepo.update(thread.id, {
  title: '已解决：技术支持',
})

// 列出线程
const threads = await threadRepo.listByUser('user-123', {
  limit: 10,
  offset: 0,
})

// 删除线程
await threadRepo.delete(thread.id)
```

**线程结构：**

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

## 消息

线程中的消息：

```typescript
import { createMessageRepository } from '@seashore/storage'

const messageRepo = createMessageRepository(database.db)

// 创建消息
const message = await messageRepo.create({
  threadId: thread.id,
  role: 'user',
  content: '如何重置我的密码？',
  metadata: { ip: '192.168.1.1' },
})

// 获取线程中的消息
const messages = await messageRepo.listByThread(thread.id, {
  limit: 50,
  offset: 0,
})

// 更新消息
await messageRepo.update(message.id, {
  content: '更新的内容',
})

// 删除消息
await messageRepo.delete(message.id)
```

**消息结构：**

```typescript
interface Message {
  id: string
  threadId: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  name?: string          // 用于工具消息
  toolCallId?: string    // 用于工具响应
  toolCalls?: ToolCall[] // 用于助手工具调用
  metadata?: Record<string, any>
  createdAt: Date
}
```

## 持久化中间件

自动保存智能体对话：

```typescript
import { createAgent, withStorage } from '@seashore/agent'
import { createPersistenceMiddleware } from '@seashore/storage'

const agent = createAgent({
  name: 'assistant',
  model: openaiText('gpt-4o'),
  systemPrompt: '你很有帮助。',
})

// 用存储包装
const persistentAgent = withStorage(agent, {
  database,
  autoSave: true,
})

// 消息自动保存
const result = await persistentAgent.run('你好！', {
  threadId: thread.id,
  userId: 'user-123',
})

// 检索历史
const messages = await messageRepo.listByThread(thread.id)
```

## 线程续接

从数据库恢复对话：

```typescript
import { continueThread, streamContinueThread } from '@seashore/agent'

// 非流式
const result = await continueThread({
  agent,
  threadId: thread.id,
  database,
  newMessage: '继续我们之前的对话',
})

// 流式
for await (const chunk of streamContinueThread({
  agent,
  threadId: thread.id,
  database,
  newMessage: '我们在讨论什么？',
})) {
  if (chunk.type === 'content' && chunk.delta) {
    process.stdout.write(chunk.delta)
  }
}
```

## 线程管理器

高级线程管理：

```typescript
import { createThreadManager } from '@seashore/agent'

const manager = createThreadManager({
  database,
  agent,
})

// 创建并开始对话
const thread = await manager.createThread({
  userId: 'user-123',
  title: '新聊天',
})

const result = await manager.sendMessage(thread.id, {
  role: 'user',
  content: '你好！',
})

// 继续对话
const result2 = await manager.sendMessage(thread.id, {
  role: 'user',
  content: '你好吗？',
})

// 获取完整历史
const history = await manager.getHistory(thread.id)
```

## 高级查询

### 搜索消息

```typescript
const results = await messageRepo.search({
  userId: 'user-123',
  content: 'password', // 文本搜索
  role: 'user',
  fromDate: new Date('2024-01-01'),
  limit: 100,
})
```

### 按元数据过滤

```typescript
const messages = await messageRepo.listByThread(thread.id, {
  filter: {
    metadata: {
      category: 'technical',
    },
  },
})
```

### 分页

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

## 批量操作

### 批量插入

```typescript
await messageRepo.bulkCreate([
  { threadId, role: 'user', content: '消息 1' },
  { threadId, role: 'assistant', content: '响应 1' },
  { threadId, role: 'user', content: '消息 2' },
])
```

### 批量删除

```typescript
await messageRepo.bulkDelete({
  threadId,
  olderThan: new Date('2024-01-01'),
})
```

## 数据导出/导入

### 导出线程

```typescript
const exported = await threadRepo.export(thread.id)
// {
//   thread: { ... },
//   messages: [ ... ]
// }

fs.writeFileSync('thread-export.json', JSON.stringify(exported))
```

### 导入线程

```typescript
const data = JSON.parse(fs.readFileSync('thread-export.json'))
const newThread = await threadRepo.import(data, {
  userId: 'new-user-123',
})
```

## 使用 Testcontainers 进行测试

使用 testcontainers 进行集成测试：

```typescript
import { PostgreSqlContainer } from '@testcontainers/postgresql'

// 启动容器
const container = await new PostgreSqlContainer('postgres:16')
  .withDatabase('test_db')
  .withUsername('test')
  .withPassword('test')
  .start()

const database = createDatabase({
  connectionString: container.getConnectionUri(),
})

// 运行迁移和测试...

// 清理
await container.stop()
```

## 最佳实践

1. **连接池**：设置适当的最大连接数
2. **索引**：对频繁查询的字段使用数据库索引
3. **分页**：始终对大型结果集进行分页
4. **事务**：对多步骤操作使用事务
5. **清理**：定期归档或删除旧对话
6. **备份**：实施定期数据库备份
7. **监控**：监控数据库性能和查询时间

## 示例：完整的存储设置

```typescript
import { createDatabase, createThreadRepository, createMessageRepository } from '@seashore/storage'
import { createAgent, withStorage } from '@seashore/agent'
import { openaiText } from '@seashore/llm'

// 设置数据库
const database = createDatabase({
  connectionString: process.env.DATABASE_URL,
  maxConnections: 20,
})

// 设置存储库
const threadRepo = createThreadRepository(database.db)
const messageRepo = createMessageRepository(database.db)

// 创建带存储的智能体
const agent = withStorage(
  createAgent({
    name: 'assistant',
    model: openaiText('gpt-4o'),
    systemPrompt: '你很有帮助。',
  }),
  { database }
)

// 使用
async function chatWithPersistence(userId: string, message: string) {
  // 查找或创建线程
  let thread = await threadRepo.findActive(userId)
  if (!thread) {
    thread = await threadRepo.create({
      userId,
      title: '新对话',
    })
  }

  // 发送消息（自动保存）
  const result = await agent.run(message, {
    threadId: thread.id,
    userId,
  })

  // 历史自动保存
  return result.content
}
```

## 后续步骤

- [数据库设置](./storage/database.md) - 数据库配置
- [线程和消息](./storage/threads.md) - 使用对话
- [持久化中间件](./storage/middleware.md) - 自动保存
- [线程续接](./storage/continuation.md) - 恢复对话

## 示例

- [12: 存储持久化](../examples/12-storage-persistence.md) - 完整存储示例
