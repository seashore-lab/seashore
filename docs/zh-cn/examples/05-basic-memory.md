# 示例 05：基础记忆

源文件：`examples/src/05-basic-memory.ts`

## 演示内容

- 使用 `createShortTermMemory` 存储最近的对话轮次
- 手动构建"对话历史"上下文块
- 将记忆派生的上下文输入到 `agent.run()`

## 运行方法

```bash
pnpm --filter @seashorelab/examples exec tsx src/05-basic-memory.ts
```

## 核心概念

- 记忆概述：[advanced/memory.md](../advanced/memory.md)
- 短期记忆：[advanced/memory/short-term.md](../advanced/memory/short-term.md)
