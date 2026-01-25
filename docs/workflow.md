# @seashorelab/workflow

This package provides a node-based workflow orchestration system for building multi-step AI pipelines. Workflows consist of nodes connected by edges, enabling complex processing chains with LLM calls, tool executions, and conditional logic.

## Creating a Workflow

A workflow is defined by nodes and edges:

```ts
import { createWorkflow, createLLMNode } from '@seashorelab/workflow';
import { createWorkflowAgent } from '@seashorelab/agent';
import { openaiText } from '@seashorelab/llm';

const model = openaiText('gpt-4o', {
  apiKey: process.env.OPENAI_API_KEY,
});

// Create nodes
const outlineNode = createLLMNode({
  name: 'generate-outline',
  model,
  systemPrompt: 'You are an expert at creating article outlines.',
  prompt: (input) => `Create an outline for: ${input.topic}`,
});

const contentNode = createLLMNode({
  name: 'generate-content',
  model,
  systemPrompt: 'You are an expert at writing articles.',
  messages: (input, ctx) => {
    const outline = ctx.getNodeOutput('generate-outline')?.content;
    return [
      { role: 'user', content: `Write about: ${outline}` }
    ];
  },
});

// Create workflow
const workflow = createWorkflow({
  name: 'article-generator',
  nodes: [outlineNode, contentNode],
  edges: [
    { from: 'generate-outline', to: 'generate-content' }
  ],
  startNode: 'generate-outline',
});

// Create agent and execute
const agent = createWorkflowAgent({
  name: 'article-agent',
  workflow,
});

const result = await agent.runWorkflow({ message: 'AI Trends 2026' });
const outline = result.getNodeOutput('generate-outline')?.content;
const content = result.getNodeOutput('generate-content')?.content;
```

## LLM Nodes

LLM nodes call language models with prompts:

```ts
import { createLLMNode } from '@seashorelab/workflow';

// Using prompt (simpler, creates a user message)
const simpleNode = createLLMNode({
  name: 'simple',
  model,
  systemPrompt: 'You are a helpful assistant.',
  prompt: (input) => `Summarize: ${input.text}`,
});

// Using messages (full control)
const advancedNode = createLLMNode({
  name: 'advanced',
  model,
  systemPrompt: 'You are a helpful assistant.',
  messages: (input, ctx) => {
    const prevOutput = ctx.getNodeOutput('simple')?.content;
    return [
      { role: 'user', content: `Previous: ${prevOutput}\n\nExpand on this.` }
    ];
  },
  // Optional: model parameters
  temperature: 0.7,
  maxTokens: 500,
});
```

## Tool Nodes

Tool nodes execute tools and pass results to subsequent nodes:

```ts
import { createToolNode } from '@seashorelab/workflow';
import { weatherTool } from './tools';

const weatherNode = createToolNode({
  name: 'get-weather',
  tool: weatherTool,
  // Extract tool arguments from input
  getToolInput: (input) => ({
    city: (input as { city: string }).city,
  }),
});

const summaryNode = createLLMNode({
  name: 'summarize-weather',
  model,
  messages: (input, ctx) => {
    const weather = ctx.getNodeOutput('get-weather')?.data;
    return [
      { role: 'user', content: `Summarize this weather data: ${JSON.stringify(weather)}` }
    ];
  },
});
```

## Condition Nodes

Route workflow execution based on conditions:

```ts
import { createConditionNode, createSwitchNode } from '@seashorelab/workflow';

// Simple condition (two paths)
const sentimentNode = createConditionNode({
  name: 'check-sentiment',
  condition: (input, ctx) => {
    const sentiment = ctx.getNodeOutput('analyze')?.sentiment;
    return sentiment === 'positive' ? 'positive' : 'negative';
  },
});

// Switch node (multiple paths)
const categoryNode = createSwitchNode({
  name: 'categorize',
  cases: [
    {
      condition: (input, ctx) => ctx.getNodeOutput('classify')?.category === 'tech',
      target: 'tech-handler',
    },
    {
      condition: (input, ctx) => ctx.getNodeOutput('classify')?.category === 'finance',
      target: 'finance-handler',
    },
  ],
  default: 'default-handler',
});
```

## Parallel Nodes

Execute multiple nodes concurrently:

