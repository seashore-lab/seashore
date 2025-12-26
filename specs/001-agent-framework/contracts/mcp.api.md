# API Contract: @seashore/mcp

**Package**: `@seashore/mcp`  
**Version**: 0.1.0

## 概述

MCP (Model Context Protocol) 模块提供 MCP 客户端能力，用于连接和调用外部 MCP 服务器，并将其工具桥接到 Agent 生态系统。

---

## 导出

```typescript
// MCP 客户端
export { createMCPClient, type MCPClient, type MCPClientConfig } from './client'

// 工具桥接
export { createMCPToolBridge, type ToolBridge } from './bridge'

// 服务发现
export { discoverMCPServers, type ServerInfo } from './discovery'

// 类型
export type { MCPTool, MCPResource, MCPPrompt, MCPServerConfig } from './types'
```

---

## MCP 客户端

### createMCPClient

```typescript
import { createMCPClient } from '@seashore/mcp'

// 连接到 stdio 服务器
const client = await createMCPClient({
  transport: 'stdio',
  command: 'node',
  args: ['./mcp-server.js'],
})

// 连接到 SSE 服务器
const sseClient = await createMCPClient({
  transport: 'sse',
  url: 'http://localhost:3001/mcp',
  headers: {
    Authorization: 'Bearer xxx',
  },
})

// 连接到 WebSocket 服务器
const wsClient = await createMCPClient({
  transport: 'websocket',
  url: 'ws://localhost:3001/mcp',
})
```

### 配置选项

```typescript
interface MCPClientConfig {
  // 传输方式
  transport: 'stdio' | 'sse' | 'websocket'

  // stdio 配置
  command?: string
  args?: string[]
  cwd?: string
  env?: Record<string, string>

  // 网络配置
  url?: string
  headers?: Record<string, string>

  // 通用配置
  timeout?: number
  reconnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
}
```

---

## 工具操作

### 列出工具

```typescript
const tools = await client.listTools()

for (const tool of tools) {
  console.log(`Tool: ${tool.name}`)
  console.log(`Description: ${tool.description}`)
  console.log(`Input Schema: ${JSON.stringify(tool.inputSchema)}`)
}
```

### 调用工具

```typescript
const result = await client.callTool('search', {
  query: 'TypeScript best practices',
  limit: 10,
})

console.log('Result:', result.content)
```

---

## 资源操作

### 列出资源

```typescript
const resources = await client.listResources()

for (const resource of resources) {
  console.log(`URI: ${resource.uri}`)
  console.log(`Name: ${resource.name}`)
  console.log(`MIME Type: ${resource.mimeType}`)
}
```

### 读取资源

```typescript
const content = await client.readResource('file:///path/to/document.md')

console.log('Content:', content.contents)
console.log('MIME Type:', content.mimeType)
```

### 订阅资源变更

```typescript
// 订阅资源变更
await client.subscribeResource('file:///path/to/config.json', (event) => {
  console.log('Resource changed:', event.uri)
  console.log('New content:', event.contents)
})

// 取消订阅
await client.unsubscribeResource('file:///path/to/config.json')
```

---

## Prompt 操作

### 列出 Prompts

```typescript
const prompts = await client.listPrompts()

for (const prompt of prompts) {
  console.log(`Name: ${prompt.name}`)
  console.log(`Description: ${prompt.description}`)
  console.log(`Arguments: ${JSON.stringify(prompt.arguments)}`)
}
```

### 获取 Prompt

```typescript
const result = await client.getPrompt('summarize', {
  content: '要总结的文本内容...',
  style: 'concise',
})

console.log('Messages:', result.messages)
```

---

## 工具桥接

### createMCPToolBridge

将 MCP 工具转换为 Seashore 工具格式：

