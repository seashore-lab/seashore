# Tool Integration

The MCP bridge turns MCP tools into Seashore tools so the agent can call them.

```ts
import { createMCPToolBridge } from '@seashore/mcp'

const bridge = await createMCPToolBridge({
  client,
  rename: (name) => `mcp_${name}`,
  descriptionPrefix: '[External] ',
})

const tools = bridge.getTools()
```

You can bridge all tools or select one by name.