```ts
import { createParallelNode } from '@seashorelab/workflow';

const parallelNode = createParallelNode({
  name: 'parallel-research',
  nodes: [
    createLLMNode({
      name: 'search-news',
      model,
      prompt: (input) => `Find news about: ${input.topic}`,
    }),
    createLLMNode({
      name: 'search-academic',
      model,
      prompt: (input) => `Find papers about: ${input.topic}`,
    }),
  ],
});

// Results are combined into an object
const research = result.getNodeOutput('parallel-research');
// research = { search-news: {...}, search-academic: {...} }
```

## Map-Reduce Nodes

Process arrays in parallel and combine results:

```ts
import { createMapReduceNode } from '@seashorelab/workflow';

const summarizeNode = createMapReduceNode({
  name: 'summarize-articles',
  // Map: process each item
  mapNode: createLLMNode({
    name: 'summarize-one',
    model,
    prompt: (item) => `Summarize: ${item}`,
  }),
  // Reduce: combine all results
  reduceNode: createLLMNode({
    name: 'combine-summaries',
    model,
    prompt: (summaries) => `Combine these summaries:\n${summaries.join('\n')}`,
  }),
  // Extract array from input
  getItems: (input) => (input as { articles: string[] }).articles,
});
```

## Custom Nodes

Create custom processing logic:

```ts
import { createNode, createTransformNode } from '@seashorelab/workflow';

// Generic custom node
const customNode = createNode({
  name: 'process-data',
  execute: async (input, ctx) => {
    // Custom processing logic
    return {
      processed: true,
      data: input,
      timestamp: new Date().toISOString(),
    };
  },
});

// Transform node (simple data transformation)
const transformNode = createTransformNode({
  name: 'extract-urls',
  transform: (input, ctx) => {
    const text = ctx.getNodeOutput('fetch')?.content;
    const urls = text.match(/https?:\/\/[^\s]+/g) || [];
    return { urls };
  },
});
```

## Loop Control

Iterate over data with loops:

```ts
import { createForEachNode, createLoopNode } from '@seashorelab/workflow';

// For-each loop
const forEachNode = createForEachNode({
  name: 'process-items',
  getItemNode: (item, index) => createLLMNode({
    name: `process-item-${index}`,
    model,
    prompt: () => `Process: ${item}`,
  }),
  getItems: (input) => (input as { items: string[] }).items,
});

// Conditional loop with break/continue
const loopNode = createLoopNode({
  name: 'retry-until-success',
  condition: (input, ctx, state) => {
    const result = ctx.getNodeOutput('attempt')?.success;
    return result !== true && state.iteration < 3;
  },
  maxIterations: 3,
  body: createLLMNode({
    name: 'attempt',
    model,
    prompt: (input) => `Try to complete: ${input.task}`,
  }),
});
```

## Streaming

Stream workflow execution events:

```ts
import { createWorkflowAgent } from '@seashorelab/agent';

const agent = createWorkflowAgent({
  name: 'my-agent',
  workflow,
});

for await (const event of agent.stream('AI')) {
  switch (event.type) {
    case 'thinking':
    case 'content':
      // Token-level streaming
      if (event.delta) {
        process.stdout.write(event.delta);
      }
      break;
    case 'tool-call-start':
      console.log(`Tool call: ${event.toolCall?.name}`);
      break;
    case 'tool-result':
      console.log(`Tool result:`, event.toolResult);
      break;
    case 'finish':
      console.log('Workflow complete', event.result);
      break;
    case 'error':
      console.error(`Error:`, event.error);
      break;
  }
}
```

## Error Handling

Handle errors at the workflow or node level:

```ts
import { withRetry, withFallback } from '@seashorelab/workflow';

// Add retry logic
const resilientNode = withRetry(createLLMNode({...}), {
  maxAttempts: 3,
  delay: 1000,
});

// Add fallback logic
const fallbackNode = withFallback(primaryNode, {
  fallback: createLLMNode({
    name: 'fallback',
    model: simplerModel,
    prompt: (input) => `Simpler version: ${input}`,
  }),
});

// Error boundary for sub-workflows
const safeNode = createNode({
  name: 'safe-operation',
  execute: async (input, ctx) => {
    try {
      return await riskyOperation(input);
    } catch (error) {
      // Return error value instead of throwing
      return { error: error.message, success: false };
    }
  },
});
```

## Context Management

Access and manipulate workflow context:

```ts
// Access previous node outputs
const prevOutput = ctx.getNodeOutput('previous-node');
const allOutputs = ctx.getAllOutputs();

// Set custom context values
ctx.set('customKey', { value: 123 });

// Get custom values
const customValue = ctx.get('customKey');

// Check if node executed
if (hasNodeExecuted(ctx, 'optional-node')) {
  // Node was executed
}
```
