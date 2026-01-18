# API Contract: @seashorelab/workflow

**Package**: `@seashorelab/workflow`  
**Version**: 0.1.0

## 概述

Workflow 模块提供复杂 Agent 工作流的编排能力，支持顺序执行、并行分支、条件路由和循环控制。

---

## 导出

```typescript
// 核心
export { createWorkflow, type Workflow, type WorkflowConfig } from './workflow'

// 节点
export {
  createNode,
  createLLMNode,
  createToolNode,
  createConditionNode,
  createParallelNode,
  type WorkflowNode,
} from './nodes'

// 执行
export {
  executeWorkflow,
  type WorkflowExecutionResult,
  type WorkflowContext,
} from './execution'

// 类型
export type { NodeInput, NodeOutput, EdgeCondition } from './types'
```

---

## Workflow 定义

### createWorkflow

```typescript
import { createWorkflow, createNode, createLLMNode, createConditionNode } from '@seashorelab/workflow'
import { openaiText } from '@seashorelab/llm'

const workflow = createWorkflow({
  name: 'customer-support',
  description: '客户支持工作流',

  nodes: {
    // 分类节点
    classify: createLLMNode({
      adapter: openaiText('gpt-4o-mini'),
      prompt: '将用户问题分类为: billing, technical, general',
    }),

    // 条件路由
    router: createConditionNode({
      conditions: [
        { when: (ctx) => ctx.classify.output.includes('billing'), goto: 'billingHandler' },
        { when: (ctx) => ctx.classify.output.includes('technical'), goto: 'techHandler' },
        { otherwise: 'generalHandler' },
      ],
    }),

    // 处理节点
    billingHandler: createLLMNode({ ... }),
    techHandler: createLLMNode({ ... }),
    generalHandler: createLLMNode({ ... }),

    // 最终回复
    respond: createLLMNode({
      adapter: openaiText('gpt-4o'),
      prompt: (ctx) => `基于处理结果生成最终回复: ${ctx.previousOutput}`,
    }),
  },

  edges: [
    { from: 'classify', to: 'router' },
    { from: 'billingHandler', to: 'respond' },
    { from: 'techHandler', to: 'respond' },
    { from: 'generalHandler', to: 'respond' },
  ],

  entryNode: 'classify',
})
```

---

## 节点类型

### createLLMNode

LLM 调用节点：

```typescript
import { createLLMNode } from '@seashorelab/workflow'

const node = createLLMNode({
  name: 'summarize',
  adapter: openaiText('gpt-4o'),

  // 静态提示词
  prompt: '总结以下内容...',

  // 或动态提示词
  prompt: (ctx) => `总结: ${ctx.input.content}`,

  // 系统提示词
  systemPrompt: '你是一个专业的摘要助手',

  // 工具
  tools: [searchTool, calculatorTool],

  // 输出解析
  outputSchema: z.object({
    summary: z.string(),
    keyPoints: z.array(z.string()),
  }),
})
```

### createToolNode

工具调用节点：

```typescript
import { createToolNode } from '@seashorelab/workflow'

const node = createToolNode({
  name: 'search',
  tool: serperTool({ apiKey: '...' }),

  // 输入映射
  input: (ctx) => ({
    query: ctx.input.query,
    numResults: 5,
  }),

  // 输出转换
  transform: (result) => ({
    searchResults: result.results,
  }),
})
```

### createConditionNode

条件路由节点：

```typescript
import { createConditionNode } from '@seashorelab/workflow'

const node = createConditionNode({
  name: 'router',
  conditions: [
    {
      when: (ctx) => ctx.score > 0.8,
      goto: 'highConfidence',
    },
    {
      when: (ctx) => ctx.score > 0.5,
      goto: 'mediumConfidence',
    },
    {
      otherwise: 'lowConfidence',
    },
  ],
})
```

### createParallelNode

并行执行节点：

```typescript
import { createParallelNode } from '@seashorelab/workflow'

const node = createParallelNode({
  name: 'parallel-search',

  // 并行执行多个分支
  branches: {
    web: createToolNode({ tool: serperTool(...) }),
    docs: createLLMNode({ prompt: 'Search docs...' }),
    db: createToolNode({ tool: dbQueryTool(...) }),
  },

  // 合并结果
  merge: (results) => ({
    combined: [
      ...results.web.items,
      ...results.docs.items,
      ...results.db.items,
    ],
  }),

  // 可选：失败策略
  failurePolicy: 'partial', // 'all' | 'partial' | 'none'
})
```

### createNode

自定义节点：

```typescript
import { createNode } from '@seashorelab/workflow'

const node = createNode({
  name: 'custom-processor',

  execute: async (input, ctx) => {
    // 自定义逻辑
    const processed = await processData(input)

    // 访问上下文
    const previousResult = ctx.getNodeOutput('previousNode')

    // 返回输出
    return {
      data: processed,
      metadata: { timestamp: Date.now() },
    }
  },

  // 输入验证
  inputSchema: z.object({
    data: z.array(z.string()),
  }),

  // 输出验证
  outputSchema: z.object({
    data: z.array(z.string()),
    metadata: z.object({ timestamp: z.number() }),
  }),
})
```

