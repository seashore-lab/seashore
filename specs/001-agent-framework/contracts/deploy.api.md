# API Contract: @seashorelab/deploy

**Package**: `@seashorelab/deploy`  
**Version**: 0.1.0

## 概述

Deploy 模块提供基于 Hono 的 Agent 部署能力，支持 Cloudflare Workers（主要）和 Node.js（兼容）两种运行时。

---

## 导出

```typescript
// 服务器创建
export { createServer, type ServerConfig } from './server'

// 路由处理器
export {
  createChatHandler,
  createAgentHandler,
  createStreamHandler,
  type HandlerConfig,
} from './handlers'

// 运行时适配
export { cloudflareAdapter, nodeAdapter, type RuntimeAdapter } from './adapters'

// SSE 流
export { createSSEStream, type SSEStreamConfig } from './sse'

// 类型
export type { ChatRequest, ChatResponse, AgentRequest } from './types'
```

---

## 服务器创建

### createServer

```typescript
import { createServer } from '@seashorelab/deploy'
import { createAgent } from '@seashorelab/agent'
import { openaiText } from '@seashorelab/llm'

const agent = createAgent({
  name: 'chat-agent',
  adapter: openaiText('gpt-4o'),
  tools: [searchTool, calculatorTool],
})

const server = createServer({
  agents: {
    chat: agent,
    // 可以注册多个 agent
    support: supportAgent,
  },

  // 可选配置
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },

  // 认证
  auth: {
    type: 'bearer',
    validate: async (token) => {
      return await validateToken(token)
    },
  },

  // 限流
  rateLimit: {
    requests: 100,
    window: '1m',
  },
})
```

### Hono 应用

Server 返回标准 Hono 应用：

```typescript
import { createServer } from '@seashorelab/deploy'

const server = createServer({ agents: { chat: agent } })

// 访问底层 Hono 应用
const app = server.app

// 添加自定义路由
app.get('/health', (c) => c.json({ status: 'ok' }))

// 添加自定义中间件
app.use('*', async (c, next) => {
  console.log('Request:', c.req.url)
  await next()
})
```

---

## API 端点

Server 自动生成以下端点：

### POST /api/chat

标准聊天端点：

```typescript
// 请求
interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
  threadId?: string // 可选：关联的会话 ID
  stream?: boolean // 是否流式响应
}

// 响应 (非流式)
interface ChatResponse {
  content: string
  threadId: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}
```

### POST /api/agents/:agentName/run

指定 Agent 运行：

```typescript
// 请求
interface AgentRequest {
  input: string | { messages: Message[] }
  threadId?: string
  stream?: boolean
  config?: {
    maxSteps?: number
    timeout?: number
  }
}
```

### GET /api/threads/:threadId

获取会话历史：

```typescript
// 响应
interface ThreadResponse {
  id: string
  messages: Message[]
  createdAt: string
  updatedAt: string
}
```

---

## 流式响应

### SSE 流

```typescript
import { createServer } from '@seashorelab/deploy'

const server = createServer({
  agents: { chat: agent },

  streaming: {
    // SSE 配置
    format: 'sse',

    // Cloudflare Workers 兼容
    cloudflare: {
      // 禁用压缩以支持 SSE
      disableCompression: true,
    },
  },
})
```

### 客户端消费

```typescript
// 使用 fetch
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Hello' }],
    stream: true,
  }),
})

const reader = response.body.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  const text = decoder.decode(value)
  const lines = text.split('\n')

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6))
      console.log('Chunk:', data)
    }
  }
}
```

### 流事件格式

```typescript
// 文本块
{ type: 'text', content: 'Hello' }

// 工具调用开始
{ type: 'tool_call_start', id: 'call_xxx', name: 'search' }

// 工具调用结果
{ type: 'tool_call_end', id: 'call_xxx', result: { ... } }

// GenUI 渲染
{ type: 'genui', toolName: 'show_stock', data: { ... } }

// 完成
{ type: 'done', usage: { promptTokens: 100, completionTokens: 50 } }

// 错误
{ type: 'error', message: 'Something went wrong' }
```

---

## Cloudflare Workers 部署

### wrangler.toml

```toml
name = "my-agent-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
OPENAI_API_KEY = ""

# 使用 secrets 存储敏感信息
# wrangler secret put OPENAI_API_KEY

# D1 数据库（可选）
[[d1_databases]]
binding = "DB"
database_name = "agent-db"
database_id = "xxx"

# KV 存储（可选）
[[kv_namespaces]]
binding = "CACHE"
id = "xxx"
```

