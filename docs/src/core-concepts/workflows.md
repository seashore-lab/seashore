# Workflows

Workflows allow you to build complex agent pipelines by composing multiple nodes. Unlike ReAct agents that autonomously decide what to do, workflows follow a predefined structure.

## What is a Workflow?

A workflow is a directed graph of nodes that process data in sequence or parallel. Each node can:

- Call an LLM
- Execute a tool
- Apply conditional logic
- Run operations in parallel

## Creating a Workflow

### Basic Workflow

```typescript
import { createWorkflow, llmNode, toolNode } from '@seashore/workflow'
import { openaiText } from '@seashore/llm'
import { myTool } from './tools'

const workflow = createWorkflow({
  name: 'content-pipeline',
  nodes: [
    llmNode({
      id: 'research',
      model: openaiText('gpt-4o'),
      prompt: 'Research the topic: {{input.topic}}',
    }),
    llmNode({
      id: 'draft',
      model: openaiText('gpt-4o'),
      prompt: 'Write an article based on: {{nodes.research.output}}',
    }),
  ],
})
```

### Using a Workflow Agent

```typescript
import { createWorkflowAgent } from '@seashore/agent'

const agent = createWorkflowAgent({
  name: 'content-writer',
  workflow: workflow,
  defaultModel: openaiText('gpt-4o'),
})

const result = await agent.run({
  topic: 'The future of AI',
})
```

## Node Types

### LLM Node

Calls an LLM with a prompt:

```typescript
import { llmNode } from '@seashore/workflow'

const node = llmNode({
  id: 'summarize',
  model: openaiText('gpt-4o'),
  prompt: 'Summarize: {{input.text}}',
  systemPrompt: 'You are a helpful assistant.',
  temperature: 0.5,
})
```

### Tool Node

Executes a tool with input data:

```typescript
import { toolNode } from '@seashore/workflow'

const node = toolNode({
  id: 'search',
  tool: searchTool,
  inputMapping: {
    query: '{{input.keyword}}', // Map workflow input to tool input
  },
})
```

### Condition Node

Branches based on a condition:

```typescript
import { conditionNode } from '@seashore/workflow'

const node = conditionNode({
  id: 'check-length',
  condition: '{{nodes.draft.output.length}} > 1000',
  trueBranch: 'shorten',  // Node ID to run if true
  falseBranch: 'finalize', // Node ID to run if false
})
```

### Parallel Node

Runs multiple nodes in parallel:

```typescript
import { parallelNode } from '@seashore/workflow'

const node = parallelNode({
  id: 'multi-search',
  branches: [
    llmNode({
      id: 'search-1',
      model: openaiText('gpt-4o'),
      prompt: 'Search for: {{input.query}}',
    }),
    llmNode({
      id: 'search-2',
      model: anthropicText('claude-3-5-sonnet-20241022'),
      prompt: 'Search for: {{input.query}}',
    }),
  ],
})
```

## Data Flow

### Input Reference

Access workflow input in prompts:

```typescript
llmNode({
  id: 'process',
  prompt: 'Process: {{input.text}}', // Reference input.text
})
```

### Node Output Reference

Reference outputs from previous nodes:

```typescript
const workflow = createWorkflow({
  nodes: [
    llmNode({
      id: 'step1',
      prompt: 'First step: {{input.data}}',
    }),
    llmNode({
      id: 'step2',
      prompt: 'Second step: {{nodes.step1.output}}', // Use step1 output
    }),
  ],
})
```

### Custom Mappings

Transform data between nodes:

```typescript
llmNode({
  id: 'format',
  prompt: 'Format this: {{custom}}',
  inputMapping: {
    custom: '{{nodes.previous.output.toUpperCase()}}',
  },
})
```

## Workflow Configuration

### Sequential Execution

Nodes run in order by default:

```typescript
const workflow = createWorkflow({
  name: 'sequential',
  nodes: [
    llmNode({ id: 'step1', ... }),
    llmNode({ id: 'step2', ... }),
    llmNode({ id: 'step3', ... }),
  ],
})
```

### Conditional Branching

Use condition nodes to create branches:

```typescript
const workflow = createWorkflow({
  name: 'conditional',
  nodes: [
    llmNode({ id: 'analyze', ... }),
    conditionNode({
      id: 'decide',
      condition: '{{nodes.analyze.output}}.includes("positive")',
      trueBranch: 'handle-positive',
      falseBranch: 'handle-negative',
    }),
  ],
})
```

### Parallel Execution

Run multiple nodes concurrently:

```typescript
const workflow = createWorkflow({
  name: 'parallel',
  nodes: [
    parallelNode({
      id: 'parallel',
      branches: [
        llmNode({ id: 'branch1', ... }),
        llmNode({ id: 'branch2', ... }),
      ],
    }),
    llmNode({
      id: 'merge',
      prompt: 'Combine: {{nodes.branch1.output}} and {{nodes.branch2.output}}',
    }),
  ],
})
```

## Error Handling

### Node-Level Error Handling

```typescript
llmNode({
  id: 'risky-operation',
  model: openaiText('gpt-4o'),
  prompt: '...',
  onError: {
    strategy: 'retry', // or 'continue' or 'fail'
    maxRetries: 3,
    fallbackValue: 'Default output',
  },
})
```

### Workflow-Level Error Handling

```typescript
const workflow = createWorkflow({
  name: 'my-workflow',
  nodes: [...],
  onError: {
    strategy: 'continue', // Continue on error
    errorHandler: async (error, context) => {
      console.error('Workflow error:', error)
      return { handled: true }
    },
  },
})
```

## Advanced Features

### Sub-Workflows

Embed workflows within workflows:

```typescript
const subWorkflow = createWorkflow({ name: 'sub', nodes: [...] })

const mainWorkflow = createWorkflow({
  name: 'main',
  nodes: [
    workflowNode({
      id: 'run-sub',
      workflow: subWorkflow,
      inputMapping: {
        data: '{{input.value}}',
      },
    }),
  ],
})
```

### Dynamic Node Selection

Choose which node to run at runtime:

```typescript
const node = switchNode({
  id: 'router',
  expression: '{{input.type}}',
  cases: {
    'article': llmNode({ id: 'article-handler', ... }),
    'summary': llmNode({ id: 'summary-handler', ... }),
    'default': llmNode({ id: 'default-handler', ... }),
  },
})
```

## Best Practices

1. **Keep Nodes Focused**: Each node should do one thing well

2. **Use Descriptive IDs**: Helps with debugging and output references

3. **Handle Errors**: Decide how to handle failures at each level

4. **Test Workflows**: Verify data flows correctly between nodes

5. **Monitor Performance**: Track execution time for each node

## When to Use Workflows vs ReAct Agents

| Use Case | Recommended Approach |
|----------|---------------------|
| Simple Q&A | ReAct Agent |
| Multi-step reasoning with unknown steps | ReAct Agent |
| Known sequence of operations | Workflow |
| Complex branching logic | Workflow |
| Parallel processing | Workflow |
| Tool orchestration with decision-making | ReAct Agent |

## Next Steps

- [Agents](agents.md) - Learn about ReAct agents
- [Tools](tools.md) - Create tools for workflows
- [Tutorials](../tutorials/workflows.md) - Complete workflow examples
