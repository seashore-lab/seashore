# API 服务器设置

示例 10 展示了最小的 Node.js 设置：

1. 创建一个 Seashore Agent
2. 将其包装为部署 Agent (`run({ messages })`)
3. 使用 `createServer({ agents: ... })` 创建服务器
4. 使用 `@hono/node-server` 启动 Hono

## 端点

常见端点包括：

- `GET /health`
- `POST /api/chat`
- `POST /api/agents/:agentName/run`
- `POST /api/agents/:agentName/stream`

## 速率限制和 CORS

示例 10 为本地测试启用了这两个功能。