### 入口文件

```typescript
// src/index.ts
import { createServer, cloudflareAdapter } from '@seashorelab/deploy'
import { createAgent } from '@seashorelab/agent'
import { openaiText } from '@seashorelab/llm'

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const agent = createAgent({
      name: 'chat',
      adapter: openaiText('gpt-4o', { apiKey: env.OPENAI_API_KEY }),
    })

    const server = createServer({
      agents: { chat: agent },
    })

    return cloudflareAdapter(server, { env, ctx }).fetch(request)
  },
}

interface Env {
  OPENAI_API_KEY: string
  DB: D1Database
  CACHE: KVNamespace
}
```

### SSE Streaming 注意事项

```typescript
import { createServer, cloudflareAdapter } from '@seashorelab/deploy'

const server = createServer({
  agents: { chat: agent },

  streaming: {
    // 对于 Cloudflare Workers，需要设置正确的 headers
    headers: {
      'Content-Encoding': 'Identity',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  },
})
```

---

## Node.js 部署

### 独立服务器

```typescript
import { createServer, nodeAdapter } from '@seashorelab/deploy'
import { serve } from '@hono/node-server'

const server = createServer({
  agents: { chat: agent },
})

serve({
  fetch: server.app.fetch,
  port: 3000,
})

console.log('Server running on http://localhost:3000')
```

### 与 Express 集成

```typescript
import express from 'express'
import { createServer } from '@seashorelab/deploy'

const app = express()
const server = createServer({ agents: { chat: agent } })

// 将 Hono 应用挂载到 Express
app.use('/api', async (req, res) => {
  const response = await server.app.fetch(
    new Request(`http://localhost${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    })
  )

  res.status(response.status)
  response.headers.forEach((value, key) => res.setHeader(key, value))

  const body = await response.text()
  res.send(body)
})

app.listen(3000)
```

---

## 中间件

### 认证

```typescript
import { createServer } from '@seashorelab/deploy'
import { bearerAuth } from 'hono/bearer-auth'

const server = createServer({
  agents: { chat: agent },

  middleware: [
    bearerAuth({
      verifyToken: async (token, c) => {
        return await validateJWT(token)
      },
    }),
  ],
})
```

### 限流

```typescript
import { rateLimiter } from 'hono-rate-limiter'

const server = createServer({
  agents: { chat: agent },

  middleware: [
    rateLimiter({
      windowMs: 60 * 1000, // 1 分钟
      limit: 100, // 100 请求
      keyGenerator: (c) =>
        c.req.header('x-user-id') || c.req.header('cf-connecting-ip'),
    }),
  ],
})
```

### 日志

```typescript
import { logger } from 'hono/logger'

const server = createServer({
  agents: { chat: agent },

  middleware: [logger()],
})
```

---

## 错误处理

```typescript
const server = createServer({
  agents: { chat: agent },

  errorHandler: (error, c) => {
    console.error('Error:', error)

    if (error.name === 'AuthenticationError') {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    if (error.name === 'RateLimitError') {
      return c.json({ error: 'Too many requests' }, 429)
    }

    return c.json({ error: 'Internal server error' }, 500)
  },
})
```

---

## 类型定义

```typescript
export interface ServerConfig {
  agents: Record<string, Agent>

  // 中间件
  middleware?: MiddlewareHandler[]

  // CORS
  cors?: {
    origin: string | string[]
    methods?: string[]
    headers?: string[]
    credentials?: boolean
  }

  // 认证
  auth?: {
    type: 'bearer' | 'api-key' | 'custom'
    validate: (credential: string) => Promise<boolean>
    header?: string
  }

  // 限流
  rateLimit?: {
    requests: number
    window: string
    keyGenerator?: (c: Context) => string
  }

  // 流式配置
  streaming?: {
    format: 'sse' | 'ndjson'
    headers?: Record<string, string>
  }

  // 错误处理
  errorHandler?: (error: Error, c: Context) => Response
}

export interface Server {
  app: Hono
  listen(port: number): void
}

export interface ChatRequest {
  messages: Message[]
  threadId?: string
  stream?: boolean
  agentConfig?: {
    maxSteps?: number
    timeout?: number
  }
}

export interface ChatResponse {
  content: string
  threadId: string
  toolCalls?: ToolCall[]
  usage?: TokenUsage
}

export type RuntimeAdapter = (
  server: Server,
  options?: Record<string, unknown>
) => {
  fetch: (request: Request) => Promise<Response>
}
```
