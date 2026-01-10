# Introduction to Seashore

**Seashore** is a modern, modular agent framework for building AI-powered applications in TypeScript. Built as an NX-based monorepo with pnpm workspaces, Seashore provides a comprehensive toolkit for creating intelligent agents with reasoning, tool use, and workflow capabilities.

## What is Seashore?

Seashore is a TypeScript framework designed to help developers build production-ready AI agents. It provides:

- **ReAct Agents**: Intelligent agents that can reason, use tools, and iterate to solve complex tasks
- **Type-Safe Tool System**: Define tools with Zod schemas for automatic validation and type inference
- **Multi-LLM Support**: Unified adapters for OpenAI, Anthropic, and Google Gemini
- **Visual Workflows**: Node-based workflow composer for complex agent pipelines
- **RAG Pipeline**: Retrieval-augmented generation with vector search and hybrid retrieval
- **Memory Systems**: Short-term, mid-term, and long-term memory management
- **Production Ready**: Built-in observability, evaluation, security guardrails, and deployment utilities

## Key Features

### Core Capabilities

| Feature | Description |
|---------|-------------|
| **ReAct Agent** | Agents with Thought-Action-Observation reasoning loops |
| **Tool System** | Type-safe tool definitions with Zod validation |
| **LLM Integration** | Support for OpenAI, Anthropic, and Gemini |
| **Workflows** | Visual workflow builder for complex pipelines |
| **RAG** | Retrieval-augmented generation with vector search |
| **Memory** | Multi-tier memory management systems |
| **MCP** | Model Context Protocol client for integrations |
| **GenUI** | React components for generative UI |
| **Observability** | Tracing, logging, and token counting |
| **Evaluation** | Agent output evaluation and metrics |
| **Security** | Guardrails and content filtering |
| **Deploy** | Hono-based deployment for Workers and Node.js |

### Developer Experience

- **Type-Safe**: Built with TypeScript from the ground up
- **Modular**: Install only the packages you need
- **Extensible**: Easy to create custom tools and workflows
- **Production-Ready**: Built-in testing, observability, and deployment tools

## Why Use Seashore?

### Compared to Other Frameworks

Seashore stands out from other agent frameworks in several ways:

1. **Modular Architecture**: Install only what you need. Want just the agent and LLM adapters? `pnpm add @seashore/agent @seashore/llm @seashore/tool`. Need RAG? Add `@seashore/rag` and `@seashore/vectordb`.

2. **TanStack AI Foundation**: Built on `@tanstack/ai`, providing a modern, tree-shakeable core with excellent TypeScript support.

3. **Production-Ready Features**: Observability, evaluation, security guardrails, and deployment utilities are built-in, not add-ons.

4. **Edge-Native**: Designed to work with Cloudflare Workers and other edge platforms, not just traditional Node.js servers.

5. **Full-Stack**: From backend agents to frontend GenUI components, Seashore covers the entire stack.

## Quick Example

Here's a minimal agent that can answer questions about the weather:

```typescript
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
    // In a real app, this would call a weather API
    return { temperature: 72, condition: 'sunny' }
  },
})

// Create the agent
const agent = createAgent({
  name: 'weather-assistant',
  model: openaiText('gpt-4o', { apiKey: process.env.OPENAI_API_KEY }),
  tools: [weatherTool],
  systemPrompt: 'You are a helpful weather assistant.',
})

// Run the agent
const result = await agent.run({
  messages: [{ role: 'user', content: 'What is the weather in Tokyo?' }],
})

console.log(result.content)
```

## What's Next?

- [Installation](getting-started/installation.md) - Get Seashore installed on your system
- [Quickstart](getting-started/quickstart.md) - Build your first agent in 5 minutes
- [Core Concepts](core-concepts/agents.md) - Learn about agents, tools, and workflows
- [Tutorials](tutorials/) - Step-by-step guides for common use cases

## Version

Current version: **0.1.0**

Seashore is actively developed. Check the [GitHub repository](https://github.com/user/seashore) for the latest releases.
