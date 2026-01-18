# Streaming Responses

Seashore agents support streaming via `agent.stream(input)` and `agent.chat(messages)`.

Streaming is an `AsyncIterable` of `AgentStreamChunk` events defined in `packages/agent/src/types.ts`.

## Typical Consumption Pattern

```ts
for await (const chunk of agent.stream('Explain RAG in one paragraph')) {
  if (chunk.type === 'content' && chunk.delta) process.stdout.write(chunk.delta)

  if (chunk.type === 'tool-call-start' && chunk.toolCall) {
    console.log(`\n[tool:start] ${chunk.toolCall.name}`)
  }

  if (chunk.type === 'tool-result' && chunk.toolResult) {
    console.log(`\n[tool:result] ${JSON.stringify(chunk.toolResult.data)}`)
  }
}
```

See the runnable example [examples/src/02-agent-with-tools-and-stream.ts](../../examples/02-agent-tools-stream.md).

## Chunk Types

The agent stream uses these event kinds:

- `content`: incremental assistant text in `delta`
- `tool-call-start` / `tool-call-args` / `tool-call-end`: emitted around tool selection
- `tool-result`: emitted after tool execution
- `finish`: contains the final `AgentRunResult`
- `error`: contains an `Error`

Notes:

- Tool arguments are emitted as a JSON string in `tool-call-args` (mirroring the underlying LLM tool-call format).
- The agent also emits a `finish` event even after an `error` event; the final result will have `finishReason: 'error'`.

## Multi-Turn Streaming (`chat`)

`agent.chat(messages)` takes a message array with roles like `user` and `assistant`.

```ts
const messages = [
  { role: 'user', content: 'My name is David.' },
  { role: 'assistant', content: 'Hi David!' },
  { role: 'user', content: 'What is the first letter of my name?' },
] as const

for await (const chunk of agent.chat(messages)) {
  if (chunk.type === 'content' && chunk.delta) process.stdout.write(chunk.delta)
}
```

This is demonstrated in [examples/src/01-basic-agent.ts](../../examples/01-basic-agent.md).