```typescript
import { createMCPToolBridge } from '@seashore/mcp'
import { createAgent } from '@seashore/agent'

// 创建桥接器
const bridge = await createMCPToolBridge({
  client,

  // 可选：工具过滤
  filter: (tool) => tool.name.startsWith('safe_'),

  // 可选：工具重命名
  rename: (name) => `mcp_${name}`,

  // 可选：添加前缀描述
  descriptionPrefix: '[External] ',
})

// 获取所有桥接工具
const tools = bridge.getTools()

// 在 Agent 中使用
const agent = createAgent({
  name: 'mcp-enabled-agent',
  adapter: openaiText('gpt-4o'),
  tools: [...localTools, ...tools],
})
```

### 按需桥接

```typescript
// 只桥接特定工具
const searchTool = bridge.getTool('search')
const writeTool = bridge.getTool('write_file')

// 使用单个工具
const result = await searchTool.execute({ query: 'test' })
```

---

## 多服务器管理

### 连接多个 MCP 服务器

```typescript
import { createMCPClient, createMCPToolBridge } from '@seashore/mcp'

// 连接多个服务器
const filesystemClient = await createMCPClient({
  transport: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/allowed'],
})

const browserClient = await createMCPClient({
  transport: 'stdio',
  command: 'npx',
  args: ['-y', '@anthropic-ai/mcp-server-puppeteer'],
})

// 桥接所有工具
const fsBridge = await createMCPToolBridge({
  client: filesystemClient,
  rename: (n) => `fs_${n}`,
})
const browserBridge = await createMCPToolBridge({
  client: browserClient,
  rename: (n) => `browser_${n}`,
})

// 合并工具
const allTools = [...fsBridge.getTools(), ...browserBridge.getTools()]

const agent = createAgent({
  name: 'multi-mcp-agent',
  adapter: openaiText('gpt-4o'),
  tools: allTools,
})
```

---

## 服务发现

### discoverMCPServers

从配置文件发现 MCP 服务器：

```typescript
import { discoverMCPServers } from '@seashore/mcp'

// 从 mcp.json 发现服务器
const servers = await discoverMCPServers('./mcp.json')

for (const server of servers) {
  console.log(`Name: ${server.name}`)
  console.log(`Command: ${server.command}`)
  console.log(`Args: ${server.args}`)
}
```

### mcp.json 格式

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

### 批量连接

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

---

## 错误处理

```typescript
import { MCPError, MCPConnectionError, MCPTimeoutError } from '@seashore/mcp'

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

---

## 生命周期管理

```typescript
const client = await createMCPClient({ ... })

// 检查连接状态
console.log('Connected:', client.isConnected())

// 断开连接
await client.disconnect()

// 重新连接
await client.reconnect()

// 完全关闭（终止子进程）
await client.close()
```

---

## 类型定义

```typescript
export interface MCPTool {
  name: string
  description: string
  inputSchema: JSONSchema
}

export interface MCPResource {
  uri: string
  name: string
  description?: string
  mimeType?: string
}

export interface MCPPrompt {
  name: string
  description?: string
  arguments?: Array<{
    name: string
    description?: string
    required?: boolean
  }>
}

export interface MCPClient {
  // 工具
  listTools(): Promise<MCPTool[]>
  callTool(name: string, args: unknown): Promise<ToolResult>

  // 资源
  listResources(): Promise<MCPResource[]>
  readResource(uri: string): Promise<ResourceContent>
  subscribeResource(uri: string, callback: ResourceCallback): Promise<void>
  unsubscribeResource(uri: string): Promise<void>

  // Prompts
  listPrompts(): Promise<MCPPrompt[]>
  getPrompt(name: string, args: Record<string, string>): Promise<PromptResult>

  // 生命周期
  isConnected(): boolean
  disconnect(): Promise<void>
  reconnect(): Promise<void>
  close(): Promise<void>
}

export interface ToolBridge {
  getTools(): SeashoreTool[]
  getTool(name: string): SeashoreTool | undefined
}

export interface ServerInfo {
  name: string
  transport: 'stdio' | 'sse' | 'websocket'
  command?: string
  args?: string[]
  env?: Record<string, string>
  url?: string
}
```
