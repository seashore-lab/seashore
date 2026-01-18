# API Reference: Agent

Package: `@seashore/agent`

## Primary entry

- `createAgent(config)` creates an agent instance.

Common config fields (see Core docs for details):

- `name`
- `model` (text adapter)
- `systemPrompt`
- `tools`
- `maxIterations`, `temperature`, `outputSchema` (optional)

## Running

- `agent.run(input)` single-turn run
- `agent.chat(messages)` multi-turn chat (can stream)
- `agent.stream(input)` stream chunks (content + tool lifecycle)

## Streaming types

The stream emits typed chunks such as:

- content deltas
- tool call start/args/end
- tool results
- finish/error

See:

- [core/agents/streaming.md](../core/agents/streaming.md)
- [examples/02-agent-tools-stream.md](../examples/02-agent-tools-stream.md)

## Utilities

- `executeTool`, `executeTools`, `formatToolResult`
- retry and error helpers (`withRetry`, `AgentError`, ...)
- thread continuation helpers (`continueThread`, `streamContinueThread`)
