# 智能体

智能体是能够推理、行动并使用工具来完成任务的自主 AI 系统。Seashore 实现了 **ReAct**（推理 + 行动）模式，智能体通过这种方式反复思考问题、执行行动、观察结果并调整方法。

## 概述

在 Seashore 中，使用 `createAgent` 函数创建智能体，配置包括：

- **名称**：智能体的标识符
- **系统提示词**：指导智能体行为的指令
- **模型**：大语言模型适配器（OpenAI、Anthropic、Gemini）
- **工具**：智能体可以使用的工具数组（可选）
- **配置**：最大迭代次数、温度等设置

## 创建基本智能体

最简单的智能体只需要名称、系统提示词和模型：

```typescript
import { createAgent } from '@seashore/agent'
import { openaiText } from '@seashore/llm'

const agent = createAgent({
  name: 'assistant',
  model: openaiText('gpt-4o', {
    apiKey: process.env.OPENAI_API_KEY,
  }),
  systemPrompt: 'You are a helpful assistant.',
})
```

## 智能体方法

### `run()`

执行与智能体的单轮交互。在所有处理完成后返回完整结果。

```typescript
const result = await agent.run('What is TypeScript?')

console.log(result.content) // 智能体的响应
console.log(result.toolCalls) // 使用的工具（如果有）
console.log(result.usage) // Token 使用统计
console.log(result.durationMs) // 执行时间
```

**结果结构：**

```typescript
interface AgentRunResult {
  content: string              // 最终响应文本
  structured?: unknown         // 结构化输出（如果设置了 outputSchema）
  toolCalls: ToolCallRecord[]  // 执行的工具
  usage: TokenUsage            // Token 计数
  durationMs: number           // 执行持续时间
  finishReason: 'stop' | 'max_iterations' | 'error'
  error?: string               // 失败时的错误消息
}
```

### `stream()`

流式传输智能体的响应以实现实时更新：

```typescript
for await (const chunk of agent.stream('Tell me a story')) {
  if (chunk.type === 'content' && chunk.delta) {
    process.stdout.write(chunk.delta)
  }
}
```

**流块类型：**

- `content` - 文本内容增量
- `tool-call-start` - 工具执行开始
- `tool-result` - 工具执行完成
- `step-start` - ReAct 迭代开始
- `step-end` - ReAct 迭代结束
- `usage` - Token 使用更新
- `finish` - 流完成

### `chat()`

多轮对话与消息历史：

```typescript
const messages = [
  { role: 'user', content: 'My name is Alice.' },
  { role: 'assistant', content: 'Hello Alice! Nice to meet you.' },
  { role: 'user', content: 'What is my name?' },
] as const

for await (const chunk of agent.chat(messages)) {
  if (chunk.type === 'content' && chunk.delta) {
    process.stdout.write(chunk.delta)
  }
}
```

## 运行选项

所有智能体方法都接受可选的运行选项：

```typescript
const result = await agent.run('Your question', {
  // 如果耗时过长则中止执行
  signal: AbortSignal.timeout(30000),

  // 用于对话上下文的线程 ID
  threadId: 'conv-123',

  // 用于归因的用户 ID
  userId: 'user-456',

  // 自定义元数据
  metadata: { source: 'web' },

  // 覆盖此运行的最大迭代次数
  maxIterations: 5,

  // 覆盖此运行的温度
  temperature: 0.7,
})
```

## 配置选项

### 系统提示词

系统提示词指导智能体的行为和个性：

```typescript
const agent = createAgent({
  name: 'code-reviewer',
  systemPrompt: `You are an expert code reviewer. When reviewing code:
- Focus on best practices and potential bugs
- Be constructive and educational
- Suggest specific improvements
- Keep feedback concise`,
  model: openaiText('gpt-4o'),
})
```

### 最大迭代次数

控制智能体可以执行多少个 ReAct 循环：

```typescript
const agent = createAgent({
  name: 'assistant',
  model: openaiText('gpt-4o'),
  systemPrompt: 'You are helpful.',
  maxIterations: 10, // 默认为 5
})
```

这可以防止无限循环，同时允许多步骤推理。

### 温度

控制响应的随机性（0.0 到 2.0）：

```typescript
const agent = createAgent({
  name: 'creative-writer',
  model: openaiText('gpt-4o'),
  systemPrompt: 'You are a creative writer.',
  temperature: 1.2, // 越高越有创意
})
```

- **0.0-0.3**：确定性、专注（适合事实性任务）
- **0.4-0.7**：平衡创意和连贯性
- **0.8-2.0**：非常有创意，不太可预测

### 输出模式

使用 Zod 模式定义结构化输出：

