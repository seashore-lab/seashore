# 工具集成

MCP 桥接将 MCP 工具转换为 Seashore 工具，以便智能体可以调用它们。

```ts
import { createMCPToolBridge } from '@seashorelab/mcp'

const bridge = await createMCPToolBridge({
  client,
  rename: (name) => `mcp_${name}`,
  descriptionPrefix: '[External] ',
})

const tools = bridge.getTools()
```

您可以桥接所有工具或按名称选择一个工具。
