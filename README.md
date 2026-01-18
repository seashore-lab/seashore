# Seashore

<div align="center">
<img src="avatar.png" alt="Seashore Logo" width="120" height="120">

**A modern TypeScript agent framework for building AI-powered applications**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

📖 [Documentation](https://user.github.io/seashore/) • 🚀 [Examples](./examples)

</div>

---

## 🚀 Quick Start

```bash
pnpm add @seashore/agent @seashore/llm @seashore/tool
```

Create an agent in seconds:

```typescript
import { createAgent } from '@seashore/agent'
import { openaiText } from '@seashore/llm'
import { defineTool } from '@seashore/tool'
import { z } from 'zod'

const weatherTool = defineTool({
  name: 'get_weather',
  description: 'Get the current weather',
  inputSchema: z.object({ location: z.string() }),
  execute: async ({ location }) => ({
    temperature: 23,
    condition: 'sunny'
  }),
})

const agent = createAgent({
  name: 'assistant',
  model: openaiText('gpt-4o'),
  tools: [weatherTool],
})

const result = await agent.run({
  messages: [{ role: 'user', content: 'What is the weather in Tokyo?' }],
})

console.log(result.content)
```

## 📦 Packages

Seashore is a monorepo containing multiple packages. Install only what you need:

| Package | Description |
| :--- | :--- |
| `@seashore/agent` | ReAct agents and orchestration |
| `@seashore/llm` | Multi-provider LLM adapters |
| `@seashore/tool` | Type-safe tool definitions |
| `@seashore/workflow` | Visual workflow engine |
| `@seashore/rag` | RAG pipeline components |
| `@seashore/memory` | Memory systems |
| `@seashore/storage` | Persistence layer |
| `@seashore/vectordb` | Vector database integrations |
| `@seashore/mcp` | Model Context Protocol support |
| `@seashore/observability` | Tracing and monitoring |
| `@seashore/evaluation` | Testing and evaluation |
| `@seashore/security` | Input/output guardrails |
| `@seashore/deploy` | Production deployment utilities |
| `@seashore/genui` | Generative UI components |
| `@seashore/contextengineering` | Context optimization |

## 📄 License

MIT
