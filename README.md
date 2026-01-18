# Seashore

<div align="center">
<img src="avatar.png" alt="Seashore Logo" width="120" height="120">

**A modern TypeScript agent framework for building AI-powered applications**

[![npm version](https://badge.fury.io/js/%40seashore%2Fagent.svg)](https://www.npmjs.com/package/@seashore/agent)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

📖 [Documentation](https://user.github.io/seashore/) • 🚀 [Examples](./examples) • 🤝 [Contributing](./docs/README.md)

[English Docs](https://user.github.io/seashore/en/) | [中文文档](https://user.github.io/seashore/zh/)

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

## 📦 Packages

Seashore is a monorepo containing multiple packages. Install only what you need:

- `@seashore/agent` - ReAct agents and orchestration
- `@seashore/llm` - Multi-provider LLM adapters
- `@seashore/tool` - Type-safe tool definitions
- `@seashore/workflow` - Visual workflow engine
- `@seashore/rag` - RAG pipeline components
- `@seashore/memory` - Memory systems
- `@seashore/storage` - Persistence layer
- `@seashore/vectordb` - Vector database integrations
- `@seashore/mcp` - Model Context Protocol support
- `@seashore/observability` - Tracing and monitoring
- `@seashore/evaluation` - Testing and evaluation
- `@seashore/security` - Input/output guardrails
- `@seashore/deploy` - Production deployment utilities
- `@seashore/genui` - Generative UI components
- `@seashore/contextengineering` - Context optimization

## 📚 Documentation

Full documentation is available at [https://user.github.io/seashore/](https://user.github.io/seashore/)

- 📖 [English Documentation](https://user.github.io/seashore/en/)
- 📖 [中文文档](https://user.github.io/seashore/zh/)

### Local Documentation

To build and serve the documentation locally:

```bash
cd docs
./build.ps1      # Build both language versions
./serve.ps1 en   # Serve English docs
./serve.ps1 zh   # Serve Chinese docs
./serve.ps1 both # Serve both
```

See [docs/README.md](./docs/README.md) for more details.

## 🚀 Examples

Explore [14+ working examples](./examples) covering:

- Basic agents and tool use
- Streaming responses
- Workflows and orchestration
- RAG pipelines
- Memory systems
- MCP integration
- Security guardrails
- Evaluation frameworks
- Observability and tracing
- Production deployment

## 🤝 Contributing

```bash
pnpm install && pnpm build && pnpm test
```

## 📄 License

MIT
