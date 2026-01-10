# Workflows Tutorial

This tutorial introduces you to Seashore's workflow system, which allows you to create complex, multi-step AI processes. Workflows are composed of nodes that can include LLM calls, tool executions, conditions, and parallel operations.

## What You'll Learn

- How to create workflows using `createWorkflow`
- Creating LLM nodes with `createLLMNode`
- Connecting nodes with edges
- Accessing outputs from previous nodes
- Running workflows in execute and stream modes

## Prerequisites

Before starting this tutorial, make sure you have:

- Node.js 18+ installed
- pnpm installed
- An OpenAI API key:
  ```bash
  export OPENAI_API_KEY=your_api_key_here
  ```

## Step 1: Import Required Packages

```typescript
import 'dotenv/config';
import {
  createWorkflow,
  createLLMNode,
  type WorkflowContext,
  type LLMNodeOutput,
} from '@seashore/workflow';
import { openaiText } from '@seashore/llm';
```

## Step 2: Set Up the Model

```typescript
const model = openaiText('gpt-5.1', {
  baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY || '',
});
```

## Step 3: Create the Outline Node

Create a node that generates an article outline:

```typescript
const outlineNode = createLLMNode({
  name: 'generate-outline',
  model,
  systemPrompt:
    'You are an expert in article outlining. Generate a concise outline based on the given topic.',
  prompt: (input) =>
    `Please generate a brief article outline (2-3 key points) for the following topic:\n\nTopic: ${(input as { topic: string }).topic}`,
});
```

**LLM Node Properties:**

| Property | Description | Required |
|----------|-------------|----------|
| `name` | Unique identifier for the node | Yes |
| `model` | LLM adapter instance | Yes |
| `systemPrompt` | System instructions for the LLM | Yes |
| `prompt` | Simple prompt function (receives input) | No* |
| `messages` | Full message control | No* |

*Either `prompt` or `messages` can be provided. If both are present, `messages` takes precedence.

## Step 4: Create the Content Node

Create a node that generates content based on the outline:

```typescript
const contentNode = createLLMNode({
  name: 'generate-content',
  model,
  systemPrompt:
    'You are an expert in article writing. Please write the content based on the outline (~150-200 words in total).',
  messages: (input, ctx: WorkflowContext) => {
    // Access output from the outline node
    const outlineOutput = ctx.getNodeOutput<LLMNodeOutput>('generate-outline');
    const outline = outlineOutput?.content ?? '';

    return [
      {
        role: 'user',
        content: `Topic: ${(input as { topic: string }).topic}\n\nOutline:\n${outline}\n\nPlease write the content based on the above outline.`,
      },
    ];
  },
});
```

**WorkflowContext Methods:**

| Method | Description |
|--------|-------------|
| `getNodeOutput<T>(name)` | Get output from a previous node by name |
| `getInput()` | Get the original workflow input |
| `getMetadata()` | Get workflow metadata |

## Step 5: Create the Workflow

Connect the nodes into a workflow:

```typescript
const workflow = createWorkflow<{ topic: string }>({
  name: 'article-generation',
  nodes: [outlineNode, contentNode],
  edges: [{ from: 'generate-outline', to: 'generate-content' }],
  startNode: 'generate-outline',
});
```

**Workflow Properties:**

| Property | Description | Required |
|----------|-------------|----------|
| `name` | Workflow identifier | Yes |
| `nodes` | Array of workflow nodes | Yes |
| `edges` | Connections between nodes | Yes |
| `startNode` | Entry point node name | Yes |

## Step 6: Execute the Workflow

Run the workflow and wait for completion:

```typescript
const topic = 'AI Development Trends in 2026';
const result = await workflow.execute({ topic });

// Access node outputs
const outlineOutput = result.getNodeOutput<LLMNodeOutput>('generate-outline');
const contentOutput = result.getNodeOutput<LLMNodeOutput>('generate-content');

console.log('Outline:', outlineOutput?.content);
console.log('Content:', contentOutput?.content);
console.log(`Execution time: ${result.durationMs}ms`);
```

## Step 7: Stream the Workflow

Stream workflow events in real-time:

```typescript
for await (const event of workflow.stream({ topic })) {
  switch (event.type) {
    case 'workflow_start':
      console.log('Workflow started');
      break;
    case 'node_start':
      console.log(`Node started: ${event.data.nodeName}`);
      break;
    case 'llm_token':
      // Stream each token as it's generated
      process.stdout.write(event.data.delta);
      break;
    case 'node_complete':
      console.log(`Node completed: ${event.data.nodeName}`);
      break;
    case 'workflow_complete':
      console.log('Workflow completed!');
      break;
    case 'workflow_error':
    case 'node_error':
      console.error(`Error: ${JSON.stringify(event.data)}`);
      break;
  }
}
```

