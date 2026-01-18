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
pnpm add @seashorelab/agent @seashorelab/llm @seashorelab/tool
```

Create an agent in seconds:

```typescript
import { createAgent } from '@seashorelab/agent'
import { openaiText } from '@seashorelab/llm'
import { defineTool } from '@seashorelab/tool'
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
| `@seashorelab/agent` | ReAct agents and orchestration |
| `@seashorelab/llm` | Multi-provider LLM adapters |
| `@seashorelab/tool` | Type-safe tool definitions |
| `@seashorelab/workflow` | Visual workflow engine |
| `@seashorelab/rag` | RAG pipeline components |
| `@seashorelab/memory` | Memory systems |
| `@seashorelab/storage` | Persistence layer |
| `@seashorelab/vectordb` | Vector database integrations |
| `@seashorelab/mcp` | Model Context Protocol support |
| `@seashorelab/observability` | Tracing and monitoring |
| `@seashorelab/evaluation` | Testing and evaluation |
| `@seashorelab/security` | Input/output guardrails |
| `@seashorelab/deploy` | Production deployment utilities |
| `@seashorelab/genui` | Generative UI components |
| `@seashorelab/contextengineering` | Context optimization |

## 📄 License

MIT
