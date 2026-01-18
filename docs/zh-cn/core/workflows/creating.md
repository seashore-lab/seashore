# 创建工作流

在高层面上，工作流是：

- 一组**节点**
- 一组连接节点的**边**
- 一个**起始节点**

示例：

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

完整的可运行版本请参阅[示例 03](../../examples/03-basic-workflow.md)。
