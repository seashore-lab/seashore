# 智能体配置

本页面描述由 `@seashorelab/agent` 实现的 `createAgent` 的配置。

公共类型位于 `packages/agent/src/types.ts` 中，并在规范契约 `specs/001-agent-framework/contracts/agent.api.md` 中进行了总结。

## `createAgent(config)`

最小配置：

```ts
import { createAgent } from '@seashorelab/agent'
import { openaiText } from '@seashorelab/llm'

const agent = createAgent({
  name: 'assistant',
  systemPrompt: 'You are helpful and concise.',
  model: openaiText('gpt-5.1', {
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
  }),
})
```

## 字段

### `name: string`

用于日志、追踪、存储归因等的逻辑标识符。

### `systemPrompt: string`

智能体级别的指令块。Seashore 将其作为系统提示词传递给底层的 `@seashorelab/llm` `chat()` 调用。

### `model: AnyTextAdapter`

由 `@seashorelab/llm` 生成的大语言模型适配器（例如 `openaiText(...)`、`anthropicText(...)`、`geminiText(...)`）。

### `tools?: Tool[]`

可选工具列表。每个工具都使用 `@seashorelab/tool` 定义，具有：

- 派生自 Zod 的 JSON 模式
- 运行时 `execute()` 函数

### `maxIterations?: number`（默认：`5`）

每次调用的 ReAct 循环上限。这限制了失控的工具循环。

您可以通过 `agent.run(input, { maxIterations })` 在每次运行时覆盖。

### `temperature?: number`（默认：`0.7`）

控制随机性。可以通过 `agent.run(input, { temperature })` 在每次运行时覆盖。

### `outputSchema?: ZodSchema`

可选的结构化输出解析器。Seashore 将尝试将**最终文本响应**解析为模式，并在 `result.structured` 中显示。

## 运行选项

所有执行方法都接受 `RunOptions`：

- `threadId` / `userId`（持久化 + 归因）
- 用于取消的 `signal`
- 用于自定义标签的 `metadata`
- 每次运行的覆盖：`maxIterations`、`temperature`

用法示例请参阅[智能体](../agents.md)。
