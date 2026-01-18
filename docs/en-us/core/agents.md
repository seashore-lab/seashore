# Agents

Agents are autonomous AI systems that can reason, act, and use tools to accomplish tasks. Seashore implements the **ReAct** (Reasoning + Acting) pattern, where agents iteratively think through problems, execute actions, observe results, and adjust their approach.

## Overview

An agent in Seashore is created using the `createAgent` function with configuration that specifies:

- **Name**: Identifier for the agent
- **System Prompt**: Instructions that guide the agent's behavior
- **Model**: The LLM adapter (OpenAI, Anthropic, Gemini)
- **Tools**: Optional array of tools the agent can use
- **Configuration**: Settings like max iterations and temperature

## Creating a Basic Agent

The simplest agent needs just a name, system prompt, and model:

```typescript
import { createAgent } from '@seashore/agent'
import { openaiText } from '@seashore/llm'

const agent = createAgent({
  name: 'assistant',
  model: openaiText('gpt-4o', {
    apiKey: process.env.OPENAI_API_KEY,
  }),
  systemPrompt: 'You are a helpful assistant.',
})
```

## Agent Methods

### `run()`

Execute a single-turn interaction with the agent. Returns a complete result after all processing is done.

```typescript
const result = await agent.run('What is TypeScript?')

console.log(result.content) // The agent's response
console.log(result.toolCalls) // Tools used (if any)
console.log(result.usage) // Token usage statistics
console.log(result.durationMs) // Execution time
```

**Result Structure:**

```typescript
interface AgentRunResult {
  content: string              // Final response text
  structured?: unknown         // Structured output (if outputSchema set)
  toolCalls: ToolCallRecord[]  // Tools executed
  usage: TokenUsage            // Token counts
  durationMs: number           // Execution duration
  finishReason: 'stop' | 'max_iterations' | 'error'
  error?: string               // Error message if failed
}
```

### `stream()`

Stream the agent's response for real-time updates:

```typescript
for await (const chunk of agent.stream('Tell me a story')) {
  if (chunk.type === 'content' && chunk.delta) {
    process.stdout.write(chunk.delta)
  }
}
```

**Stream Chunk Types:**

- `content` - Text content delta
- `tool-call-start` - Tool execution begins
- `tool-result` - Tool execution completes
- `step-start` - ReAct iteration starts
- `step-end` - ReAct iteration ends
- `usage` - Token usage update
- `finish` - Stream completed

### `chat()`

Multi-turn conversation with message history:

```typescript
const messages = [
  { role: 'user', content: 'My name is Alice.' },
  { role: 'assistant', content: 'Hello Alice! Nice to meet you.' },
  { role: 'user', content: 'What is my name?' },
] as const

for await (const chunk of agent.chat(messages)) {
  if (chunk.type === 'content' && chunk.delta) {
    process.stdout.write(chunk.delta)
  }
}
```

## Run Options

All agent methods accept optional run options:

```typescript
const result = await agent.run('Your question', {
  // Abort execution if it takes too long
  signal: AbortSignal.timeout(30000),
  
  // Thread ID for conversation context
  threadId: 'conv-123',
  
  // User ID for attribution
  userId: 'user-456',
  
  // Custom metadata
  metadata: { source: 'web' },
  
  // Override max iterations for this run
  maxIterations: 5,
  
  // Override temperature for this run
  temperature: 0.7,
})
```

## Configuration Options

### System Prompt

The system prompt guides the agent's behavior and personality:

```typescript
const agent = createAgent({
  name: 'code-reviewer',
  systemPrompt: `You are an expert code reviewer. When reviewing code:
- Focus on best practices and potential bugs
- Be constructive and educational
- Suggest specific improvements
- Keep feedback concise`,
  model: openaiText('gpt-4o'),
})
```

### Max Iterations

Controls how many ReAct loops the agent can perform:

```typescript
const agent = createAgent({
  name: 'assistant',
  model: openaiText('gpt-4o'),
  systemPrompt: 'You are helpful.',
  maxIterations: 10, // Default is 5
})
```

This prevents infinite loops while allowing complex multi-step reasoning.

### Temperature

Controls randomness in responses (0.0 to 2.0):

```typescript
const agent = createAgent({
  name: 'creative-writer',
  model: openaiText('gpt-4o'),
  systemPrompt: 'You are a creative writer.',
  temperature: 1.2, // Higher = more creative
})
```

- **0.0-0.3**: Deterministic, focused (good for factual tasks)
- **0.4-0.7**: Balanced creativity and coherence
- **0.8-2.0**: Very creative, less predictable

### Output Schema

Define structured output using Zod schemas:

