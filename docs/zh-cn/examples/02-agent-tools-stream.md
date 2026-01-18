# 示例 02：带工具和流式输出的 Agent

源文件：`examples/src/02-agent-with-tools-and-stream.ts`

## 演示内容

- 使用 `defineTool` + Zod schema 定义工具
- 将工具附加到 agent
- 在流式输出时观察工具调用事件

## 运行方法

```bash
pnpm --filter @seashore/examples exec tsx src/02-agent-with-tools-and-stream.ts
```

## 观察要点

- 当模型请求工具时会出现 `tool-call-start` 块
- `tool-result` 块显示反馈给模型的工具输出

## 核心概念

- 工具：[core/tools.md](../core/tools.md)
- 工具定义：[core/tools/defining.md](../core/tools/defining.md)
- 流式输出：[core/agents/streaming.md](../core/agents/streaming.md)
