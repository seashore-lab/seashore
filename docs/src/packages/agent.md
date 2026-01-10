# @seashore/agent

The core agent package providing ReAct and Workflow agent implementations.

## Installation

```bash
pnpm add @seashore/agent
```

Requires peer dependencies:
```bash
pnpm add @seashore/llm @seashore/tool
```

## Overview

`@seashore/agent` provides two types of agents:

- **ReAct Agents**: Autonomous agents that reason, act, and iterate to solve tasks
- **Workflow Agents**: Structured agents that follow predefined workflow graphs

## Quick Start

### Creating a ReAct Agent

```typescript
import { createAgent } from '@seashore/agent'
import { openaiText } from '@seashore/llm'
import { defineTool } from '@seashore/tool'
import { z } from 'zod'

const weatherTool = defineTool({
  name: 'get_weather',
  description: 'Get weather for a location',
  inputSchema: z.object({
    location: z.string(),
  }),
  execute: async ({ location }) => {
    return { temperature: 72, condition: 'sunny' }
  },
})

const agent = createAgent({
  name: 'weather-assistant',
  model: openaiText('gpt-4o'),
  tools: [weatherTool],
  systemPrompt: 'You are a helpful weather assistant.',
})

const result = await agent.run({
  messages: [{ role: 'user', content: 'What is the weather in Tokyo?' }],
})
```

## API Reference

### createAgent

Creates a ReAct agent instance.

```typescript
function createAgent<TTools extends Tool[]>(
  config: AgentConfig<TTools>
): Agent<TTools>
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Unique name for the agent |
| `model` | `TextAdapter` | Yes | LLM adapter to use |
| `systemPrompt` | `string` | No | System prompt for the agent |
| `tools` | `Tool[]` | No | Available tools (default: `[]`) |
| `maxIterations` | `number` | No | Max tool call loops (default: `5`) |
| `temperature` | `number` | No | LLM temperature (default: `0.7`) |
| `rag` | `RAGConfig` | No | RAG configuration |
| `memory` | `MemoryConfig` | No | Memory configuration |

#### Returns

An `Agent` instance with `run()` and `stream()` methods.

### createWorkflowAgent

Creates a workflow-based agent.

```typescript
function createWorkflowAgent<TWorkflow extends Workflow>(
  config: WorkflowAgentConfig<TWorkflow>
): WorkflowAgent<TWorkflow>
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Agent name |
| `workflow` | `Workflow` | Yes | Workflow definition |
| `defaultModel` | `TextAdapter` | No | Default LLM for nodes |

### Agent Methods

#### run()

Execute the agent synchronously.

```typescript
const result = await agent.run({
  messages: [{ role: 'user', content: 'Hello!' }],
  threadId?: string,
  userId?: string,
  signal?: AbortSignal,
})
```

#### stream()

Execute the agent with streaming responses.

```typescript
for await (const chunk of agent.stream({
  messages: [{ role: 'user', content: 'Hello!' }],
})) {
  if (chunk.type === 'content-delta') {
    process.stdout.write(chunk.content)
  }
}
```

## Types

### AgentRunResult

```typescript
interface AgentRunResult {
  content: string                    // Final response
  toolCalls: ToolCallResult[]         // Tool call history
  usage: TokenUsage                   // Token consumption
  messages: Message[]                 // Full conversation
}
```

### AgentStreamChunk

```typescript
type AgentStreamChunk =
  | { type: 'content-delta'; content: string }
  | { type: 'tool-call'; toolCall: ToolCall }
  | { type: 'tool-result'; result: ToolCallResult }
  | { type: 'error'; error: Error }
  | { type: 'done'; result: AgentRunResult }
```

## Error Handling

```typescript
import {
  AgentError,
  ToolExecutionError,
  MaxIterationsError,
} from '@seashore/agent'

try {
  await agent.run({ messages: [...] })
} catch (error) {
  if (error instanceof MaxIterationsError) {
    console.log('Agent reached max iterations')
  } else if (error instanceof ToolExecutionError) {
    console.log('Tool failed:', error.toolName)
  }
}
```

## Best Practices

1. **Set iteration limits** to prevent infinite loops
2. **Provide clear system prompts** for better behavior
3. **Use tools selectively** - only include what the agent needs
4. **Handle errors** gracefully at the agent level

## See Also

- [Agents Core Concept](../core-concepts/agents.md)
- [Tools Package](tool.md)
- [LLM Package](llm.md)
- [Workflow Package](workflow.md)
