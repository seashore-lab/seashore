# Error Handling

Agent execution can fail due to:

- LLM errors (network, authentication, model errors)
- tool execution failures
- cancellation (`AbortSignal`)
- hitting `maxIterations`

## Patterns

### 1) Handle final `run()` result

`run()` returns an `AgentRunResult` with `finishReason`:

- `stop`: normal completion
- `max_iterations`: hit iteration cap
- `error`: exception occurred

```ts
const result = await agent.run('Do something complex')

if (result.finishReason === 'error') {
  console.error('Agent failed:', result.error)
}
```

### 2) Handle streaming failures

When streaming, watch for `chunk.type === 'error'`.

```ts
for await (const chunk of agent.stream('...')) {
  if (chunk.type === 'error') {
    console.error('stream error:', chunk.error)
  }
}
```

### 3) Cancel execution

```ts
const controller = new AbortController()
setTimeout(() => controller.abort(), 10_000)

const result = await agent.run('Long request', { signal: controller.signal })
```

## Tool Errors

Tools return `ToolResult` objects, and failures surface through:

- streaming `tool-result` events (with `success: false`)
- the final `AgentRunResult.toolCalls` array

See [Tool Validation](../tools/validation.md) for how tool input is validated.
