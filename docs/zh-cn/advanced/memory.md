# 记忆系统

Seashore 支持多层次的记忆：

- **进程内短期记忆**，用于轻量级的聊天历史和草稿上下文。
- **持久化长期记忆**，由数据库支持，可选择向量搜索。
- **记忆管理器 + 中间件**，用于将记忆集成到智能体提示和工具循环中。

如果需要可运行的基线示例，请参见 [examples/05-basic-memory.md](../examples/05-basic-memory.md)。

## "记忆"在这里的含义

至少有三个实用的层次：

1. **短期**：传递到提示中的当前线程/会话历史。
2. **中期**：摘要和整合的关键点（减少 token 增长）。
3. **长期**：通过语义检索的持久事实/偏好/知识。

Seashore 为所有三个层次提供原语，但您可以自由选择如何应用它们。

## 后续步骤

- [advanced/memory/short-term.md](./memory/short-term.md)
- [advanced/memory/mid-term.md](./memory/mid-term.md)
- [advanced/memory/long-term.md](./memory/long-term.md)
- [advanced/memory/integration.md](./memory/integration.md)
# 记忆系统

记忆系统使智能体能够在跨对话和交互中记住信息。Seashore 提供三种类型的记忆：短期、中期和长期。

## 概述

记忆类型：

- **短期**：当前对话（内存中）
- **中期**：会话级（小时/天，内存中或缓存）
- **长期**：跨会话持久化（数据库支持）

## 短期记忆

用于当前对话上下文：

```typescript
import { createShortTermMemory, type NewMemoryEntry } from '@seashorelab/memory'

const memory = createShortTermMemory({
  maxEntries: 50, // 最大存储条目数
})

// 添加记忆条目
memory.add({
  agentId: 'assistant',
  threadId: 'conv-123',
  type: 'short',
  content: '用户姓名是 Alice',
  importance: 0.8,
  metadata: { role: 'user' },
})

// 查询记忆
const memories = memory.queryByAgent('assistant', {
  threadId: 'conv-123',
  type: 'short',
})

// 获取摘要
const summary = memory.getSummary('conv-123')
```

## 中期记忆

用于会话级上下文：

```typescript
import { createMidTermMemory } from '@seashorelab/memory'

const memory = createMidTermMemory({
  maxEntries: 100,
  ttlMs: 24 * 60 * 60 * 1000, // 24 小时
})

// 类似的 API
memory.add({
  agentId: 'assistant',
  threadId: 'session-456',
  type: 'mid',
  content: '用户偏好：深色模式、紧凑视图',
  importance: 0.9,
})

const memories = memory.queryByAgent('assistant', {
  threadId: 'session-456',
})
```

## 长期记忆

跨会话的持久记忆：

```typescript
import { createLongTermMemory } from '@seashorelab/memory'
import { createDatabase } from '@seashorelab/storage'

const database = createDatabase({
  connectionString: process.env.DATABASE_URL,
})

const memory = createLongTermMemory({
  database,
  maxEntries: 1000,
})

// 保存重要信息
await memory.add({
  agentId: 'assistant',
  userId: 'user-789',
  type: 'long',
  content: '用户生日：1990-05-15',
  importance: 1.0,
  metadata: { category: 'personal' },
})

// 跨会话检索
const memories = await memory.queryByUser('user-789', {
  minImportance: 0.8,
})
```

## 记忆条目结构

```typescript
interface MemoryEntry {
  id: string              // 唯一标识符
  agentId: string         // 智能体标识符
  threadId?: string       // 对话线程
  userId?: string         // 用户标识符
  type: 'short' | 'mid' | 'long'
  content: string         // 记忆内容
  importance: number      // 0-1 相关性分数
  metadata?: Record<string, any>
  createdAt: Date
  expiresAt?: Date        // 用于中期记忆
}
```

## 在智能体中使用记忆

### 手动记忆管理

