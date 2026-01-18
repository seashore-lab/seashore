# Creating Workflows

At the high level, a workflow is:

- a set of **nodes**
- a set of **edges** connecting nodes
- a **start node**

Example:

```ts
import { createWorkflow, createLLMNode } from '@seashore/workflow'

const outline = createLLMNode({
  name: 'outline',
  model,
  prompt: (input) => `Outline: ${(input as { topic: string }).topic}`,
})

const write = createLLMNode({
  name: 'write',
  model,
  messages: (input, ctx) => {
    const o = ctx.getNodeOutput('outline')
    return [{ role: 'user', content: `Topic: ${(input as any).topic}\nOutline: ${o?.content}` }]
  },
})

const wf = createWorkflow({
  name: 'article',
  nodes: [outline, write],
  edges: [{ from: 'outline', to: 'write' }],
  startNode: 'outline',
})
```

For a full runnable version, see [Example 03](../../examples/03-basic-workflow.md).
