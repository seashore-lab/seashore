# @seashore/deploy

Hono-based agent deployment for Cloudflare Workers and Node.js.

## Installation

```bash
pnpm add @seashore/deploy
```

Required peer dependencies:
```bash
pnpm add @seashore/agent @hono/[runtime]
```

For Node.js:
```bash
pnpm add @hono/node-server
```

## Overview

`@seashore/deploy` provides:

- Hono-based server creation
- Cloudflare Workers deployment
- Node.js deployment
- Streaming responses (SSE)
- Authentication and rate limiting
- Multi-agent routing

## Quick Start

### Creating a Server

```typescript
import { createServer } from '@seashore/deploy'
import { createAgent } from '@seashore/agent'
import { openaiText } from '@seashore/llm'

const agent = createAgent({
  name: 'chat-agent',
  adapter: openaiText('gpt-4o'),
  tools: [searchTool, calculatorTool],
})

const server = createServer({
  agents: {
    chat: agent,
  },
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
```

### Cloudflare Workers

```typescript
// src/index.ts
import { createServer, cloudflareAdapter } from '@seashore/deploy'

const server = createServer({
  agents: { chat: agent },
})

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return cloudflareAdapter(server, { env, ctx }).fetch(request)
  },
}

interface Env {
  OPENAI_API_KEY: string
}
```

### Node.js

```typescript
import { createServer, nodeAdapter } from '@seashore/deploy'
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

## API Reference

### createServer

Creates a server instance.

```typescript
function createServer(config: ServerConfig): Server
```

#### Configuration

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `agents` | `Record<string, Agent>` | Yes | Agent registry |
| `cors` | `object` | No | CORS configuration |
| `auth` | `object` | No | Authentication |
| `rateLimit` | `object` | No | Rate limiting |
| `streaming` | `object` | No | SSE configuration |
| `middleware` | `Middleware[]` | No | Custom middleware |
| `errorHandler` | `function` | No | Error handler |

### Server Methods

```typescript
interface Server {
  app: Hono // Access to underlying Hono app
  listen(port: number): void // Node.js only
}
```

## API Endpoints

The server automatically generates these endpoints:

### POST /api/chat

Standard chat endpoint.

```typescript
// Request
interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
  threadId?: string
  stream?: boolean
}

// Response (non-streaming)
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

Execute specific agent.

```typescript
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

Get thread history.

```typescript
interface ThreadResponse {
  id: string
  messages: Message[]
  createdAt: string
  updatedAt: string
}
```

## Streaming

### Server Configuration

```typescript
const server = createServer({
  agents: { chat: agent },
  streaming: {
    format: 'sse', // 'sse' | 'ndjson'
    cloudflare: {
      disableCompression: true, // Required for SSE on CF
    },
    headers: {
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  },
})
```

### Stream Events

```typescript
// Text chunk
{ type: 'text', content: 'Hello' }

// Tool call start
{ type: 'tool_call_start', id: 'call_xxx', name: 'search' }

// Tool call result
{ type: 'tool_call_end', id: 'call_xxx', result: { ... } }

// GenUI render
{ type: 'genui', toolName: 'show_stock', data: { ... } }

// Done
{ type: 'done', usage: { promptTokens: 100, completionTokens: 50 } }

// Error
{ type: 'error', message: 'Something went wrong' }
```

### Client Consumption

```typescript
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
      console.log('Event:', data)
    }
  }
}
```

## Cloudflare Workers

### wrangler.toml

```toml
name = "my-agent-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
OPENAI_API_KEY = ""

# Use secrets for sensitive data
# wrangler secret put OPENAI_API_KEY

# Optional D1 database
[[d1_databases]]
binding = "DB"
database_name = "agent-db"
database_id = "xxx"

# Optional KV storage
[[kv_namespaces]]
binding = "CACHE"
id = "xxx"
```

### SSE Streaming on CF

```typescript
import { createServer, cloudflareAdapter } from '@seashore/deploy'

const server = createServer({
  agents: { chat: agent },
  streaming: {
    headers: {
      'Content-Encoding': 'Identity',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  },
})

export default {
  async fetch(request, env, ctx) {
    return cloudflareAdapter(server, { env, ctx }).fetch(request)
  },
}
```

## Node.js Deployment

### Standalone Server

```typescript
import { createServer, nodeAdapter } from '@seashore/deploy'
import { serve } from '@hono/node-server'

const server = createServer({
  agents: { chat: agent },
})

serve({
  fetch: server.app.fetch,
  port: 3000,
})
```

### Express Integration

```typescript
import express from 'express'
import { createServer } from '@seashore/deploy'

const app = express()
const server = createServer({ agents: { chat: agent } })

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
  res.send(await response.text())
})

app.listen(3000)
```

## Middleware

### Authentication

```typescript
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

### Rate Limiting

```typescript
const server = createServer({
  agents: { chat: agent },
  middleware: [
    rateLimiter({
      windowMs: 60 * 1000,
      limit: 100,
      keyGenerator: (c) =>
        c.req.header('x-user-id') || c.req.header('cf-connecting-ip'),
    }),
  ],
})
```

### Logging

```typescript
import { logger } from 'hono/logger'

const server = createServer({
  agents: { chat: agent },
  middleware: [logger()],
})
```

## Error Handling

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

## Custom Routes

```typescript
const server = createServer({ agents: { chat: agent } })

// Add custom routes
server.app.get('/health', (c) => c.json({ status: 'ok' }))

server.app.post('/custom', (c) => {
  return c.json({ message: 'Custom endpoint' })
})
```

## Runtime Adapters

### cloudflareAdapter

```typescript
import { cloudflareAdapter } from '@seashore/deploy'

const adapter = cloudflareAdapter(server, {
  env, // Cloudflare env
  ctx, // ExecutionContext
})
```

### nodeAdapter

```typescript
import { nodeAdapter } from '@seashore/deploy'

const adapter = nodeAdapter(server)
```

## Type Definitions

### ServerConfig

```typescript
interface ServerConfig {
  agents: Record<string, Agent>
  middleware?: MiddlewareHandler[]
  cors?: {
    origin: string | string[]
    methods?: string[]
    headers?: string[]
    credentials?: boolean
  }
  auth?: {
    type: 'bearer' | 'api-key' | 'custom'
    validate: (credential: string) => Promise<boolean>
    header?: string
  }
  rateLimit?: {
    requests: number
    window: string
    keyGenerator?: (c: Context) => string
  }
  streaming?: {
    format: 'sse' | 'ndjson'
    headers?: Record<string, string>
  }
  errorHandler?: (error: Error, c: Context) => Response
}
```

### RuntimeAdapter

```typescript
type RuntimeAdapter = (
  server: Server,
  options?: Record<string, unknown>
) => {
  fetch: (request: Request) => Promise<Response>
}
```

## Best Practices

1. **Use environment variables** for API keys
2. **Enable CORS** carefully for production
3. **Set rate limits** to prevent abuse
4. **Log errors** for debugging
5. **Test streaming** with your client framework

## See Also

- [Agent Package](agent.md)
- [GenUI Package](genui.md)
- [Deployment Guide](../guides/deployment.md)
