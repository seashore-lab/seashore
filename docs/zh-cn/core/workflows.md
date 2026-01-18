# 工作流

Seashore 中的工作流提供显式的多步编排。

与 ReAct 智能体相比：

- 工作流在结构上是确定性的。
- 您决定节点边界和数据流。
- 流式传输在节点/Token 级别可用。

工作流 API 位于 `@seashore/workflow` 中。

## 示例

可运行的示例 [examples/src/03-basic-workflow.ts](../examples/03-basic-workflow.md) 构建了一个两个节点的工作流：

1. 生成大纲
2. 基于大纲生成文章内容

## 下一步

- [创建工作流](./workflows/creating.md)
- [工作流节点](./workflows/nodes.md)
- [工作流执行](./workflows/execution.md)

# 工作流

工作流使您能够通过编排有向图中的多个节点（大语言模型、工具、条件等）来构建复杂的多步 AI 管道。工作流非常适合需要顺序处理、分支逻辑或并行执行的场景。

## 概述

Seashore 中的工作流由以下部分组成：

- **节点**：单个处理单元（大语言模型、工具、条件、并行、自定义）
- **边**：定义执行流的节点之间的连接
- **上下文**：流经工作流的共享状态
- **起始节点**：执行的入口点

## 创建工作流

### 基本示例

```typescript
import { createWorkflow, createLLMNode } from '@seashore/workflow'
import { openaiText } from '@seashore/llm'

const model = openaiText('gpt-4o', {
  apiKey: process.env.OPENAI_API_KEY,
})

// 创建节点
const outlineNode = createLLMNode({
  name: 'generate-outline',
  model,
  systemPrompt: 'Generate a brief article outline.',
  prompt: (input) => `Topic: ${input.topic}`,
})

const contentNode = createLLMNode({
  name: 'generate-content',
  model,
  systemPrompt: 'Write article content based on the outline.',
  messages: (input, ctx) => {
    const outline = ctx.getNodeOutput('generate-outline')
    return [
      {
        role: 'user',
        content: `Topic: ${input.topic}\nOutline: ${outline.content}`
      }
    ]
  },
})

// 创建工作流
const workflow = createWorkflow({
  name: 'article-generation',
  nodes: [outlineNode, contentNode],
  edges: [
    { from: 'generate-outline', to: 'generate-content' }
  ],
  startNode: 'generate-outline',
})

// 执行
const result = await workflow.execute({ topic: 'AI in 2026' })
const content = result.getNodeOutput('generate-content')
console.log(content.content)
```

## 工作流节点

### 大语言模型节点

使用大语言模型处理输入：

```typescript
import { createLLMNode, type LLMNodeOutput } from '@seashore/workflow'

const node = createLLMNode({
  name: 'analyzer',
  model: openaiText('gpt-4o'),
  systemPrompt: 'You are a data analyzer.',

  // 简单提示（转换为用户消息）
  prompt: (input) => `Analyze: ${input.data}`,

  // 或完整的消息控制
  messages: (input, ctx) => [
    { role: 'user', content: `Data: ${input.data}` }
  ],

  // 可选设置
  temperature: 0.7,
  maxTokens: 1000,
})
```

**LLMNodeOutput：**
```typescript
{
  content: string      // 大语言模型响应文本
  usage: TokenUsage    // Token 使用统计
  finishReason: string // 完成原因
}
```

### 工具节点

执行工具：

```typescript
import { createToolNode, type ToolNodeOutput } from '@seashore/workflow'

const toolNode = createToolNode({
  name: 'fetch-data',
  tool: myTool,
  input: (input, ctx) => ({
    query: input.query,
  }),
})
```

**ToolNodeOutput：**
```typescript
{
  success: boolean
  data?: any
  error?: string
  durationMs: number
}
```

### 条件节点

基于条件分支：

