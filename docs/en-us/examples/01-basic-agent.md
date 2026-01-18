# Example 01: Basic Agent

Source: `examples/src/01-basic-agent.ts`

## What it demonstrates

- Creating a minimal agent with an LLM adapter
- Single-turn `agent.run()`
- Multi-turn `agent.chat()` with streaming chunks

## How to run

```bash
pnpm --filter @seashorelab/examples exec tsx src/01-basic-agent.ts
```

## Key concepts

- Agents: [core/agents.md](../core/agents.md)
- Streaming: [core/agents/streaming.md](../core/agents/streaming.md)