---

## 循环控制

### 使用循环

```typescript
const workflow = createWorkflow({
  nodes: {
    init: createNode({ ... }),

    process: createLLMNode({
      prompt: (ctx) => `处理第 ${ctx.loopIndex + 1} 项: ${ctx.currentItem}`,
    }),

    check: createConditionNode({
      conditions: [
        { when: (ctx) => ctx.items.length === 0, goto: 'finish' },
        { otherwise: 'process' }, // 继续循环
      ],
    }),

    finish: createNode({ ... }),
  },

  edges: [
    { from: 'init', to: 'process' },
    { from: 'process', to: 'check' },
  ],

  // 循环配置
  loops: {
    processLoop: {
      nodes: ['process', 'check'],
      maxIterations: 10,
      exitCondition: (ctx) => ctx.items.length === 0,
    },
  },
})
```

### Map-Reduce 模式

```typescript
const workflow = createWorkflow({
  nodes: {
    split: createNode({
      execute: (input) => ({
        items: input.documents.map((doc, i) => ({ doc, index: i })),
      }),
    }),

    map: createParallelNode({
      // 动态并行
      forEach: (ctx) => ctx.items,
      node: createLLMNode({
        prompt: (ctx) => `总结: ${ctx.currentItem.doc}`,
      }),
      maxConcurrency: 5,
    }),

    reduce: createLLMNode({
      prompt: (ctx) => `合并以下摘要: ${ctx.map.results.join('\n')}`,
    }),
  },

  edges: [
    { from: 'split', to: 'map' },
    { from: 'map', to: 'reduce' },
  ],
})
```

---

## 执行

### executeWorkflow

```typescript
import { executeWorkflow } from '@seashorelab/workflow'

const result = await executeWorkflow(workflow, {
  input: {
    query: '用户的问题...',
    userId: 'user-123',
  },

  // 可选配置
  timeout: 60000,

  // 事件回调
  onNodeStart: (nodeName, input) => {
    console.log(`Starting: ${nodeName}`)
  },
  onNodeComplete: (nodeName, output, duration) => {
    console.log(`Completed: ${nodeName} in ${duration}ms`)
  },
  onNodeError: (nodeName, error) => {
    console.error(`Error in ${nodeName}:`, error)
  },
})

console.log('Final output:', result.output)
console.log('Execution path:', result.executionPath)
console.log('Total duration:', result.durationMs)
```

### 流式执行

```typescript
for await (const event of executeWorkflow.stream(workflow, { input })) {
  switch (event.type) {
    case 'node:start':
      console.log(`Starting: ${event.nodeName}`)
      break
    case 'node:output':
      console.log(`Output from ${event.nodeName}:`, event.output)
      break
    case 'node:complete':
      console.log(`Completed: ${event.nodeName}`)
      break
    case 'workflow:complete':
      console.log('Workflow finished:', event.output)
      break
  }
}
```

---

## 上下文

### WorkflowContext

```typescript
interface WorkflowContext {
  // 获取节点输出
  getNodeOutput<T>(nodeName: string): T | undefined

  // 获取所有节点输出
  getAllOutputs(): Record<string, unknown>

  // 原始输入
  input: unknown

  // 当前节点信息
  currentNode: string
  executionPath: string[]

  // 循环上下文
  loopIndex?: number
  currentItem?: unknown

  // 元数据
  startTime: Date
  metadata: Record<string, unknown>
}
```

---

## 错误处理

### 重试策略

```typescript
const node = createLLMNode({
  name: 'api-call',
  adapter: openaiText('gpt-4o'),

  retry: {
    maxAttempts: 3,
    backoff: 'exponential', // 'fixed' | 'exponential'
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    retryOn: ['rate_limit', 'timeout', 'server_error'],
  },
})
```

### Fallback 节点

```typescript
const node = createLLMNode({
  name: 'primary-llm',
  adapter: openaiText('gpt-4o'),

  fallback: {
    node: createLLMNode({
      name: 'fallback-llm',
      adapter: anthropicText('claude-3-haiku'),
    }),
    when: ['error', 'timeout'],
  },
})
```

---

## 类型定义

```typescript
export interface WorkflowConfig {
  name: string
  description?: string
  nodes: Record<string, WorkflowNode>
  edges: Edge[]
  entryNode: string
  loops?: Record<string, LoopConfig>
}

export interface Edge {
  from: string
  to: string
  condition?: (ctx: WorkflowContext) => boolean
}

export interface WorkflowNode {
  name: string
  execute: (input: unknown, ctx: WorkflowContext) => Promise<unknown>
  inputSchema?: ZodSchema
  outputSchema?: ZodSchema
  retry?: RetryConfig
  fallback?: FallbackConfig
}

export interface WorkflowExecutionResult {
  output: unknown
  executionPath: string[]
  nodeOutputs: Record<string, unknown>
  durationMs: number
  tokenUsage?: TokenUsage
}

export interface LoopConfig {
  nodes: string[]
  maxIterations: number
  exitCondition?: (ctx: WorkflowContext) => boolean
}
```