```typescript
import { createAgent } from '@seashorelab/agent'
import { createShortTermMemory } from '@seashorelab/memory'

const agent = createAgent({
  name: 'memory-assistant',
  model: openaiText('gpt-4o'),
  systemPrompt: '你记住过去的对话。',
})

const memory = createShortTermMemory({ maxEntries: 50 })
const threadId = 'conv-001'

// 处理用户消息
const userMessage = '我叫 Alice'

// 存储用户消息
memory.add({
  agentId: agent.name,
  threadId,
  type: 'short',
  content: `用户：${userMessage}`,
  importance: 0.7,
})

// 检索上下文
const memories = memory.queryByAgent(agent.name, { threadId })
const context = memories.map(m => m.content).join('\n')

// 使用上下文查询
const result = await agent.run(`
过去的对话：
${context}

用户：${userMessage}
`)

// 存储助手响应
memory.add({
  agentId: agent.name,
  threadId,
  type: 'short',
  content: `助手：${result.content}`,
  importance: 0.6,
})
```

### 记忆中间件

自动记忆集成：

```typescript
import { withMemory } from '@seashorelab/agent'

const memoryAgent = withMemory(agent, {
  memory,
  threadId: 'conv-001',
  includeInPrompt: true,
})

// 记忆自动管理
const result = await memoryAgent.run('我叫什么名字？')
// 智能体记住："你叫 Alice"
```

## 记忆查询

### 按智能体

```typescript
const memories = memory.queryByAgent('assistant', {
  threadId: 'conv-123',
  type: 'short',
  limit: 10,
})
```

### 按用户

```typescript
const memories = await memory.queryByUser('user-789', {
  minImportance: 0.8,
  fromDate: new Date('2024-01-01'),
  limit: 50,
})
```

### 按时间范围

```typescript
const memories = memory.queryByTimeRange(
  new Date('2024-01-01'),
  new Date('2024-01-31'),
  {
    agentId: 'assistant',
    minImportance: 0.5,
  }
)
```

### 语义搜索

按含义搜索记忆：

```typescript
import { createSemanticMemory } from '@seashorelab/memory'

const semanticMemory = createSemanticMemory({
  embeddingFunction: embeddingFn,
  maxEntries: 100,
})

await semanticMemory.add({
  agentId: 'assistant',
  content: '用户喜欢徒步和户外活动',
  importance: 0.9,
})

const relevant = await semanticMemory.semanticSearch(
  '用户喜欢什么？',
  { k: 5 }
)
```

## 记忆重要性

分配重要性分数以优先考虑记忆：

```typescript
memory.add({
  agentId: 'assistant',
  content: '用户生日',
  importance: 1.0, // 关键信息
})

memory.add({
  agentId: 'assistant',
  content: '天气讨论',
  importance: 0.3, // 随意对话
})

// 仅查询重要记忆
const important = memory.queryByAgent('assistant', {
  minImportance: 0.7,
})
```

## 记忆摘要

摘要对话历史：

```typescript
const summary = await memory.getSummary(threadId, {
  maxLength: 500,
  focusOn: ['key decisions', 'user preferences'],
})

console.log(summary)
// "用户 Alice 偏好深色模式。讨论了 1 月 15 日的项目截止日期。"
```

## 记忆修剪

管理记忆大小：

### 自动修剪

```typescript
const memory = createShortTermMemory({
  maxEntries: 50,
  pruneStrategy: 'least-important', // 移除低重要性
})
```

### 手动修剪

```typescript
// 移除旧条目
memory.prune({
  olderThan: new Date('2024-01-01'),
  minImportance: 0.5,
})

// 仅保留最近的
memory.prune({
  keepRecent: 20,
})
```

## 记忆模式

### 对话历史

