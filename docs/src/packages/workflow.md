# @seashore/workflow

Node-based workflow orchestration for complex agent operations.

## Installation

```bash
pnpm add @seashore/workflow
```

Required peer dependencies:
```bash
pnpm add @seashore/llm @seashore/tool
```

## Overview

`@seashore/workflow` provides:

- Node-based workflow composition with LLM, tool, and condition nodes
- Sequential execution, parallel branches, and conditional routing
- Loop control for iterative operations
- Map-reduce patterns for batch processing
- Error handling with retries and fallbacks

## Quick Start

### Creating a Workflow

```typescript
import { createWorkflow, createLLMNode, createConditionNode } from '@seashore/workflow'
import { openaiText } from '@seashore/llm'

const workflow = createWorkflow({
  name: 'customer-support',
  description: 'Customer support workflow',

  nodes: {
    // Classify user query
    classify: createLLMNode({
      adapter: openaiText('gpt-4o-mini'),
      prompt: 'Classify the query as: billing, technical, or general',
    }),

    // Route based on classification
    router: createConditionNode({
      conditions: [
        { when: (ctx) => ctx.classify.output.includes('billing'), goto: 'billingHandler' },
        { when: (ctx) => ctx.classify.output.includes('technical'), goto: 'techHandler' },
        { otherwise: 'generalHandler' },
      ],
    }),

    // Handler nodes
    billingHandler: createLLMNode({
      adapter: openaiText('gpt-4o'),
      prompt: (ctx) => `Handle billing issue: ${ctx.input.query}`,
    }),

    techHandler: createLLMNode({
      adapter: openaiText('gpt-4o'),
      prompt: (ctx) => `Handle technical issue: ${ctx.input.query}`,
    }),

    generalHandler: createLLMNode({
      adapter: openaiText('gpt-4o'),
      prompt: (ctx) => `Handle general query: ${ctx.input.query}`,
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

### Executing a Workflow

```typescript
import { executeWorkflow } from '@seashore/workflow'

const result = await executeWorkflow(workflow, {
  input: { query: 'How do I reset my password?' },
})

console.log('Final output:', result.output)
console.log('Execution path:', result.executionPath)
```

## API Reference

### createWorkflow

Creates a workflow definition.

```typescript
function createWorkflow(config: WorkflowConfig): Workflow
```

#### Configuration

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Unique workflow identifier |
| `description` | `string` | No | Workflow description |
| `nodes` | `Record<string, WorkflowNode>` | Yes | Node definitions |
| `edges` | `Edge[]` | Yes | Connections between nodes |
| `entryNode` | `string` | Yes | Starting node name |
| `loops` | `Record<string, LoopConfig>` | No | Loop configurations |

### Node Types

#### createLLMNode

LLM invocation node.

```typescript
import { createLLMNode } from '@seashore/workflow'

const node = createLLMNode({
  name: 'summarize',
  adapter: openaiText('gpt-4o'),
  prompt: 'Summarize the following content...',
  systemPrompt: 'You are a helpful assistant',
  tools: [searchTool, calculatorTool],
  outputSchema: z.object({
    summary: z.string(),
    keyPoints: z.array(z.string()),
  }),
})
```

#### createToolNode

Tool execution node.

```typescript
import { createToolNode } from '@seashore/workflow'

const node = createToolNode({
  name: 'search',
  tool: serperTool({ apiKey: '...' }),
  input: (ctx) => ({
    query: ctx.input.query,
    numResults: 5,
  }),
  transform: (result) => ({
    searchResults: result.results,
  }),
})
```

#### createConditionNode

Conditional routing node.

```typescript
import { createConditionNode } from '@seashore/workflow'

const node = createConditionNode({
  name: 'router',
  conditions: [
    { when: (ctx) => ctx.score > 0.8, goto: 'highConfidence' },
    { when: (ctx) => ctx.score > 0.5, goto: 'mediumConfidence' },
    { otherwise: 'lowConfidence' },
  ],
})
```

#### createParallelNode

Parallel execution node.

```typescript
import { createParallelNode } from '@seashore/workflow'