**Stream Event Types:**

| Event Type | Description |
|------------|-------------|
| `workflow_start` | Workflow execution has started |
| `node_start` | A node has started executing |
| `llm_token` | A token was generated (streaming) |
| `node_complete` | A node finished successfully |
| `workflow_complete` | Entire workflow finished |
| `workflow_error` | Workflow-level error |
| `node_error` | Node-level error |

## Running the Example

```bash
cd D:\Projects\seashore\examples
pnpm run 03-basic-workflow
```

**Expected Output:**

```
[Example 03: Workflow Basic]

Topic: AI Development Trends in 2026

--- Starting workflow (`execute` mode) ---

Step 1 - Outline:
1. **Mainstream Adoption of Multimodal & Agentic AI**
   - Expansion from text-only models to robust multimodal systems...
   - Rise of AI agents that can plan, take actions across tools/APIs...

2. **Shift Toward Smaller, Specialized & On-Device Models**
   - Growth of domain-specific models optimized for particular industries...

3. **Regulation, Safety, and Governance as Core Design Constraints**
   - AI regulation shaping how models are trained, evaluated, and deployed...

Step 2 - Content:
Artificial intelligence is entering a new phase defined by three powerful shifts...

--- Workflow completed ---
Total execution time: 7485ms

--- Starting workflow (`stream` mode) ---

Workflow started

Node started: generate-outline
1. **Maturation of Multimodal and Agentic AI**
   ...
   Node completed: generate-outline

Node started: generate-content
The next phase of AI will be defined by three reinforcing trends...
   Node completed: generate-content

Workflow completed!
```

## Source Code

The complete source code for this example is available at:
[`examples/src/03-basic-workflow.ts`](https://github.com/seahorse/seashore/blob/main/examples/src/03-basic-workflow.ts)

## Key Concepts

### Workflow Execution Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `execute()` | Runs entire workflow, returns results | When you need final outputs only |
| `stream()` | Streams events in real-time | For progress tracking and real-time updates |

### Node Communication

Nodes communicate through the `WorkflowContext`:

```typescript
messages: (input, ctx) => {
  const previousOutput = ctx.getNodeOutput<LLMNodeOutput>('previous-node');
  // Use previousOutput to build context
}
```

### Edge Definitions

Edges define the execution flow:

```typescript
edges: [
  { from: 'node1', to: 'node2' },
  { from: 'node2', to: 'node3' },
]
```

## Extensions

### Conditional Nodes

Use condition nodes to branch logic:

```typescript
import { createConditionNode } from '@seashore/workflow';

const sentimentNode = createConditionNode({
  name: 'check-sentiment',
  condition: async (input, ctx) => {
    const output = ctx.getNodeOutput('analyze');
    return output.sentiment === 'positive' ? 'positive' : 'negative';
  },
  branches: {
    positive: positiveResponseNode,
    negative: negativeResponseNode,
  },
});
```

### Parallel Execution

Run multiple nodes in parallel:

```typescript
const workflow = createWorkflow({
  name: 'parallel-workflow',
  nodes: [node1, node2, node3, aggregationNode],
  edges: [
    { from: 'start', to: 'node1' },
    { from: 'start', to: 'node2' },
    { from: 'start', to: 'node3' },
    { from: 'node1', to: 'aggregation' },
    { from: 'node2', to: 'aggregation' },
    { from: 'node3', to: 'aggregation' },
  ],
});
```

### Tool Nodes

Add tool execution nodes:

```typescript
import { createToolNode } from '@seashore/workflow';

const toolNode = createToolNode({
  name: 'fetch-data',
  tool: myDataTool,
});
```

### Dynamic Workflows

Create workflows dynamically based on input:

```typescript
function createDynamicWorkflow(options: { style: string }) {
  const nodes = options.style === 'formal'
    ? [formalOutlineNode, formalContentNode]
    : [casualOutlineNode, casualContentNode];

  return createWorkflow({
    name: 'dynamic-article',
    nodes,
    edges: [{ from: nodes[0].name, to: nodes[1].name }],
    startNode: nodes[0].name,
  });
}
```

## Best Practices

1. **Keep nodes focused** - Each node should have a single responsibility
2. **Use descriptive names** - Clear node names help with debugging
3. **Handle errors** - Always handle `workflow_error` and `node_error` events
4. **Test nodes independently** - Verify each node works before connecting
5. **Document dependencies** - Comment on which nodes depend on which outputs

## Next Steps

- Explore **RAG pipelines** for knowledge retrieval in the [RAG Tutorial](./rag-pipeline.md)
- Learn about **agent creation** for interactive AI in the [Basic Agent Tutorial](./basic-agent.md)
- Add **memory systems** for persistent context in the [Memory Tutorial](./memory-systems.md)
