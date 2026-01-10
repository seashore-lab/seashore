# Project Structure

Seashore is built as a monorepo using NX and pnpm workspaces. This document explains the project structure and how the packages relate to each other.

## Monorepo Overview

```
seashore/
├── packages/           # All Seashore packages
│   ├── agent/          # Core agent implementation
│   ├── llm/            # LLM adapters
│   ├── tool/           # Tool definitions
│   ├── workflow/       # Workflow engine
│   ├── rag/            # RAG pipeline
│   ├── memory/         # Memory management
│   ├── storage/        # Storage layer
│   ├── vectordb/       # Vector database
│   ├── mcp/            # MCP client
│   ├── genui/          # Generative UI components
│   ├── observability/  # Tracing and monitoring
│   ├── evaluation/     # Evaluation framework
│   ├── security/       # Security guardrails
│   └── deploy/         # Deployment utilities
├── examples/           # Example applications
├── specs/              # Feature specifications
└── docs/               # Documentation (this book)
```

## Package Dependencies

Packages are organized in layers, where higher layers depend on lower layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│                   (Your code using Seashore)                 │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Agent Layer                               │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │ @seashore/agent│  │@seashore/workflow│ │@seashore/rag   │ │
│  └────────────────┘  └────────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Foundation Layer                          │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │ @seashore/llm  │  │ @seashore/tool │  │@seashore/memory│ │
│  └────────────────┘  └────────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Storage Layer                             │
│  ┌────────────────┐  ┌────────────────┐                     │
│  │@seashore/storage│ │@seashore/vectordb│                     │
│  └────────────────┘  └────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────────────┐
                    │   PostgreSQL     │
                    │   + pgvector    │
                    └─────────────────┘
```

## Package Descriptions

### Foundation Layer (No Internal Dependencies)

| Package | Description | Peer Dependencies |
|---------|-------------|-------------------|
| `@seashore/storage` | PostgreSQL storage with Drizzle ORM | - |
| `@seashore/tool` | Type-safe tool definitions | `zod` |
| `@seashore/llm` | LLM adapters (OpenAI, Anthropic, Gemini) | `@tanstack/ai-*` |

### Agent Layer (Depends on Foundation)

| Package | Description | Dependencies |
|---------|-------------|--------------|
| `@seashore/agent` | Core ReAct agent implementation | `@seashore/llm`, `@seashore/tool` |
| `@seashore/workflow` | Workflow engine for complex pipelines | `@seashore/llm`, `@seashore/tool` |
| `@seashore/rag` | RAG pipeline with vector search | `@seashore/vectordb`, `@seashore/llm` |
| `@seashore/memory` | Memory management systems | `@seashore/storage`, `@seashore/vectordb` |

### Specialized Layer (Depends on Agent/Foundation)

| Package | Description | Dependencies |
|---------|-------------|--------------|
| `@seashore/vectordb` | Vector database | `@seashore/storage` |
| `@seashore/mcp` | Model Context Protocol client | - |
| `@seashore/genui` | Generative UI components (React) | `@seashore/agent` |
| `@seashore/observability` | Tracing and monitoring | - |
| `@seashore/evaluation` | Agent evaluation framework | - |
| `@seashore/security` | Security guardrails | `@seashore/llm` |
| `@seashore/deploy` | Deployment utilities (Hono) | `@seashore/agent` |

## Development Commands

### Installing Dependencies

```bash
# Install all dependencies
pnpm install

# Install for a specific package
cd packages/agent && pnpm install
```

### Building

```bash
# Build all packages (in dependency order)
pnpm build

# Build a specific package
cd packages/agent && pnpm build
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests for a specific package
pnpm test packages/agent

# Run tests in watch mode
pnpm test:watch
```

### Type Checking

```bash
# Type check all packages
pnpm typecheck
```

### Linting

```bash
# Lint all packages
pnpm lint

# Fix linting issues
pnpm lint:fix
```

## Building for Development

When developing Seashore itself, use the following workflow:

```bash
# 1. Make changes to a package
cd packages/agent

# 2. Build the package
pnpm build

# 3. Watch for changes and rebuild
pnpm build --watch

# 4. Test your changes
pnpm test
```

## Using Local Packages

When testing changes to Seashore packages in another project, you can use `pnpm link`:

```bash
# In the Seashore repository
cd packages/agent
pnpm link --global

# In your test project
pnpm link --global @seashore/agent
```

## Examples Directory

The `examples/` directory contains complete, runnable examples demonstrating various Seashore features:

- `01-basic-agent.ts` - Creating a simple agent
- `02-agent-with-tools-and-stream.ts` - Using tools and streaming
- `03-basic-workflow.ts` - Building workflows
- `04-basic-rag.ts` - RAG with vector search
- `05-basic-memory.ts` - Memory management
- `06-basic-mcp.ts` - MCP integration
- `07-security-guardrails.ts` - Security guardrails
- `08-evaluation-qa.ts` - Evaluating agents
- `09-observability-tracing.ts` - Tracing and monitoring
- `10-deploy-api-server.ts` - Deploying to production

## Next Steps

- [Agents](../core-concepts/agents.md) - Learn about agent concepts
- [Package Reference](../packages/) - Detailed API documentation for each package
