# MCP Client

Create a client to talk to an MCP server over stdio, SSE, or WebSocket.

## Stdio

```ts
import { createMCPClient } from '@seashorelab/mcp'

const client = await createMCPClient({
  transport: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', './'],
})
```

## SSE / WebSocket

```ts
const sseClient = await createMCPClient({ transport: 'sse', url: 'http://localhost:3001/mcp' })
const wsClient = await createMCPClient({ transport: 'websocket', url: 'ws://localhost:3001/mcp' })
```