```typescript
import { createConditionNode } from '@seashore/workflow'

const conditionNode = createConditionNode({
  name: 'check-quality',
  condition: (input, ctx) => {
    const result = ctx.getNodeOutput('analyzer')
    return result.content.includes('approved')
  },
  trueBranch: 'publish',
  falseBranch: 'reject',
})
```

### 开关节点

多个分支条件：

```typescript
import { createSwitchNode } from '@seashore/workflow'

const switchNode = createSwitchNode({
  name: 'route-request',
  switch: (input, ctx) => {
    if (input.type === 'urgent') return 'priority-handler'
    if (input.type === 'normal') return 'standard-handler'
    return 'default-handler'
  },
  cases: {
    'priority-handler': 'urgent-processor',
    'standard-handler': 'normal-processor',
    'default-handler': 'fallback',
  },
})
```

### 并行节点

并发执行多个节点：

```typescript
import { createParallelNode } from '@seashore/workflow'

const parallelNode = createParallelNode({
  name: 'multi-analysis',
  branches: [
    createLLMNode({ name: 'sentiment', model, prompt: 'Sentiment?' }),
    createLLMNode({ name: 'entities', model, prompt: 'Entities?' }),
    createLLMNode({ name: 'summary', model, prompt: 'Summary?' }),
  ],
})

// 访问结果
const results = ctx.getNodeOutput('multi-analysis')
// results = { sentiment: {...}, entities: {...}, summary: {...} }
```

### 自定义节点

定义自定义处理逻辑：

```typescript
import { createNode } from '@seashore/workflow'

const customNode = createNode({
  name: 'processor',
  execute: async (input, ctx) => {
    // 自定义逻辑
    const data = await fetchFromDatabase(input.id)
    const processed = await processData(data)

    return {
      success: true,
      result: processed,
    }
  },
})
```

## 工作流上下文

访问先前的节点输出和共享状态：

```typescript
const node = createLLMNode({
  name: 'summarizer',
  model,
  messages: (input, ctx) => {
    // 从先前的节点获取输出
    const outline = ctx.getNodeOutput('generate-outline')
    const research = ctx.getNodeOutput('research')

    // 访问初始输入
    console.log('Original topic:', input.topic)

    // 检查哪些节点已执行
    if (ctx.hasNodeExecuted('validator')) {
      const validation = ctx.getNodeOutput('validator')
    }

    return [
      {
        role: 'user',
        content: `Outline: ${outline.content}\nResearch: ${research.data}`,
      },
    ]
  },
})
```

**上下文方法：**
- `getNodeOutput<T>(name)` - 获取节点的输出
- `hasNodeExecuted(name)` - 检查节点是否已运行
- `getAllNodeOutputs()` - 获取所有输出
- `getMetadata()` - 获取工作流元数据

## 执行模式

### 执行（非流式）

等待完整执行：

```typescript
const result = await workflow.execute({ topic: 'AI' })

// 访问节点输出
const outline = result.getNodeOutput('generate-outline')
const content = result.getNodeOutput('generate-content')

// 获取所有输出
const all = result.getAllNodeOutputs()
```

### 流（实时事件）

获取实时执行更新：

```typescript
for await (const event of workflow.stream({ topic: 'AI' })) {
  switch (event.type) {
    case 'node-start':
      console.log(`Starting ${event.nodeName}`)
      break

    case 'node-complete':
      console.log(`Completed ${event.nodeName}`)
      console.log('Output:', event.output)
      break

    case 'llm-token':
      // 流式传输大语言模型 token
      process.stdout.write(event.delta)
      break

    case 'workflow-complete':
      console.log('Workflow finished')
      break

    case 'error':
      console.error('Error:', event.error)
      break
  }
}
```

## 高级模式

### 循环节点

重复执行直到满足条件：

```typescript
import { createLoopNode, breakLoop } from '@seashore/workflow'

const loopNode = createLoopNode({
  name: 'refine',
  maxIterations: 5,
  body: createLLMNode({
    name: 'refiner',
    model,
    prompt: (input) => `Improve: ${input.text}`,
  }),
  condition: (input, ctx, iteration) => {
    const output = ctx.getNodeOutput('refiner')
    // 如果质量足够好，则中断
    if (output.content.includes('excellent')) {
      return breakLoop(output)
    }
    // 继续改进
    return { text: output.content }
  },
})
```

