# Agents

Agents are the core building blocks of Seashore. An agent is an AI-powered entity that can reason, use tools, and interact with users to accomplish tasks.

## What is an Agent?

An agent in Seashore is a program that:

1. **Receives input** from users (messages, questions, commands)
2. **Thinks** about what to do using an LLM (Large Language Model)
3. **Acts** by calling tools or generating responses
4. **Observes** the results of its actions
5. **Iterates** until the task is complete

This is known as the **ReAct** (Reasoning + Acting) pattern.

## Types of Agents

Seashore supports two main types of agents:

### ReAct Agents

The most common type of agent. ReAct agents autonomously decide which tools to use and in what order.

```typescript
import { createAgent } from '@seashore/agent'
import { openaiText } from '@seashore/llm'

const agent = createAgent({
  name: 'assistant',
  model: openaiText('gpt-4o'),
  tools: [weatherTool, searchTool],
  systemPrompt: 'You are a helpful assistant.',
})

const result = await agent.run({
  messages: [{ role: 'user', content: 'What is the weather in Tokyo?' }],
})
```

### Workflow Agents

Workflow agents follow a predefined structure defined by a workflow graph.

```typescript
import { createWorkflowAgent } from '@seashore/agent'
import { myWorkflow } from './workflow'

const agent = createWorkflowAgent({
  name: 'workflow-agent',
  workflow: myWorkflow,
})
```

## Agent Configuration

### Basic Configuration

```typescript
const agent = createAgent({
  name: 'my-agent',              // Required: Agent name
  model: openaiText('gpt-4o'),    // Required: LLM adapter
  systemPrompt: 'You are helpful', // Optional: System prompt
  tools: [],                      // Optional: Available tools
  maxIterations: 5,               // Optional: Max tool call loops
  temperature: 0.7,               // Optional: LLM temperature
})
```

### Configuration Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `name` | `string` | Yes | - | Unique name for the agent |
| `model` | `TextAdapter` | Yes | - | LLM adapter to use |
| `systemPrompt` | `string` | No | - | Instructions for the agent |
| `tools` | `Tool[]` | No | `[]` | Available tools |
| `maxIterations` | `number` | No | `5` | Max tool call loops |
| `temperature` | `number` | No | `0.7` | LLM temperature (0-2) |

## Execution Modes

### Synchronous Execution

Use `agent.run()` for non-streaming responses:

```typescript
const result = await agent.run({
  messages: [{ role: 'user', content: 'Hello!' }],
})

console.log(result.content)        // Final response
console.log(result.toolCalls)      // Tool call history
console.log(result.usage)          // Token usage
```

### Streaming Execution

Use `agent.stream()` for real-time responses:

```typescript
for await (const chunk of agent.stream({
  messages: [{ role: 'user', content: 'Tell me a story' }],
})) {
  if (chunk.type === 'content-delta') {
    process.stdout.write(chunk.content)
  }
}
```

### Stream Chunk Types

| Type | Description |
|------|-------------|
| `content-delta` | Piece of text content |
| `tool-call` | Tool being called |
| `tool-result` | Result from a tool |
| `error` | An error occurred |
| `done` | Agent finished |

## Multi-Turn Conversations

Agents can maintain context across multiple messages:

```typescript
const result = await agent.run({
  messages: [
    { role: 'user', content: 'My name is Alice' },
    { role: 'assistant', content: 'Nice to meet you, Alice!' },
    { role: 'user', content: 'What is my name?' },
  ],
})
// Agent will remember: "Your name is Alice!"
```

## Agent Result Structure

When an agent completes execution, it returns:

```typescript
interface AgentRunResult {
  content: string           // Final response text
  toolCalls: ToolCallResult[] // History of tool calls
  usage: TokenUsage         // Token consumption
  messages: Message[]       // Full conversation history
}
```

## Error Handling

Agents handle errors gracefully:

```typescript
try {
  const result = await agent.run({
    messages: [{ role: 'user', content: 'Do something' }],
  })
} catch (error) {
  if (error instanceof MaxIterationsError) {
    console.log('Agent reached max iterations')
  } else if (error instanceof ToolExecutionError) {
    console.log('Tool failed:', error.toolName)
  }
}
```

## Best Practices

1. **Be Specific with System Prompts**: Clear instructions lead to better behavior

```typescript
// Good
systemPrompt: `You are a weather assistant. Always use the get_weather tool
when asked about weather. Provide concise answers.`

// Bad
systemPrompt: 'Help with things.'
```

2. **Limit Tool Scope**: Only provide tools the agent actually needs

3. **Set Reasonable Iteration Limits**: Prevent infinite loops with `maxIterations`

4. **Use Appropriate Temperature**: Lower for factual tasks, higher for creative tasks

## Next Steps

- [Tools](tools.md) - Learn how to create and use tools
- [LLM Adapters](llm-adapters.md) - Configure different LLM providers
- [Workflows](workflows.md) - Build complex agent pipelines
