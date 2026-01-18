# 错误处理

智能体执行可能由于以下原因而失败：

- 大语言模型错误（网络、身份验证、模型错误）
- 工具执行失败
- 取消（`AbortSignal`）
- 达到 `maxIterations`

## 模式

### 1) 处理最终的 `run()` 结果

`run()` 返回带有 `finishReason` 的 `AgentRunResult`：

- `stop`：正常完成
- `max_iterations`：达到迭代上限
- `error`：发生异常

```ts
const result = await agent.run('Do something complex')

if (result.finishReason === 'error') {
  console.error('Agent failed:', result.error)
}
```

### 2) 处理流式传输失败

流式传输时，监视 `chunk.type === 'error'`。

```ts
for await (const chunk of agent.stream('...')) {
  if (chunk.type === 'error') {
    console.error('stream error:', chunk.error)
  }
}
```

### 3) 取消执行

```ts
const controller = new AbortController()
setTimeout(() => controller.abort(), 10_000)

const result = await agent.run('Long request', { signal: controller.signal })
```

## 工具错误

工具返回 `ToolResult` 对象，失败通过以下方式显示：

- 流式传输 `tool-result` 事件（带有 `success: false`）
- 最终的 `AgentRunResult.toolCalls` 数组

有关如何验证工具输入，请参阅[工具验证](../tools/validation.md)。
