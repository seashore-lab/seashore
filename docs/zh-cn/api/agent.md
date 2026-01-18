# API 参考：Agent

包：`@seashore/agent`

## 主要入口

- `createAgent(config)` 创建一个 agent 实例。

常用配置字段（详见核心文档）：

- `name`
- `model`（文本适配器）
- `systemPrompt`
- `tools`
- `maxIterations`、`temperature`、`outputSchema`（可选）

## 运行

- `agent.run(input)` 单轮运行
- `agent.chat(messages)` 多轮对话（可流式传输）
- `agent.stream(input)` 流式块传输（内容 + 工具生命周期）

## 流式传输类型

流会发出类型化的块，例如：

- 内容增量
- 工具调用开始/参数/结束
- 工具结果
- 完成/错误

参见：

- [core/agents/streaming.md](../core/agents/streaming.md)
- [examples/02-agent-tools-stream.md](../examples/02-agent-tools-stream.md)

## 工具函数

- `executeTool`、`executeTools`、`formatToolResult`
- 重试和错误辅助函数（`withRetry`、`AgentError` 等）
- 线程继续辅助函数（`continueThread`、`streamContinueThread`）
