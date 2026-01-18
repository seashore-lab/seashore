# Example 05: Basic Memory

Source: `examples/src/05-basic-memory.ts`

## What it demonstrates

- Using `createShortTermMemory` to store recent conversation turns
- Building a “conversation history” context block manually
- Feeding memory-derived context into `agent.run()`

## How to run

```bash
pnpm --filter @seashore/examples exec tsx src/05-basic-memory.ts
```

## Key concepts

- Memory overview: [advanced/memory.md](../advanced/memory.md)
- Short-term memory: [advanced/memory/short-term.md](../advanced/memory/short-term.md)
