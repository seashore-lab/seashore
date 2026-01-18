# Memory Integration

Seashore includes helpers to integrate memory with agents so that:

- memory is added to the system prompt or user prompt
- new messages/tool results are recorded automatically
- long-term recall can inject relevant facts into context

## Middleware and wrappers

The memory package exports:

- `withMemory`
- `createMemorySystemPrompt`
- `createMemoryProcessor`
- `createMemoryMiddleware`

Use these when you want “memory-aware agents” without hand-writing the prompt assembly each time.

## A simple manual integration (Example 05 style)

Example 05 demonstrates the minimal approach:

1. store each user/assistant message in short-term memory
2. build a context string from memory
3. pass it to `agent.run()`

This is a great baseline before adding persistence.