### For-Each 节点

处理数组项：

```typescript
import { createForEachNode } from '@seashore/workflow'

const forEachNode = createForEachNode({
  name: 'process-items',
  items: (input) => input.documents,
  body: createLLMNode({
    name: 'summarize',
    model,
    prompt: (item) => `Summarize: ${item}`,
  }),
})

// 输出摘要数组
```

### Map-Reduce 模式

并行处理，然后聚合：

```typescript
import { createMapReduceNode } from '@seashore/workflow'

const mapReduceNode = createMapReduceNode({
  name: 'analyze-all',
  items: (input) => input.texts,

  // Map：处理每一项
  mapNode: createLLMNode({
    name: 'analyze-one',
    model,
    prompt: (item) => `Analyze: ${item}`,
  }),

  // Reduce：组合结果
  reduceNode: createLLMNode({
    name: 'synthesize',
    model,
    messages: (input, ctx) => {
      const analyses = ctx.getNodeOutput('analyze-all')
      return [{
        role: 'user',
        content: `Synthesize these analyses: ${JSON.stringify(analyses)}`,
      }]
    },
  }),
})
```

## 错误处理

### Try-Catch 模式

```typescript
import { createNode } from '@seashore/workflow'

const safeNode = createNode({
  name: 'safe-operation',
  execute: async (input, ctx) => {
    try {
      const result = await riskyOperation(input)
      return { success: true, data: result }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        fallback: 'default-value',
      }
    }
  },
})
```

### 验证节点

```typescript
import { createValidationNode } from '@seashore/workflow'

const validationNode = createValidationNode({
  name: 'validate-input',
  schema: z.object({
    email: z.string().email(),
    age: z.number().positive(),
  }),
  onError: 'handle-validation-error',
})
```

## 工作流组合

将工作流组合成更大的系统：

```typescript
import { composeWorkflows } from '@seashore/workflow'

const preprocessing = createWorkflow({
  name: 'preprocess',
  // ... 节点 ...
})

const analysis = createWorkflow({
  name: 'analyze',
  // ... 节点 ...
})

const fullPipeline = composeWorkflows({
  name: 'full-pipeline',
  workflows: [preprocessing, analysis],
})
```

## 中止和超时

### 中止执行

```typescript
const controller = new AbortController()

setTimeout(() => controller.abort(), 10000) // 10 秒后中止

const result = await workflow.execute(
  { topic: 'AI' },
  { signal: controller.signal }
)
```

### 超时

```typescript
const result = await workflow.execute(
  { topic: 'AI' },
  { timeout: 30000 } // 30 秒超时
)
```

## 可视化

工作流可以使用 Mermaid 图或自定义渲染器进行可视化（功能开发中）。

## 最佳实践

1. **节点名称**：为所有节点使用描述性、唯一的名称
2. **错误处理**：为关键路径添加错误处理节点
3. **并行化**：对独立操作使用并行节点
4. **上下文访问**：使用 `ctx.getNodeOutput()` 而不是通过输入传递数据
5. **流式传输**：对长时间运行的工作流使用流式传输
6. **测试**：在组合之前独立测试每个节点
7. **监控**：在生产环境中跟踪执行时间和错误

## 下一步

- [创建工作流](./workflows/creating.md) - 详细的工作流创建
- [工作流节点](./workflows/nodes.md) - 所有节点类型说明
- [工作流执行](./workflows/execution.md) - 执行模式
- [智能体节点](./workflows/agent-nodes.md) - 在工作流中使用智能体

## 示例

- [03：基本工作流](../examples/03-basic-workflow.md) - 文章生成工作流
- [14：上下文工程](../examples/14-context-engineering.md) - 高级上下文管理
