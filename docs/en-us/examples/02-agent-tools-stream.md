# Example 02: Agent with Tools and Stream

Source: `examples/src/02-agent-with-tools-and-stream.ts`

## What it demonstrates

- Defining tools with `defineTool` + Zod schema
- Attaching tools to an agent
- Streaming output while observing tool call events

## How to run

```bash
pnpm --filter @seashorelab/examples exec tsx src/02-agent-with-tools-and-stream.ts
```

## What to look for

- `tool-call-start` chunks appear when the model requests a tool
- `tool-result` chunks show the tool output that is fed back to the model

## Key concepts

- Tools: [core/tools.md](../core/tools.md)
- Tool definition: [core/tools/defining.md](../core/tools/defining.md)
- Streaming: [core/agents/streaming.md](../core/agents/streaming.md)