```typescript
import { z } from 'zod'

const agent = createAgent({
  name: 'data-extractor',
  model: openaiText('gpt-4o'),
  systemPrompt: 'Extract structured data.',
  outputSchema: z.object({
    name: z.string(),
    age: z.number(),
    email: z.string().email(),
  }),
})

const result = await agent.run('Name: John, Age: 30, Email: john@example.com')
console.log(result.structured) // { name: 'John', age: 30, email: 'john@example.com' }
```

## ReAct Pattern

Seashore agents use the ReAct (Reasoning + Acting) pattern:

1. **Thought**: Agent reasons about the task
2. **Action**: Agent chooses and executes a tool
3. **Observation**: Agent observes the tool result
4. **Repeat**: Steps 1-3 repeat until the task is complete

Example ReAct loop:

```
User: What is the weather in Tokyo and what's 15 + 27?

Thought: I need to get weather data and perform a calculation.
Action: get_weather(city: "Tokyo")
Observation: {"temperature": 22, "condition": "Sunny"}

Thought: Now I need to calculate 15 + 27.
Action: calculator(expression: "15 + 27")
Observation: {"result": 42}

Thought: I have all the information needed.
Final Answer: The weather in Tokyo is 22°C and sunny. 15 + 27 equals 42.
```

## Error Handling

Agents handle errors gracefully with retry logic:

```typescript
import { AgentError, isRetryableError, withRetry } from '@seashore/agent'

try {
  const result = await agent.run('Your question')
} catch (error) {
  if (error instanceof AgentError) {
    console.error('Agent error:', error.code, error.message)
    
    if (isRetryableError(error)) {
      // Retry the operation
      const result = await withRetry(
        () => agent.run('Your question'),
        { maxRetries: 3 }
      )
    }
  }
}
```

**Error Codes:**

- `MODEL_ERROR` - LLM API error
- `TOOL_ERROR` - Tool execution failure
- `VALIDATION_ERROR` - Input/output validation failed
- `MAX_ITERATIONS_EXCEEDED` - Too many ReAct loops
- `ABORTED` - Execution cancelled
- `TIMEOUT` - Execution timed out

## Advanced Usage

### Custom Tool Context

Pass custom context to tools:

```typescript
const agent = createAgent({
  name: 'db-agent',
  model: openaiText('gpt-4o'),
  systemPrompt: 'You query databases.',
  tools: [queryTool],
})

// Pass database connection to tools
const result = await agent.run('Get user 123', {
  toolContext: {
    database: myDatabaseConnection,
    userId: currentUserId,
  },
})
```

### Aborting Execution

Cancel long-running operations:

```typescript
const controller = new AbortController()

// Cancel after 30 seconds
setTimeout(() => controller.abort(), 30000)

try {
  const result = await agent.run('Your question', {
    signal: controller.signal,
  })
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Execution cancelled')
  }
}
```

### Collecting Streams

Use utility functions to work with streams:

```typescript
import { collectStream } from '@seashore/agent'

// Collect all chunks into a single result
const result = await collectStream(agent.stream('Your question'))

console.log(result.content) // Complete text
console.log(result.toolCalls) // All tool calls
console.log(result.usage) // Total token usage
```

## Agent Types

### ReAct Agent

The default and currently only agent type. Implements the ReAct pattern with tool calling.

```typescript
import { createReActAgent } from '@seashore/agent'

// Explicit ReAct agent creation (same as createAgent)
const agent = createReActAgent({
  name: 'assistant',
  model: openaiText('gpt-4o'),
  systemPrompt: 'You are helpful.',
  tools: [tool1, tool2],
})
```

### Workflow Agent

Agents can be used within workflows. See [Workflow Agent Integration](./agents/workflow-integration.md) for details.

## Best Practices

1. **Clear System Prompts**: Be specific about the agent's role and constraints
2. **Appropriate Max Iterations**: Balance between capability and cost
3. **Error Handling**: Always handle errors and implement retry logic
4. **Streaming**: Use streaming for better user experience
5. **Tool Context**: Pass necessary context rather than hardcoding in tools
6. **Monitoring**: Track token usage and execution time in production
7. **Testing**: Test agents with various inputs and edge cases

## Next Steps

- [ReAct Agents](./agents/react.md) - Deep dive into the ReAct pattern
- [Agent Configuration](./agents/configuration.md) - Advanced configuration options
- [Streaming Responses](./agents/streaming.md) - Master streaming patterns
- [Error Handling](./agents/error-handling.md) - Robust error handling strategies
- [Tools](./tools.md) - Learn how to create and use tools

## Examples

See these complete examples:

- [01: Basic Agent](../examples/01-basic-agent.md) - Simple agent without tools
- [02: Agent with Tools](../examples/02-agent-tools-stream.md) - Agent with tools and streaming
- [05: Memory](../examples/05-basic-memory.md) - Agent with conversation memory
- [09: Observability](../examples/09-observability-tracing.md) - Traced agent execution
