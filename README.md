# Seashore

<div align="center">
<img src="avatar.png" alt="Seashore Logo" width="120" height="120">

**A modern TypeScript agent framework for building AI-powered applications**

[![npm version](https://badge.fury.io/js/%40seashore%2Fagent.svg)](https://www.npmjs.com/package/@seashore/agent)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[Documentation](https://github.com/user/seashore#documentation) • [Examples](./examples) • [Contributing](./docs/book/reference/contributing.html)

</div>

---

## ✨ Features

- **🤖 ReAct Agents** - Autonomous reasoning with tool use
- **🔧 Type-Safe Tools** - Zod-powered tool definitions
- **🧠 Multi-LLM Support** - OpenAI, Anthropic, and Gemini
- **🔄 Visual Workflows** - Node-based pipeline orchestration
- **📚 RAG Pipeline** - Vector search with hybrid retrieval
- **💾 Memory Systems** - Short, mid, and long-term memory
- **🚀 Production Ready** - Observability, evaluation, security, and deployment

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
    temperature: 72,
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

## 📦 What else

- Install only what you need

- Documentation is on the way
- Explore [10+ examples](./examples)
- Join our Development

```bash
pnpm install && pnpm build && pnpm test
```

## 📄 License

MIT
