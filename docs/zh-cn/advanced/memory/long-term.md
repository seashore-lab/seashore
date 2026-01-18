# 长期记忆

长期记忆是以下内容的持久存储：

- 用户偏好
- 稳定事实
- 重要决策

它通常由数据库支持，可以选择支持向量搜索，以便您可以按含义而不仅仅是键进行回忆。

## LongTermMemory 与 MemoryManager

- `createLongTermMemory` 是一个存储抽象。
- `createMemoryManager` 协调存储、重要性和嵌入。

## 创建长期记忆

```ts
import { createLongTermMemory } from '@seashore/memory'

const longTerm = createLongTermMemory({
  db,
  // 可选：embeddingAdapter: openaiEmbed('text-embedding-3-small'),
})
```

## 语义回忆

如果启用了嵌入，您可以按含义（例如"用户偏好什么？"）而不是精确键进行查询。

## 重要性

实际上，您只存储高于阈值的项。记忆模块提供重要性评估器来帮助决定什么成为长期记忆。
