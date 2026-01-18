# 短期记忆

短期记忆是一个轻量级的进程内存储，用于：

- 小型聊天历史窗口
- 运行中的工具输出缓存
- 为下一个提示构建"对话历史"块

这是示例 05 中使用的模式。

## 示例

```ts
import { createShortTermMemory, type NewMemoryEntry } from '@seashorelab/memory'

const memory = createShortTermMemory({ maxEntries: 20 })

const entry: NewMemoryEntry = {
  agentId: 'memory-assistant',
  threadId: 'conversation-001',
  type: 'short',
  content: '用户说：你好！',
  importance: 0.7,
  metadata: { role: 'user' },
}

memory.add(entry)
const items = memory.queryByAgent('memory-assistant', { threadId: 'conversation-001' })
```

## 最佳实践

- 保持短期记忆*小*且*最近*。您始终可以将重要事实持久化到长期记忆。
- 存储结构化元数据（角色、工具名称、时间戳），以便以后可以摘要/过滤。
