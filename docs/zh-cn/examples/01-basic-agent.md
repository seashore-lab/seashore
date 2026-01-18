# 示例 01：基础 Agent

源文件：`examples/src/01-basic-agent.ts`

## 演示内容

- 使用 LLM 适配器创建最小化的 agent
- 单轮 `agent.run()`
- 带流式输出的多轮 `agent.chat()`

## 运行方法

```bash
pnpm --filter @seashorelab/examples exec tsx src/01-basic-agent.ts
```

## 核心概念

- Agent：[core/agents.md](../core/agents.md)
- 流式输出：[core/agents/streaming.md](../core/agents/streaming.md)
