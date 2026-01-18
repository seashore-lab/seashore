# Workflows

Workflows in Seashore provide explicit multi-step orchestration.

Compared to a ReAct agent:

- Workflows are deterministic in structure.
- You decide node boundaries and data flow.
- Streaming is available at the node/token level.

The workflow API lives in `@seashore/workflow`.

## Example

The runnable example [examples/src/03-basic-workflow.ts](../examples/03-basic-workflow.md) builds a two-node workflow:

1. Generate an outline
2. Generate the article content based on the outline

## Next

- [Creating Workflows](./workflows/creating.md)
- [Workflow Nodes](./workflows/nodes.md)
- [Workflow Execution](./workflows/execution.md)
# Workflows

Workflows enable you to build complex multi-step AI pipelines by orchestrating multiple nodes (LLMs, tools, conditions, etc.) in a directed graph. Workflows are perfect for scenarios that require sequential processing, branching logic, or parallel execution.

## Overview

A workflow in Seashore consists of:

- **Nodes**: Individual processing units (LLM, tool, condition, parallel, custom)
- **Edges**: Connections between nodes that define execution flow
- **Context**: Shared state that flows through the workflow
- **Start Node**: Entry point for execution

## Creating a Workflow

### Basic Example

```typescript
import { createWorkflow, createLLMNode } from '@seashore/workflow'
import { openaiText } from '@seashore/llm'

const model = openaiText('gpt-4o', {
  apiKey: process.env.OPENAI_API_KEY,
})

// Create nodes
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

// Create workflow
const workflow = createWorkflow({
  name: 'article-generation',
  nodes: [outlineNode, contentNode],
  edges: [
    { from: 'generate-outline', to: 'generate-content' }
  ],
  startNode: 'generate-outline',
})

// Execute
const result = await workflow.execute({ topic: 'AI in 2026' })
const content = result.getNodeOutput('generate-content')
console.log(content.content)
```

## Workflow Nodes

### LLM Node

Process input using an LLM:

```typescript
import { createLLMNode, type LLMNodeOutput } from '@seashore/workflow'

const node = createLLMNode({
  name: 'analyzer',
  model: openaiText('gpt-4o'),
  systemPrompt: 'You are a data analyzer.',
  
  // Simple prompt (converted to user message)
  prompt: (input) => `Analyze: ${input.data}`,
  
  // Or full message control
  messages: (input, ctx) => [
    { role: 'user', content: `Data: ${input.data}` }
  ],
  
  // Optional settings
  temperature: 0.7,
  maxTokens: 1000,
})
```

**LLMNodeOutput:**
```typescript
{
  content: string      // LLM response text
  usage: TokenUsage    // Token usage stats
  finishReason: string // Completion reason
}
```

### Tool Node

Execute a tool:

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

**ToolNodeOutput:**
```typescript
{
  success: boolean
  data?: any
  error?: string
  durationMs: number
}
```

### Condition Node

Branch based on conditions:

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

### Switch Node

Multiple branch conditions:

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

### Parallel Node

Execute multiple nodes concurrently:

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

// Access results
const results = ctx.getNodeOutput('multi-analysis')
// results = { sentiment: {...}, entities: {...}, summary: {...} }
```

### Custom Node

Define custom processing logic:

```typescript
import { createNode } from '@seashore/workflow'

const customNode = createNode({
  name: 'processor',
  execute: async (input, ctx) => {
    // Custom logic
    const data = await fetchFromDatabase(input.id)
    const processed = await processData(data)
    
    return {
      success: true,
      result: processed,
    }
  },
})
```

## Workflow Context

Access previous node outputs and shared state:

```typescript
const node = createLLMNode({
  name: 'summarizer',
  model,
  messages: (input, ctx) => {
    // Get output from previous nodes
    const outline = ctx.getNodeOutput('generate-outline')
    const research = ctx.getNodeOutput('research')
    
    // Access initial input
    console.log('Original topic:', input.topic)
    
    // Check which nodes executed
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

**Context Methods:**
- `getNodeOutput<T>(name)` - Get a node's output
- `hasNodeExecuted(name)` - Check if a node ran
- `getAllNodeOutputs()` - Get all outputs
- `getMetadata()` - Get workflow metadata

## Execution Modes

### Execute (Non-Streaming)

Wait for complete execution:

```typescript
const result = await workflow.execute({ topic: 'AI' })

// Access node outputs
const outline = result.getNodeOutput('generate-outline')
const content = result.getNodeOutput('generate-content')

// Get all outputs
const all = result.getAllNodeOutputs()
```

### Stream (Real-Time Events)

Get real-time execution updates:

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
      // Streaming LLM tokens
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

## Advanced Patterns

### Loop Node

Repeat execution until a condition:

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
    // Break if quality is good enough
    if (output.content.includes('excellent')) {
      return breakLoop(output)
    }
    // Continue refining
    return { text: output.content }
  },
})
```

### For-Each Node

Process array items:

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

// Outputs array of summaries
```

### Map-Reduce Pattern

Process in parallel, then aggregate:

```typescript
import { createMapReduceNode } from '@seashore/workflow'

const mapReduceNode = createMapReduceNode({
  name: 'analyze-all',
  items: (input) => input.texts,
  
  // Map: Process each item
  mapNode: createLLMNode({
    name: 'analyze-one',
    model,
    prompt: (item) => `Analyze: ${item}`,
  }),
  
  // Reduce: Combine results
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

## Error Handling

### Try-Catch Pattern

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

### Validation Node

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

## Workflow Composition

Combine workflows into larger systems:

```typescript
import { composeWorkflows } from '@seashore/workflow'

const preprocessing = createWorkflow({
  name: 'preprocess',
  // ... nodes ...
})

const analysis = createWorkflow({
  name: 'analyze',
  // ... nodes ...
})

const fullPipeline = composeWorkflows({
  name: 'full-pipeline',
  workflows: [preprocessing, analysis],
})
```

## Abort and Timeout

### Abort Execution

```typescript
const controller = new AbortController()

setTimeout(() => controller.abort(), 10000) // Abort after 10s

const result = await workflow.execute(
  { topic: 'AI' },
  { signal: controller.signal }
)
```

### Timeout

```typescript
const result = await workflow.execute(
  { topic: 'AI' },
  { timeout: 30000 } // 30 second timeout
)
```

## Visualization

Workflows can be visualized using Mermaid diagrams or custom renderers (feature in development).

## Best Practices

1. **Node Names**: Use descriptive, unique names for all nodes
2. **Error Handling**: Add error handling nodes for critical paths
3. **Parallelization**: Use parallel nodes for independent operations
4. **Context Access**: Use `ctx.getNodeOutput()` instead of passing data through input
5. **Streaming**: Use streaming for long-running workflows
6. **Testing**: Test each node independently before composing
7. **Monitoring**: Track execution time and errors in production

## Next Steps

- [Creating Workflows](./workflows/creating.md) - Detailed workflow creation
- [Workflow Nodes](./workflows/nodes.md) - All node types explained
- [Workflow Execution](./workflows/execution.md) - Execution patterns
- [Agent Nodes](./workflows/agent-nodes.md) - Using agents in workflows

## Examples

- [03: Basic Workflow](../examples/03-basic-workflow.md) - Article generation workflow
- [14: Context Engineering](../examples/14-context-engineering.md) - Advanced context management