const node = createParallelNode({
  name: 'parallel-search',
  branches: {
    web: createToolNode({ tool: serperTool(...) }),
    docs: createLLMNode({ ... }),
    db: createToolNode({ tool: dbQueryTool(...) }),
  },
  merge: (results) => ({
    combined: [
      ...results.web.items,
      ...results.docs.items,
      ...results.db.items,
    ],
  }),
  failurePolicy: 'partial', // 'all' | 'partial' | 'none'
})
```

#### createNode

Custom node for arbitrary logic.

```typescript
import { createNode } from '@seashore/workflow'

const node = createNode({
  name: 'custom-processor',
  execute: async (input, ctx) => {
    const processed = await processData(input)
    const previousResult = ctx.getNodeOutput('previousNode')
    return {
      data: processed,
      metadata: { timestamp: Date.now() },
    }
  },
  inputSchema: z.object({
    data: z.array(z.string()),
  }),
  outputSchema: z.object({
    data: z.array(z.string()),
    metadata: z.object({ timestamp: z.number() }),
  }),
})
```

## Loop Control

### Basic Loop

```typescript
const workflow = createWorkflow({
  nodes: {
    init: createNode({
      execute: (input) => ({ items: input.documents }),
    }),

    process: createLLMNode({
      prompt: (ctx) => `Process item ${ctx.loopIndex + 1}: ${ctx.currentItem}`,
    }),

    check: createConditionNode({
      conditions: [
        { when: (ctx) => ctx.items.length === 0, goto: 'finish' },
        { otherwise: 'process' },
      ],
    }),

    finish: createNode({
      execute: (ctx) => ({ results: ctx.processedItems }),
    }),
  },

  edges: [
    { from: 'init', to: 'process' },
    { from: 'process', to: 'check' },
  ],

  loops: {
    processLoop: {
      nodes: ['process', 'check'],
      maxIterations: 10,
      exitCondition: (ctx) => ctx.items.length === 0,
    },
  },
})
```

### Map-Reduce Pattern

```typescript
const workflow = createWorkflow({
  nodes: {
    split: createNode({
      execute: (input) => ({
        items: input.documents.map((doc, i) => ({ doc, index: i })),
      }),
    }),

    map: createParallelNode({
      forEach: (ctx) => ctx.items,
      node: createLLMNode({
        prompt: (ctx) => `Summarize: ${ctx.currentItem.doc}`,
      }),
      maxConcurrency: 5,
    }),

    reduce: createLLMNode({
      prompt: (ctx) => `Combine these summaries: ${ctx.map.results.join('\n')}`,
    }),
  },

  edges: [
    { from: 'split', to: 'map' },
    { from: 'map', to: 'reduce' },
  ],
})
```

## Workflow Execution

### executeWorkflow

```typescript
import { executeWorkflow } from '@seashore/workflow'

const result = await executeWorkflow(workflow, {
  input: {
    query: 'User question...',
    userId: 'user-123',
  },
  timeout: 60000,
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
```

### Streaming Execution

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

## Workflow Context

Nodes access context through the `ctx` parameter:

```typescript
interface WorkflowContext {
  // Get output from specific node
  getNodeOutput<T>(nodeName: string): T | undefined

  // Get all node outputs
  getAllOutputs(): Record<string, unknown>

  // Original input
  input: unknown

  // Current state
  currentNode: string
  executionPath: string[]

  // Loop context
  loopIndex?: number
  currentItem?: unknown

  // Metadata
  startTime: Date
  metadata: Record<string, unknown>
}
```

## Error Handling

### Retry Strategy

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

### Fallback Node

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

## Best Practices

1. **Keep nodes focused**: Each node should do one thing well
2. **Use condition nodes sparingly**: Too many branches make workflows hard to follow
3. **Set loop limits**: Always specify maxIterations to prevent infinite loops
4. **Handle errors**: Use retries and fallbacks for external operations
5. **Use parallel nodes**: For independent operations that can run concurrently

## See Also

- [Workflows Core Concept](../core-concepts/workflows.md)
- [Agent Package](agent.md)
- [LLM Package](llm.md)
- [Tool Package](tool.md)