```typescript
import { z } from 'zod'

const agent = createAgent({
  name: 'data-extractor',
  model: openaiText('gpt-4o'),
  systemPrompt: 'Extract structured data.',
  outputSchema: z.object({
    name: z.string(),
    age: z.number(),
    email: z.string().email(),
  }),
})

const result = await agent.run('Name: John, Age: 30, Email: john@example.com')
console.log(result.structured) // { name: 'John', age: 30, email: 'john@example.com' }
```

## ReAct 模式

Seashore 智能体使用 ReAct（推理 + 行动）模式：

1. **思考**：智能体推理任务
2. **行动**：智能体选择并执行工具
3. **观察**：智能体观察工具结果
4. **重复**：重复步骤 1-3 直到任务完成

ReAct 循环示例：

```
User: What is the weather in Tokyo and what's 15 + 27?

Thought: I need to get weather data and perform a calculation.
Action: get_weather(city: "Tokyo")
Observation: {"temperature": 22, "condition": "Sunny"}

Thought: Now I need to calculate 15 + 27.
Action: calculator(expression: "15 + 27")
Observation: {"result": 42}

Thought: I have all the information needed.
Final Answer: The weather in Tokyo is 22°C and sunny. 15 + 27 equals 42.
```

## 错误处理

智能体使用重试逻辑优雅地处理错误：

```typescript
import { AgentError, isRetryableError, withRetry } from '@seashore/agent'

try {
  const result = await agent.run('Your question')
} catch (error) {
  if (error instanceof AgentError) {
    console.error('Agent error:', error.code, error.message)

    if (isRetryableError(error)) {
      // 重试操作
      const result = await withRetry(
        () => agent.run('Your question'),
        { maxRetries: 3 }
      )
    }
  }
}
```

**错误代码：**

- `MODEL_ERROR` - 大语言模型 API 错误
- `TOOL_ERROR` - 工具执行失败
- `VALIDATION_ERROR` - 输入/输出验证失败
- `MAX_ITERATIONS_EXCEEDED` - ReAct 循环过多
- `ABORTED` - 执行已取消
- `TIMEOUT` - 执行超时

## 高级用法

### 自定义工具上下文

向工具传递自定义上下文：

```typescript
const agent = createAgent({
  name: 'db-agent',
  model: openaiText('gpt-4o'),
  systemPrompt: 'You query databases.',
  tools: [queryTool],
})

// 将数据库连接传递给工具
const result = await agent.run('Get user 123', {
  toolContext: {
    database: myDatabaseConnection,
    userId: currentUserId,
  },
})
```

### 中止执行

取消长时间运行的操作：

```typescript
const controller = new AbortController()

// 30 秒后取消
setTimeout(() => controller.abort(), 30000)

try {
  const result = await agent.run('Your question', {
    signal: controller.signal,
  })
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Execution cancelled')
  }
}
```

### 收集流

使用实用函数处理流：

```typescript
import { collectStream } from '@seashore/agent'

// 将所有块收集到单个结果中
const result = await collectStream(agent.stream('Your question'))

console.log(result.content) // 完整文本
console.log(result.toolCalls) // 所有工具调用
console.log(result.usage) // 总 Token 使用
```

## 智能体类型

### ReAct 智能体

默认且当前唯一的智能体类型。实现带有工具调用的 ReAct 模式。

```typescript
import { createReActAgent } from '@seashore/agent'

// 显式创建 ReAct 智能体（与 createAgent 相同）
const agent = createReActAgent({
  name: 'assistant',
  model: openaiText('gpt-4o'),
  systemPrompt: 'You are helpful.',
  tools: [tool1, tool2],
})
```

### 工作流智能体

智能体可以在工作流中使用。详情请参阅[工作流智能体集成](./agents/workflow-integration.md)。

## 最佳实践

1. **清晰的系统提示词**：明确智能体的角色和约束
2. **适当的最大迭代次数**：在能力和成本之间取得平衡
3. **错误处理**：始终处理错误并实现重试逻辑
4. **流式传输**：使用流式传输以获得更好的用户体验
5. **工具上下文**：传递必要的上下文而不是在工具中硬编码
6. **监控**：在生产环境中跟踪 Token 使用和执行时间
7. **测试**：使用各种输入和边缘情况测试智能体

## 下一步

- [ReAct 智能体](./agents/react.md) - 深入了解 ReAct 模式
- [智能体配置](./agents/configuration.md) - 高级配置选项
- [流式响应](./agents/streaming.md) - 掌握流式模式
- [错误处理](./agents/error-handling.md) - 健壮的错误处理策略
- [工具](./tools.md) - 了解如何创建和使用工具

## 示例

查看这些完整的示例：

- [01: 基本智能体](../examples/01-basic-agent.md) - 没有工具的简单智能体
- [02: 带有工具的智能体](../examples/02-agent-tools-stream.md) - 带有工具和流式传输的智能体
- [05: 记忆](../examples/05-basic-memory.md) - 带有对话记忆的智能体
- [09: 可观测性](../examples/09-observability-tracing.md) - 可追踪的智能体执行
