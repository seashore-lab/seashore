# Quick Start

This guide will help you create your first AI agent with Seashore in just a few minutes.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 20.0.0 or higher
- **pnpm** (recommended) or npm/yarn
- An **API key** from OpenAI, Anthropic, or Google

## Installation

Seashore is organized into modular packages. For a basic agent, you'll need:

```bash
pnpm add @seashore/agent @seashore/llm @seashore/tool zod
```

Or using npm:

```bash
npm install @seashore/agent @seashore/llm @seashore/tool zod
```

## Your First Agent

Let's create a simple agent that can answer questions:

### 1. Set Up Your Environment

Create a `.env` file in your project root:

```env
OPENAI_API_KEY=your_api_key_here
```

### 2. Create a Basic Agent

Create a file named `basic-agent.ts`:

```typescript
import 'dotenv/config'
import { createAgent } from '@seashore/agent'
import { openaiText } from '@seashore/llm'

// Create a simple agent
const agent = createAgent({
  name: 'assistant',
  model: openaiText('gpt-4o', {
    apiKey: process.env.OPENAI_API_KEY,
  }),
  systemPrompt: 'You are a helpful assistant.',
})

// Run the agent with a single question
const result = await agent.run('What is TypeScript?')
console.log(result.content)
```

### 3. Run Your Agent

```bash
npx tsx basic-agent.ts
```

Congratulations! You've created your first Seashore agent! 🎉

## Adding Tools

Agents become powerful when they can use tools. Let's create an agent with a weather tool:

```typescript
import 'dotenv/config'
import { createAgent } from '@seashore/agent'
import { openaiText } from '@seashore/llm'
import { defineTool } from '@seashore/tool'
import { z } from 'zod'

// Define a weather tool
const weatherTool = defineTool({
  name: 'get_weather',
  description: 'Get the current weather for a city',
  inputSchema: z.object({
    city: z.string().describe('City name'),
  }),
  execute: async ({ city }) => {
    // In production, call a real weather API
    const mockData: Record<string, any> = {
      Tokyo: { temperature: 22, condition: 'Sunny' },
      London: { temperature: 15, condition: 'Cloudy' },
      'New York': { temperature: 18, condition: 'Clear' },
    }
    
    return mockData[city] || { 
      temperature: 20, 
      condition: 'Unknown' 
    }
  },
})

// Create agent with tool
const agent = createAgent({
  name: 'weather-assistant',
  model: openaiText('gpt-4o', {
    apiKey: process.env.OPENAI_API_KEY,
  }),
  systemPrompt: 'You are a weather assistant.',
  tools: [weatherTool],
})

// Ask about weather
const result = await agent.run('What is the weather in Tokyo?')
console.log(result.content)
// The agent will automatically call the weather tool and include the result
```

## Streaming Responses

For a better user experience, stream the agent's responses:

```typescript
import 'dotenv/config'
import { createAgent } from '@seashore/agent'
import { openaiText } from '@seashore/llm'

const agent = createAgent({
  name: 'assistant',
  model: openaiText('gpt-4o', {
    apiKey: process.env.OPENAI_API_KEY,
  }),
})

// Stream the response
for await (const chunk of agent.stream('Tell me a short story')) {
  if (chunk.type === 'content' && chunk.delta) {
    process.stdout.write(chunk.delta)
  }
}
```

## Multi-Turn Conversations

Build conversational agents by passing message history:

```typescript
import 'dotenv/config'
import { createAgent } from '@seashore/agent'
import { openaiText } from '@seashore/llm'

const agent = createAgent({
  name: 'assistant',
  model: openaiText('gpt-4o', {
    apiKey: process.env.OPENAI_API_KEY,
  }),
})

// Multi-turn conversation
const messages = [
  { role: 'user', content: 'My name is Alice.' },
  { role: 'assistant', content: 'Hello Alice! How can I help you?' },
  { role: 'user', content: 'What is my name?' },
] as const

for await (const chunk of agent.chat(messages)) {
  if (chunk.type === 'content' && chunk.delta) {
    process.stdout.write(chunk.delta)
  }
}
```

## Using Different LLM Providers

Seashore supports multiple LLM providers. Simply swap the adapter:

### Anthropic Claude

```typescript
import { anthropicText } from '@seashore/llm'

const agent = createAgent({
  name: 'assistant',
  model: anthropicText('claude-3-5-sonnet-20241022', {
    apiKey: process.env.ANTHROPIC_API_KEY,
  }),
})
```

### Google Gemini

```typescript
import { geminiText } from '@seashore/llm'

const agent = createAgent({
  name: 'assistant',
  model: geminiText('gemini-2.0-flash-exp', {
    apiKey: process.env.GEMINI_API_KEY,
  }),
})
```

## Next Steps

Now that you've created your first agent, explore more features:

### Core Concepts
- [**Agents**](./core/agents.md) - Deep dive into agent configuration and capabilities
- [**Tools**](./core/tools.md) - Learn about tool validation, client-side tools, and approval flows
- [**Workflows**](./core/workflows.md) - Build multi-step AI workflows

### Advanced Features
- [**RAG**](./advanced/rag.md) - Add knowledge retrieval to your agents
- [**Memory**](./advanced/memory.md) - Give your agents memory across conversations
- [**Storage**](./advanced/storage.md) - Persist conversations to a database
- [**MCP**](./advanced/mcp.md) - Connect to Model Context Protocol servers

### Production Features
- [**Observability**](./production/observability.md) - Monitor and trace your agents
- [**Security**](./production/security.md) - Add guardrails and content moderation
- [**Deployment**](./production/deployment.md) - Deploy your agents as API servers

### Learn by Example

Check out the [Examples](./examples/overview.md) section for 15+ complete working examples covering every aspect of the framework.

## Common Patterns

### Error Handling

```typescript
import { AgentError } from '@seashore/agent'

try {
  const result = await agent.run('Your question')
  console.log(result.content)
} catch (error) {
  if (error instanceof AgentError) {
    console.error('Agent error:', error.code, error.message)
  } else {
    console.error('Unexpected error:', error)
  }
}
```

### Retries with Backoff

```typescript
import { withRetry } from '@seashore/agent'

const result = await withRetry(
  () => agent.run('Your question'),
  {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  }
)
```

### Custom Tool Context

Pass context to tool execution:

```typescript
const tool = defineTool({
  name: 'get_user_data',
  description: 'Get user data',
  inputSchema: z.object({
    userId: z.string(),
  }),
  execute: async ({ userId }, context) => {
    // Access custom context
    const database = context.database
    return await database.getUser(userId)
  },
})

// Pass context when running
const result = await agent.run('Get user 123', {
  toolContext: { database: myDatabase },
})
```

## Troubleshooting

### API Key Issues

Make sure your environment variables are loaded:

```typescript
import 'dotenv/config' // Must be at the top of your file
```

### Type Errors

Ensure you have the latest versions:

```bash
pnpm update @seashore/agent @seashore/llm @seashore/tool
```

### Stream Not Working

Some models require specific settings. Check the [LLM documentation](./core/llm.md) for details.

## Getting Help

- Browse the [Examples](./examples/overview.md)
- Check the [API Reference](./api/agent.md)
- Open an issue on [GitHub](https://github.com/z0gSh1u/seashore/issues)

Ready to build something amazing? Let's go! 🚀
