# Deployment Tutorial

This tutorial shows you how to deploy your AI agents as production-ready API servers using Seashore's deployment module. You'll learn how to create HTTP endpoints, handle streaming responses, and implement production features like CORS and rate limiting.

## What You'll Learn

- How to create a deployable API server
- Converting agents to deployment format
- Configuring CORS and rate limiting
- Running the server with Hono
- Testing API endpoints

## Prerequisites

Before starting this tutorial, make sure you have:

- Node.js 18+ installed
- pnpm installed
- An OpenAI API key:
  ```bash
  export OPENAI_API_KEY=your_api_key_here
  ```

## Step 1: Import Required Packages

```typescript
import 'dotenv/config';
import { createServer, type Agent as DeployAgent, type Message } from '@seashore/deploy';
import { createAgent } from '@seashore/agent';
import { openaiText } from '@seashore/llm';
import { serve } from '@hono/node-server';
```

## Step 2: Create Your Agent

Create a standard Seashore agent:

```typescript
const agent = createAgent({
  name: 'api-assistant',
  model: openaiText('gpt-5.1', {
    baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY,
  }),
  systemPrompt: 'You are a helpful assistant named Xiaoming.',
});
```

## Step 3: Create a Deployable Agent Wrapper

Convert your agent to the deployment format:

```typescript
const deployAgent: DeployAgent = {
  name: agent.name,
  async run(input: { messages: Message[] }) {
    // Extract the last user message
    const lastUserMessage = input.messages.filter((m: Message) => m.role === 'user').at(-1);
    const userInput = lastUserMessage?.content ?? '';

    // Run the agent
    const result = await agent.run(userInput);

    return {
      content: result.content,
    };
  },
};
```

**DeployAgent Interface:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Agent identifier |
| `run` | function | Async function that processes input and returns output |

## Step 4: Create the API Server

Initialize the server with configuration:

```typescript
const server = createServer({
  agents: { assistant: deployAgent },

  // Enable CORS for testing
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
  },

  // Rate limiting configuration
  rateLimit: {
    window: '1m',     // Time window
    requests: 10,     // Max requests per window
  },
});
```

**Server Configuration Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `agents` | Map of agent name to DeployAgent | Required |
| `cors` | CORS configuration | Disabled |
| `rateLimit` | Rate limiting config | Disabled |
| `basePath` | Base path for all routes | `/api` |

## Step 5: Start the Server

Launch the Hono server:

```typescript
const port = 3000;

console.log('Endpoints:');
console.log(`   GET  http://localhost:${port}/health`);
console.log(`   POST http://localhost:${port}/api/chat`);
console.log(`   POST http://localhost:${port}/api/agents/assistant/run`);
console.log(`   POST http://localhost:${port}/api/agents/assistant/stream\n`);

