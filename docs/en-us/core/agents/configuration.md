# Agent Configuration

This page describes the configuration of `createAgent` as implemented by `@seashorelab/agent`.

The public types live in `packages/agent/src/types.ts` and are summarized in the spec contract at `specs/001-agent-framework/contracts/agent.api.md`.

## `createAgent(config)`

Minimal configuration:

```ts
import { createAgent } from '@seashorelab/agent'
import { openaiText } from '@seashorelab/llm'

const agent = createAgent({
  name: 'assistant',
  systemPrompt: 'You are helpful and concise.',
  model: openaiText('gpt-5.1', {
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
  }),
})
```

## Fields

### `name: string`

Logical identifier for logs, tracing, storage attribution, etc.

### `systemPrompt: string`

The agent-level instruction block. Seashore passes this as a system prompt to the underlying `@seashorelab/llm` `chat()` call.

### `model: AnyTextAdapter`

The LLM adapter produced by `@seashorelab/llm` (e.g. `openaiText(...)`, `anthropicText(...)`, `geminiText(...)`).

### `tools?: Tool[]`

Optional tool list. Each tool is defined with `@seashorelab/tool` and has:

- a Zod-derived JSON schema
- a runtime `execute()` function

### `maxIterations?: number` (default: `5`)

Upper bound on ReAct loops per call. This limits runaway tool loops.

You can override per run via `agent.run(input, { maxIterations })`.

### `temperature?: number` (default: `0.7`)

Controls randomness. Override per run via `agent.run(input, { temperature })`.

### `outputSchema?: ZodSchema`

Optional structured output parser. Seashore will attempt to parse the **final text response** into the schema and surface it in `result.structured`.

## Run Options

All execution methods accept `RunOptions`:

- `threadId` / `userId` (persistence + attribution)
- `signal` for cancellation
- `metadata` for custom tags
- per-run overrides: `maxIterations`, `temperature`

See [Agents](../agents.md) for usage examples.
