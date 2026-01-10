# Quickstart

Get started with Seashore by building your first AI agent in under 5 minutes.

## Your First Agent

Let's create a simple weather assistant that can answer questions about the weather.

### Step 1: Create the Project

```bash
mkdir my-seashore-app
cd my-seashore-app
pnpm init
```

### Step 2: Install Dependencies

```bash
pnpm add @seashore/agent @seashore/llm @seashore/tool
pnpm add -D typescript tsx dotenv
```

### Step 3: Create the Agent

Create a file named `agent.ts`:

```typescript
import 'dotenv/config'
import { createAgent } from '@seashore/agent'
import { openaiText } from '@seashore/llm'
import { defineTool } from '@seashore/tool'
import { z } from 'zod'

// Define a weather tool
const weatherTool = defineTool({
  name: 'get_weather',
  description: 'Get the current weather for a location',
  inputSchema: z.object({
    location: z.string().describe('The city name'),
  }),
  execute: async ({ location }) => {
    // Simulated weather data
    const conditions = ['sunny', 'cloudy', 'rainy', 'snowy']
    const temperature = Math.floor(Math.random() * 30) + 50 // 50-80°F
    const condition = conditions[Math.floor(Math.random() * conditions.length)]

    return {
      location,
      temperature,
      condition,
    }
  },
})

// Create the agent
const agent = createAgent({
  name: 'weather-assistant',
  model: openaiText('gpt-4o', {
    apiKey: process.env.OPENAI_API_KEY!,
  }),
  tools: [weatherTool],
  systemPrompt: 'You are a helpful weather assistant. When asked about weather, use the get_weather tool to get accurate information.',
})

// Run the agent
async function main() {
  const result = await agent.run({
    messages: [{ role: 'user', content: 'What is the weather in Tokyo?' }],
  })

  console.log('Agent response:', result.content)
}

main().catch(console.error)
```

### Step 4: Set Your API Key

Create a `.env` file:

```
OPENAI_API_KEY=sk-your-openai-key-here
```

### Step 5: Run the Agent

```bash
npx tsx agent.ts
```

You should see output like:

```
Agent response: The weather in Tokyo is currently sunny with a temperature of 72°F.
```

## Streaming Responses

For a more interactive experience, use streaming to see the agent's response in real-time:

```typescript
async function main() {
  console.log('Assistant: ')

  for await (const chunk of agent.stream({
    messages: [{ role: 'user', content: 'What is the weather in Paris?' }],
  })) {
    if (chunk.type === 'content-delta') {
      process.stdout.write(chunk.content)
    }
  }

  console.log()
}
```

## Multi-Turn Conversations

Agents can maintain context across multiple messages:

```typescript
async function main() {
  const result = await agent.run({
    messages: [
      { role: 'user', content: 'What is the weather in Tokyo?' },
      { role: 'assistant', content: 'Tokyo is sunny at 72°F.' },
      { role: 'user', content: 'What about London?' },
    ],
  })

  console.log(result.content)
}
```

## Using Different LLM Providers

Switching between OpenAI, Anthropic, and Gemini is as easy as changing the adapter:

```typescript
import { anthropicText } from '@seashore/llm'

const agent = createAgent({
  name: 'claude-assistant',
  model: anthropicText('claude-3-5-sonnet-20241022', {
    apiKey: process.env.ANTHROPIC_API_KEY!,
  }),
  // ... rest of config
})
```

## What's Next?

Congratulations! You've built your first agent with Seashore. Here are some next steps:

- [Core Concepts](../core-concepts/agents.md) - Learn more about agents and their capabilities
- [Tools](../core-concepts/tools.md) - Discover how to create and use tools
- [Tutorials](../tutorials/) - Explore step-by-step guides for building more complex agents
