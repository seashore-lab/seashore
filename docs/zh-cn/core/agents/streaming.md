# 流式响应

Seashore 智能体通过 `agent.stream(input)` 和 `agent.chat(messages)` 支持流式传输。

流式传输是 `packages/agent/src/types.ts` 中定义的 `AgentStreamChunk` 事件的 `AsyncIterable`。

## 典型消费模式

```ts
for await (const chunk of agent.stream('Explain RAG in one paragraph')) {
  if (chunk.type === 'content' && chunk.delta) process.stdout.write(chunk.delta)

  if (chunk.type === 'tool-call-start' && chunk.toolCall) {
    console.log(`\n[tool:start] ${chunk.toolCall.name}`)
  }

  if (chunk.type === 'tool-result' && chunk.toolResult) {
    console.log(`\n[tool:result] ${JSON.stringify(chunk.toolResult.data)}`)
  }
}
```

可运行的示例请参阅 [examples/src/02-agent-with-tools-and-stream.ts](../../examples/02-agent-tools-stream.md)。

## 块类型

智能体流使用这些事件类型：

- `content`：`delta` 中的增量助手文本
- `tool-call-start` / `tool-call-args` / `tool-call-end`：在工具选择周围发出
- `tool-result`：工具执行后发出
- `finish`：包含最终的 `AgentRunResult`
- `error`：包含 `Error`

注意：

- 工具参数在 `tool-call-args` 中作为 JSON 字符串发出（镜像底层大语言模型工具调用格式）。
- 即使在 `error` 事件之后，智能体也会发出 `finish` 事件；最终结果将具有 `finishReason: 'error'`。

## 多轮流式传输（`chat`）

`agent.chat(messages)` 接受具有 `user` 和 `assistant` 等角色的消息数组。

```ts
const messages = [
  { role: 'user', content: 'My name is David.' },
  { role: 'assistant', content: 'Hi David!' },
  { role: 'user', content: 'What is the first letter of my name?' },
] as const

for await (const chunk of agent.chat(messages)) {
  if (chunk.type === 'content' && chunk.delta) process.stdout.write(chunk.delta)
}
```

这在 [examples/src/01-basic-agent.ts](../../examples/01-basic-agent.md) 中演示。