serve({
  fetch: server.app.fetch,
  port,
});
console.log(`Server running at http://localhost:${port}!\n`);
```

## Step 6: Test the API

Make a test request to your server:

```typescript
const response = await fetch(
  new Request(`http://localhost:${port}/api/agents/assistant/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: 'How is the weather in New York today?' }),
  })
);
const result = await response.json();

console.log('Request: How is the weather in New York today?');
console.log(`Response: ${JSON.stringify(result, null, 2)}`);
```

## API Endpoints

### Health Check

Check if the server is running:

```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-11T12:00:00Z"
}
```

### Run Agent (Non-Streaming)

Execute an agent without streaming:

```bash
curl -X POST http://localhost:3000/api/agents/assistant/run \
  -H "Content-Type: application/json" \
  -d '{"input": "Hello!"}'
```

**Response:**
```json
{
  "content": "Hello! How can I help you today?",
  "threadId": "thread_1234567890_abc123"
}
```

### Run Agent (Streaming)

Execute an agent with streaming:

```bash
curl -X POST http://localhost:3000/api/agents/assistant/stream \
  -H "Content-Type: application/json" \
  -d '{"input": "Tell me a joke"}'
```

**Response:** Server-Sent Events (SSE) stream

### Chat API

OpenAI-compatible chat endpoint:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "assistant",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## Running the Example

```bash
cd D:\Projects\seashore\examples
pnpm run 10-deploy-api-server
```

**Expected Output:**

```
Example 10: Deploy API Server

Endpoints:
   GET  http://localhost:3000/health
   POST http://localhost:3000/api/chat
   POST http://localhost:3000/api/agents/assistant/run
   POST http://localhost:3000/api/agents/assistant/stream

Server running at http://localhost:3000!

--- Local Call Test ---

Request: How is the weather in New York today?
Response: {
  "content": "I don't have live access to current weather data...",
  "threadId": "thread_1768065367122_m6jv77mdz"
}
```

## Source Code

The complete source code for this example is available at:
[`examples/src/10-deploy-api-server.ts`](https://github.com/seahorse/seashore/blob/main/examples/src/10-deploy-api-server.ts)

## Key Concepts

### Deployment Architecture

```
Client → HTTP Server → DeployAgent Wrapper → Seashore Agent → LLM
```

### Server Features

| Feature | Description | Configuration |
|---------|-------------|---------------|
| **CORS** | Cross-origin resource sharing | `cors.origin`, `cors.methods` |
| **Rate Limiting** | Request throttling | `rateLimit.window`, `rateLimit.requests` |
| **Streaming** | SSE-based response streaming | Built-in |
| **Thread Management** | Conversation tracking | Automatic |

### Thread IDs

Each request gets a unique thread ID for conversation tracking:

```json
{
  "content": "Response text",
  "threadId": "thread_1234567890_abc123"
}
```

Use this ID to maintain conversation context across requests.

## Extensions

### Multi-Agent Deployment

Deploy multiple agents:

```typescript
const agents = {
  assistant: createDeployAgent(agent1),
  coder: createDeployAgent(agent2),
  translator: createDeployAgent(agent3),
};

const server = createServer({
  agents,
  cors: { origin: '*' },
});

// Access each agent at:
// /api/agents/assistant/run
// /api/agents/coder/run
// /api/agents/translator/run
```

### Custom Middleware

Add custom middleware to the Hono app:

```typescript
import { createMiddleware } from 'hono/fancy';

const authMiddleware = createMiddleware(async (c, next) => {
  const apiKey = c.req.header('x-api-key');
  if (apiKey !== process.env.API_KEY) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  await next();
});

// Apply to server
server.app.use('/api/*', authMiddleware);
```

### Environment-Based Configuration

Configure based on environment:

```typescript
const isProduction = process.env.NODE_ENV === 'production';

const server = createServer({
  agents: { assistant: deployAgent },
  cors: isProduction
    ? { origin: 'https://myapp.com' }
    : { origin: '*' },
  rateLimit: isProduction
    ? { window: '1m', requests: 100 }
    : { window: '1m', requests: 1000 },
});
```

### Docker Deployment

Create a Dockerfile:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

Build and run:

```bash
docker build -t seashore-agent .
docker run -p 3000:3000 -e OPENAI_API_KEY=xxx seashore-agent
```

### Cloud Deployment

Deploy to various platforms:

**Vercel:**
```javascript
// api/chat.js
import { createServer } from '@seashore/deploy';
import { createAgent } from '@seashore/agent';

const server = createServer({
  agents: { assistant: deployAgent },
});

export default server.app;
```

**AWS Lambda:**
```javascript
// handler.js
import { createServer } from '@seashore/deploy';

const server = createServer({
  agents: { assistant: deployAgent },
});

export const handler = async (event) => {
  return await server.app.fetch(event);
};
```

### Streaming Response Handling

Handle streaming in different clients:

**JavaScript/TypeScript:**
```typescript
const response = await fetch('/api/agents/assistant/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ input: 'Tell me a story' }),
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader!.read();
  if (done) break;

  const text = decoder.decode(value);
  console.log(text);
}
```

**Python:**
```python
import requests

response = requests.post(
    'http://localhost:3000/api/agents/assistant/stream',
    json={'input': 'Tell me a story'},
    stream=True
)

for line in response.iter_lines():
    print(line.decode('utf-8'))
```

## Best Practices

1. **Use environment variables** - Never hardcode API keys
2. **Enable CORS carefully** - Restrict origins in production
3. **Set rate limits** - Prevent abuse and control costs
4. **Monitor performance** - Track latency and error rates
5. **Handle errors gracefully** - Return meaningful error messages
6. **Use HTTPS** - Secure communications in production
7. **Log requests** - For debugging and analytics

## Next Steps

- Add **observability** to monitor your deployment in the [Observability Tutorial](./observability.md)
- Implement **security guardrails** for protection in the [Security Tutorial](./security-guardrails.md)
- Set up **evaluation** to maintain quality in the [Evaluation Tutorial](./evaluation.md)
