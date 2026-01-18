# Introduction

Welcome to **Seashore**, a modern TypeScript agent framework for building AI-powered applications. Seashore provides a comprehensive set of tools and abstractions to help developers create sophisticated autonomous agents, workflows, and AI-driven systems.

## What is Seashore?

Seashore is a production-ready framework that brings together the essential building blocks for AI agent development:

- **🤖 Autonomous Agents**: Create ReAct-style agents that can reason, act, and use tools to accomplish complex tasks
- **🔧 Type-Safe Tools**: Define tools with Zod schemas for complete type safety from definition to execution
- **🧠 Multi-LLM Support**: Seamlessly work with OpenAI, Anthropic Claude, and Google Gemini through unified adapters
- **🔄 Visual Workflows**: Build complex multi-step workflows with node-based orchestration
- **📚 RAG Pipelines**: Implement retrieval-augmented generation with document loaders, splitters, and vector search
- **💾 Memory Systems**: Give your agents short-term, mid-term, and long-term memory capabilities
- **🚀 Production Ready**: Built-in observability, evaluation, security, and deployment tools

## Key Features

### ReAct Agents

Seashore implements the ReAct (Reasoning + Acting) pattern, allowing agents to:
- Think through problems step-by-step
- Choose and execute appropriate tools
- Observe results and adapt their approach
- Provide clear explanations of their reasoning

### Type-Safe Tool System

Define tools with full TypeScript type inference:

```typescript
const weatherTool = defineTool({
  name: 'get_weather',
  description: 'Get the current weather',
  inputSchema: z.object({ 
    location: z.string() 
  }),
  execute: async ({ location }) => ({
    temperature: 72,
    condition: 'sunny'
  }),
})
```

### Workflow Orchestration

Build complex multi-step workflows with:
- LLM nodes for AI processing
- Tool nodes for external actions
- Condition nodes for branching logic
- Parallel nodes for concurrent execution
- Custom nodes for any logic

### Modular Architecture

Seashore follows a modular design where you only install what you need:

- `@seashorelab/agent` - Core agent functionality
- `@seashorelab/tool` - Tool definitions and execution
- `@seashorelab/llm` - LLM adapters (OpenAI, Anthropic, Gemini)
- `@seashorelab/workflow` - Workflow orchestration
- `@seashorelab/rag` - Retrieval-augmented generation
- `@seashorelab/memory` - Memory systems
- `@seashorelab/storage` - Persistence layer
- `@seashorelab/vectordb` - Vector database operations
- `@seashorelab/mcp` - Model Context Protocol support
- `@seashorelab/observability` - Logging, tracing, metrics
- `@seashorelab/evaluation` - Agent evaluation tools
- `@seashorelab/security` - Guardrails and content moderation
- `@seashorelab/deploy` - Deployment utilities
- `@seashorelab/genui` - React UI components
- `@seashorelab/contextengineering` - Context optimization

## Philosophy

Seashore is built on several core principles:

1. **Type Safety First**: Leverage TypeScript's type system to catch errors at compile time
2. **Modular Design**: Use only the packages you need, without unnecessary bloat
3. **Developer Experience**: Clear APIs, comprehensive documentation, and helpful examples
4. **Production Ready**: Built-in observability, error handling, and security features
5. **Framework Agnostic**: Works with any TypeScript/JavaScript project

## Who Should Use Seashore?

Seashore is ideal for:

- **Application Developers** building AI-powered features into existing apps
- **AI Engineers** creating autonomous agents and complex workflows
- **Product Teams** prototyping AI assistants and chatbots
- **Researchers** experimenting with agent architectures and RAG systems
- **Startups** building AI-first products

## Comparison with Other Frameworks

Seashore is similar to frameworks like LangChain, Mastra, Agno, and Google ADK, but with key differences:

- **TypeScript First**: Native TypeScript support with full type inference (not a Python port)
- **Modular Packages**: Install only what you need instead of a monolithic framework
- **Modern Stack**: Built on top of TanStack AI for LLM adapters
- **Production Focus**: Includes observability, evaluation, and security out of the box
- **Workflow-First**: Visual workflow orchestration as a first-class concept

## What's Next?

Ready to get started? Head over to the [Quick Start](./quick-start.md) guide to create your first agent in minutes.

Or explore specific features:

- [Agents](./core/agents.md) - Learn about ReAct agents and configuration
- [Tools](./core/tools.md) - Define custom tools for your agents
- [Workflows](./core/workflows.md) - Build multi-step AI workflows
- [RAG](./advanced/rag.md) - Implement retrieval-augmented generation
- [Examples](./examples/overview.md) - Browse 15+ complete examples

## Community & Support

- **GitHub**: [z0gSh1u/seashore](https://github.com/z0gSh1u/seashore)
- **Issues**: Report bugs and request features on GitHub
- **Examples**: Check out the [examples directory](https://github.com/z0gSh1u/seashore/tree/master/examples) for working code

## License

Seashore is open source software released under the MIT License.
