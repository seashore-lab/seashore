# MCP 客户端

创建客户端以通过 stdio、SSE 或 WebSocket 与 MCP 服务器通信。

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
