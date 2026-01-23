# @seashorelab/deploy

This package provides deployment utilities for Seashore agents. It includes a Hono-based API server with built-in support for streaming, CORS, rate limiting, and authentication.

## Creating a Server

Set up an API server for agents:

```ts
import { createServer } from '@seashorelab/deploy';
import { serve } from '@hono/node-server';

const agent = myAgent; // Your Seashore agent

const server = createServer({
  agents: { assistant: agent },
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
  },
  rateLimit: {
    window: '1m',
    requests: 10,
  },
});

serve({
  fetch: server.app.fetch,
  port: 3000,
});

console.log('Server running on http://localhost:3000');
```

## Endpoints

The server provides the following endpoints:

- `GET /health` - Health check
- `POST /api/chat` - Chat API (OpenAI-compatible)
- `POST /api/agents/:name/run` - Run agent (non-streaming)
- `POST /api/agents/:name/stream` - Run agent (streaming)

### Health Check

```bash
curl http://localhost:3000/health
# Returns: { status: 'ok', timestamp: '...' }
```

### Chat API

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "assistant",
    "messages": [
      { "role": "user", "content": "Hello!" }
    ]
  }'
```

### Run Agent

```bash
curl -X POST http://localhost:3000/api/agents/assistant/run \
  -H "Content-Type: application/json" \
  -d '{
    "input": "What is the weather?"
  }'
```

### Stream Agent

```bash
curl -X POST http://localhost:3000/api/agents/assistant/stream \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Tell me a story"
  }'
```

## CORS Configuration

Configure CORS for your frontend:

```ts
const server = createServer({
  agents: { assistant: agent },
  cors: {
    origin: ['https://myapp.com', 'https://app.myapp.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    maxAge: 86400,
  },
});
```

## Rate Limiting

Protect your API with rate limits:

```ts
const server = createServer({
  agents: { assistant: agent },
  rateLimit: {
    window: '1m', // Time window
    requests: 10, // Max requests per window
    // Or use key-based rate limiting
    keyGenerator: (c) => {
      return c.req.header('x-api-key') || c.req.header('x-forwarded-for');
    },
  },
});
```

## Authentication

Add authentication to your endpoints:

```ts
import { createServer, createAuthMiddleware } from '@seashorelab/deploy';

// Bearer token authentication
const authMiddleware = createAuthMiddleware({
  type: 'bearer',
  validate: async (token) => {
    // Validate token against database or API
    const user = await validateToken(token);
    return user !== null;
  },
});

// API key authentication
const apiKeyMiddleware = createAuthMiddleware({
  type: 'api-key',
  header: 'x-api-key',
  validate: async (apiKey) => {
    const user = await findUserByApiKey(apiKey);
    return user !== null;
  },
});

const server = createServer({
  agents: { assistant: agent },
  auth: authMiddleware,
});
```

## Streaming

Enable streaming responses:

```ts
const server = createServer({
  agents: { assistant: agent },
  streaming: {
    enabled: true,
    // Configure streaming behavior
    onChunk: (chunk, context) => {
      console.log('Chunk:', chunk);
    },
  },
});
```

## Middleware

Add custom middleware:

```ts
import { createServer } from '@seashorelab/deploy';

const server = createServer({
  agents: { assistant: agent },
  middleware: [
    async (c, next) => {
      // Log requests
      console.log(`${c.req.method} ${c.req.url}`);
      await next();
    },
    async (c, next) => {
      // Add custom headers
      c.header('X-Custom-Header', 'value');
      await next();
    },
  ],
});
```

## Runtime Adapters

Deploy to different runtimes:

### Node.js

```ts
import { createServer } from '@seashorelab/deploy';
import { serve } from '@hono/node-server';

const server = createServer({ agents: { assistant: agent } });

serve({
  fetch: server.app.fetch,
  port: 3000,
});
```

### Cloudflare Workers

```ts
import { createServer } from '@seashorelab/deploy';

export default {
  async fetch(request, env, ctx) {
    const server = createServer({
      agents: { assistant: agent },
      runtime: 'cloudflare',
    });
    return server.app.fetch(request, env, ctx);
  },
};
```

### Vercel/Edge Functions

```ts
import { createServer } from '@seashorelab/deploy';
import { nodeAdapter } from '@seashorelab/deploy';

const server = createServer({ agents: { assistant: agent } });

export default nodeAdapter(server.app);
```

## Session Management

Track conversation sessions:

```ts
const server = createServer({
  agents: { assistant: agent },
  sessions: {
    enabled: true,
    store: 'memory', // or 'redis'
    redis: {
      host: 'localhost',
      port: 6379,
    },
  },
});

// Sessions are automatically created and maintained
// Thread ID is returned in responses
```

## Error Handling

Customize error responses:

```ts
const server = createServer({
  agents: { assistant: agent },
  errorHandler: async (error, c) => {
    console.error('Server error:', error);

    return c.json({
      error: {
        message: error.message,
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      },
    }, 500);
  },
});
```

## Webhook Support

Send webhooks on agent events:

```ts
const server = createServer({
  agents: { assistant: agent },
  webhooks: {
    onAgentStart: async (event) => {
      await fetch('https://webhook.site/agent-start', {
        method: 'POST',
        body: JSON.stringify(event),
      });
    },
    onAgentComplete: async (event) => {
      await fetch('https://webhook.site/agent-complete', {
        method: 'POST',
        body: JSON.stringify(event),
      });
    },
  },
});
```

## Configuration

Environment-based configuration:

```ts
const isProduction = process.env.NODE_ENV === 'production';

const server = createServer({
  agents: { assistant: agent },
  cors: isProduction ? {
    origin: process.env.ALLOWED_ORIGINS?.split(','),
  } : { origin: '*' },
  rateLimit: isProduction ? {
    window: '1m',
    requests: 100,
  } : undefined,
  auth: isProduction ? authMiddleware : undefined,
});
```

## Deployment Example

Complete deployment example:

```ts
import { createServer } from '@seashorelab/deploy';
import { serve } from '@hono/node-server';
import { createAgent } from '@seashorelab/agent';
import { openaiText } from '@seashorelab/llm';

// Create agent
const agent = createAgent({
  name: 'assistant',
  model: openaiText('gpt-4o', {
    apiKey: process.env.OPENAI_API_KEY,
  }),
  systemPrompt: 'You are a helpful assistant.',
});

// Create server
const server = createServer({
  agents: { assistant: agent },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  rateLimit: {
    window: '1m',
    requests: Number(process.env.RATE_LIMIT) || 10,
  },
});

// Start server
const port = Number(process.env.PORT) || 3000;

serve({
  fetch: server.app.fetch,
  port,
});

console.log(`🚀 Server running on http://localhost:${port}`);
console.log(`📋 Health check: http://localhost:${port}/health`);
console.log(`💬 Chat API: http://localhost:${port}/api/chat`);
```