```typescript
const conversationMemory = createShortTermMemory({
  maxEntries: 100,
})

// 存储每次交换
for (const exchange of conversation) {
  conversationMemory.add({
    agentId: 'assistant',
    threadId,
    content: `${exchange.role}: ${exchange.content}`,
    importance: 0.7,
  })
}
```

### 实体跟踪

```typescript
// 跟踪提到的实体
memory.add({
  agentId: 'assistant',
  content: '项目 "Phoenix" 截止日期：2024-02-15',
  importance: 0.9,
  metadata: {
    entityType: 'project',
    entityName: 'Phoenix',
    attribute: 'deadline',
  },
})

// 查询实体
const projects = memory.queryByAgent('assistant', {
  filter: m => m.metadata?.entityType === 'project',
})
```

### 用户偏好

```typescript
memory.add({
  agentId: 'assistant',
  userId: 'user-123',
  type: 'long',
  content: '偏好：邮件通知、深色主题、简洁回答',
  importance: 1.0,
  metadata: { category: 'preferences' },
})
```

## 记忆导出

导出记忆以进行备份或分析：

```typescript
// 导出为 JSON
const exported = memory.export()
fs.writeFileSync('memory-backup.json', JSON.stringify(exported))

// 从 JSON 导入
const data = JSON.parse(fs.readFileSync('memory-backup.json'))
memory.import(data)
```

## 最佳实践

1. **重要性分数**：为关键信息分配更高的分数
2. **元数据**：使用元数据进行分类和过滤
3. **修剪**：定期修剪低重要性的记忆
4. **摘要**：定期摘要长对话
5. **类型选择**：为用例使用适当的记忆类型
6. **隐私**：在长期记忆中谨慎处理敏感信息
7. **测试**：使用边缘情况测试记忆行为

## 示例：完整的记忆系统

```typescript
import { createAgent } from '@seashorelab/agent'
import { createShortTermMemory, createLongTermMemory } from '@seashorelab/memory'

// 用于对话的短期记忆
const shortTerm = createShortTermMemory({ maxEntries: 50 })

// 用于用户事实的长期记忆
const longTerm = createLongTermMemory({
  database,
  maxEntries: 1000,
})

const agent = createAgent({
  name: 'memory-agent',
  model: openaiText('gpt-4o'),
  systemPrompt: '你记住对话和用户偏好。',
})

async function chat(userId: string, threadId: string, message: string) {
  // 加载关于用户的长期记忆
  const userFacts = await longTerm.queryByUser(userId, {
    minImportance: 0.8,
  })

  // 加载最近的对话
  const recentChat = shortTerm.queryByAgent(agent.name, {
    threadId,
    limit: 10,
  })

  // 构建上下文
  const context = [
    '=== 用户事实 ===',
    ...userFacts.map(m => m.content),
    '',
    '=== 最近对话 ===',
    ...recentChat.map(m => m.content),
  ].join('\n')

  // 存储用户消息
  shortTerm.add({
    agentId: agent.name,
    threadId,
    content: `用户：${message}`,
    importance: 0.7,
  })

  // 获取响应
  const result = await agent.run(`
${context}

用户：${message}

自然回答，使用你记住的关于用户的信息。
`)

  // 存储响应
  shortTerm.add({
    agentId: agent.name,
    threadId,
    content: `助手：${result.content}`,
    importance: 0.6,
  })

  // 提取并存储重要事实
  const facts = extractFacts(message, result.content)
  for (const fact of facts) {
    await longTerm.add({
      agentId: agent.name,
      userId,
      type: 'long',
      content: fact,
      importance: 0.9,
    })
  }

  return result.content
}
```

## 后续步骤

- [短期记忆](./memory/short-term.md) - 详细的短期 API
- [中期记忆](./memory/mid-term.md) - 会话级记忆
- [长期记忆](./memory/long-term.md) - 持久记忆
- [记忆集成](./memory/integration.md) - 智能体集成模式

## 示例

- [05: 基础记忆](../examples/05-basic-memory.md) - 对话记忆
