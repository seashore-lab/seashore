# @seashore/mcp

Model Context Protocol (MCP) client for connecting to external MCP servers.

## Installation

```bash
pnpm add @seashore/mcp
```

## Overview

`@seashore/mcp` provides:

- MCP client for stdio, SSE, and WebSocket transports
- Tool bridging to Seashore ecosystem
- Resource access and monitoring
- Prompt templating
- Multi-server management

## Quick Start

### Connecting to an MCP Server

```typescript
import { createMCPClient } from '@seashore/mcp'

// Connect to stdio server
const client = await createMCPClient({
  transport: 'stdio',
  command: 'node',
  args: ['./mcp-server.js'],
})

// Connect to SSE server
const sseClient = await createMCPClient({
  transport: 'sse',
  url: 'http://localhost:3001/mcp',
  headers: {
    Authorization: 'Bearer xxx',
  },
})
```

### Using MCP Tools with Agents

```typescript
import { createMCPToolBridge, createAgent } from '@seashore/mcp'
import { openaiText } from '@seashore/llm'

// Bridge MCP tools to Seashore
const bridge = await createMCPToolBridge({
  client,
  filter: (tool) => tool.name.startsWith('safe_'),
  rename: (name) => `mcp_${name}`,
})

const agent = createAgent({
  name: 'mcp-enabled-agent',
  adapter: openaiText('gpt-4o'),
  tools: [...bridge.getTools()],
})
```

## API Reference

### createMCPClient

Creates an MCP client instance.

```typescript
function createMCPClient(config: MCPClientConfig): Promise<MCPClient>
```

#### Configuration

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `transport` | `'stdio' \| 'sse' \| 'websocket'` | Yes | Transport type |
| `command` | `string` | No* | Command for stdio |
| `args` | `string[]` | No* | Arguments for stdio |
| `cwd` | `string` | No | Working directory |
| `env` | `Record<string, string>` | No | Environment variables |
| `url` | `string` | No* | URL for SSE/WebSocket |
| `headers` | `Record<string, string>` | No | Request headers |
| `timeout` | `number` | No | Request timeout (ms) |
| `reconnect` | `boolean` | No | Auto-reconnect (default: true) |

*Required depending on transport type

### MCP Client Methods

#### Tools

```typescript
// List available tools
const tools = await client.listTools()

// Call a tool
const result = await client.callTool('search', {
  query: 'TypeScript best practices',
  limit: 10,
})
```

#### Resources

```typescript
// List resources
const resources = await client.listResources()

// Read a resource
const content = await client.readResource('file:///path/to/document.md')

// Subscribe to changes
await client.subscribeResource('file:///path/to/config.json', (event) => {
  console.log('Changed:', event.uri)
})

// Unsubscribe
await client.unsubscribeResource('file:///path/to/config.json')
```

#### Prompts

```typescript
// List prompts
const prompts = await client.listPrompts()

// Get a prompt
const result = await client.getPrompt('summarize', {
  content: 'Text to summarize...',
  style: 'concise',
})
```

#### Lifecycle

```typescript
// Check connection
console.log('Connected:', client.isConnected())

// Disconnect
await client.disconnect()

// Reconnect
await client.reconnect()

// Close (terminate process)
await client.close()
```

## Tool Bridging

### createMCPToolBridge

Bridges MCP tools to Seashore format.

```typescript
import { createMCPToolBridge } from '@seashore/mcp'

const bridge = await createMCPToolBridge({
  client,

  // Optional: Filter tools
  filter: (tool) => tool.name.startsWith('safe_'),

  // Optional: Rename tools
  rename: (name) => `mcp_${name}`,

  // Optional: Add prefix to description
  descriptionPrefix: '[External] ',
})

// Get all tools
const tools = bridge.getTools()

// Get specific tool
const searchTool = bridge.getTool('search')
```

### Using with Agents

```typescript
import { createAgent } from '@seashore/agent'

const agent = createAgent({
  name: 'mcp-agent',
  adapter: openaiText('gpt-4o'),
  tools: [...localTools, ...bridge.getTools()],
})
```

## Multi-Server Management

### Connecting Multiple Servers

```typescript
import { createMCPClient, createMCPToolBridge } from '@seashore/mcp'

// Filesystem server
const fsClient = await createMCPClient({
  transport: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '/allowed/path'],
})

// Browser server
const browserClient = await createMCPClient({
  transport: 'stdio',
  command: 'npx',
  args: ['-y', '@anthropic-ai/mcp-server-puppeteer'],
})

// Bridge tools
const fsBridge = await createMCPToolBridge({
  client: fsClient,
  rename: (n) => `fs_${n}`,
})

const browserBridge = await createMCPToolBridge({
  client: browserClient,
  rename: (n) => `browser_${n}`,
})

// Use all tools
const agent = createAgent({
  name: 'multi-mcp-agent',
  adapter: openaiText('gpt-4o'),
  tools: [...fsBridge.getTools(), ...browserBridge.getTools()],
})
```

## Server Discovery

### discoverMCPServers

Load server configs from file.

```typescript
import { discoverMCPServers } from '@seashore/mcp'

const servers = await discoverMCPServers('./mcp.json')
```

### mcp.json Format

```json
{
  "servers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/allowed/path"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "remote-api": {
      "transport": "sse",
      "url": "https://api.example.com/mcp"
    }
  }
}
```

### Batch Connection

```typescript
import { discoverMCPServers, createMCPClient, createMCPToolBridge } from '@seashore/mcp'

const configs = await discoverMCPServers('./mcp.json')

const bridges = await Promise.all(
  configs.map(async (config) => {
    const client = await createMCPClient(config)
    return createMCPToolBridge({
      client,
      rename: (n) => `${config.name}_${n}`,
    })
  })
)

const allTools = bridges.flatMap((bridge) => bridge.getTools())
```

## Error Handling

```typescript
import {
  MCPError,
  MCPConnectionError,
  MCPTimeoutError,
} from '@seashore/mcp'

try {
  const result = await client.callTool('risky_operation', { param: 'value' })
} catch (error) {
  if (error instanceof MCPConnectionError) {
    console.error('Connection lost, reconnecting...')
    await client.reconnect()
  } else if (error instanceof MCPTimeoutError) {
    console.error('Operation timed out')
  } else if (error instanceof MCPError) {
    console.error('MCP error:', error.code, error.message)
  }
}
```

## Type Definitions

### MCPTool

```typescript
interface MCPTool {
  name: string
  description: string
  inputSchema: JSONSchema
}
```

### MCPResource

```typescript
interface MCPResource {
  uri: string
  name: string
  description?: string
  mimeType?: string
}
```

### MCPPrompt

```typescript
interface MCPPrompt {
  name: string
  description?: string
  arguments?: Array<{
    name: string
    description?: string
    required?: boolean
  }>
}
```

### ToolCallResult

```typescript
interface ToolCallResult {
  content: unknown
  isError?: boolean
}
```

### ResourceContent

```typescript
interface ResourceContent {
  contents: unknown[]
  mimeType?: string
}
```

## Best Practices

1. **Use tool filtering** to only expose safe tools
2. **Rename tools** with prefixes to avoid naming conflicts
3. **Handle disconnections** with auto-reconnect
4. **Use resource subscriptions** for real-time updates
5. **Monitor server health** with connection checks

## See Also

- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [Tool Package](tool.md)
- [Agent Package](agent.md)
