# API Server Setup

Example 10 shows the minimal Node.js setup:

1. create a Seashore agent
2. wrap it as a deploy agent (`run({ messages })`)
3. create a server with `createServer({ agents: ... })`
4. start Hono using `@hono/node-server`

## Endpoints

Common endpoints include:

- `GET /health`
- `POST /api/chat`
- `POST /api/agents/:agentName/run`
- `POST /api/agents/:agentName/stream`

## Rate limiting and CORS

Example 10 enables both for local testing.
