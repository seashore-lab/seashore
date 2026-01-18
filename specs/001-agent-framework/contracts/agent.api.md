# API Contract: @seashorelab/agent

**Package**: `@seashorelab/agent`  
**Version**: 0.1.0

## 概述

Agent 模块提供 ReAct 型和 Workflow 型智能体的创建与执行能力。

---

## 导出

```typescript
// 主入口
export { createAgent } from './react-agent'
export { createWorkflowAgent } from './workflow-agent'
export type { Agent, AgentConfig, AgentRunResult, AgentStreamChunk } from './types'
```

---

## createAgent

创建 ReAct 型 Agent 实例。

### 签名

```typescript
function createAgent<TTools extends Tool[]>(config: AgentConfig<TTools>): Agent<TTools>
```

### 参数

```typescript
interface AgentConfig<TTools extends Tool[]> {
  /** Agent 名称 */
  name: string

  /** 系统提示词 */
  systemPrompt: string

  /** LLM 模型适配器 */
  model: TextAdapter

  /** 可用工具列表 */
  tools?: TTools

  /** RAG 配置 (可选) */
  rag?: RAGConfig

  /** 记忆配置 (可选) */
  memory?: MemoryConfig

  /** 最大工具调用轮次 */
  maxIterations?: number // default: 5

  /** 温度参数 */
  temperature?: number // default: 0.7

  /** 结构化输出 schema (可选) */
  outputSchema?: ZodSchema
}
```

### 返回值

```typescript
interface Agent<TTools extends Tool[]> {
  /** Agent 名称 */
  readonly name: string

  /** 同步执行 */
  run(input: string, options?: RunOptions): Promise<AgentRunResult>

  /** 流式执行 */
  stream(input: string, options?: RunOptions): AsyncIterable<AgentStreamChunk>

  /** 继续对话 (带历史) */
  chat(messages: Message[], options?: RunOptions): AsyncIterable<AgentStreamChunk>
}
```

### 示例

```typescript
import { createAgent } from '@seashorelab/agent'
import { openaiText } from '@tanstack/ai-openai'
import { weatherTool } from './tools'

const agent = createAgent({
  name: 'WeatherBot',
  systemPrompt: '你是一个天气助手。',
  model: openaiText('gpt-4o'),
  tools: [weatherTool],
  maxIterations: 3,
})

// 同步执行
const result = await agent.run('北京天气如何？')
console.log(result.content)

// 流式执行
for await (const chunk of agent.stream('上海明天会下雨吗？')) {
  if (chunk.type === 'content') {
    process.stdout.write(chunk.delta)
  }
}
```

---

## createWorkflowAgent

创建 Workflow 型 Agent 实例。

### 签名

```typescript
function createWorkflowAgent<TWorkflow extends Workflow>(
  config: WorkflowAgentConfig<TWorkflow>
): WorkflowAgent<TWorkflow>
```

### 参数

```typescript
interface WorkflowAgentConfig<TWorkflow extends Workflow> {
  /** Agent 名称 */
  name: string

  /** 工作流定义 */
  workflow: TWorkflow

  /** 默认 LLM 模型 (节点未指定时使用) */
  defaultModel?: TextAdapter
}
```

### 返回值

```typescript
interface WorkflowAgent<TWorkflow extends Workflow> {
  /** Agent 名称 */
  readonly name: string

  /** 执行工作流 */
  run(input: WorkflowInput<TWorkflow>): Promise<WorkflowOutput<TWorkflow>>

  /** 流式执行 */
  stream(input: WorkflowInput<TWorkflow>): AsyncIterable<WorkflowStreamChunk>
}
```

---

## 类型定义

### AgentRunResult

```typescript
interface AgentRunResult {
  /** 最终响应内容 */
  content: string

  /** 工具调用历史 */
  toolCalls: ToolCallResult[]

  /** Token 使用统计 */
  usage: TokenUsage

  /** 完整消息历史 */
  messages: Message[]
}
```

### AgentStreamChunk

```typescript
type AgentStreamChunk =
  | { type: 'content'; delta: string }
  | { type: 'tool_call'; toolCall: ToolCall }
  | { type: 'tool_result'; result: ToolCallResult }
  | { type: 'error'; error: Error }
  | { type: 'done'; result: AgentRunResult }
```

### RunOptions

```typescript
interface RunOptions {
  /** 对话线程 ID (用于持久化) */
  threadId?: string

  /** 用户 ID */
  userId?: string

  /** 信号用于取消 */
  signal?: AbortSignal

  /** 覆盖温度参数 */
  temperature?: number
}
```

---

## 错误处理

```typescript
import { AgentError, ToolExecutionError, MaxIterationsError } from '@seashorelab/agent'

try {
  await agent.run('...')
} catch (error) {
  if (error instanceof MaxIterationsError) {
    console.log('Agent 达到最大迭代次数')
  } else if (error instanceof ToolExecutionError) {
    console.log('工具执行失败:', error.toolName, error.cause)
  }
}
```
