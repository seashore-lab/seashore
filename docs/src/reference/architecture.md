# Architecture

This document describes Seashore's architectural design, technology choices, and key patterns.

## Overview

Seashore is built as a modular monorepo using:
- **NX** for task orchestration and dependency-aware builds
- **pnpm** for workspace management
- **TypeScript** for type safety across all packages
- **Drizzle ORM** with PostgreSQL for data persistence
- **Rollup** for bundling

## Design Principles

### 1. Modularity

Each package has a single responsibility and minimal dependencies:

```
Foundation Layer (no internal deps)
├── @seashore/storage     (PostgreSQL + Drizzle)
└── @seashore/tool        (Type-safe tools)

LLM Layer
└── @seashore/llm         (TanStack AI adapters)

Agent Layer (depends on LLM + Tool)
├── @seashore/agent       (ReAct agents)
└── @seashore/workflow    (Workflows)

Data Layer (depends on LLM)
├── @seashore/vectordb    (Vector search)
├── @seashore/rag         (RAG pipeline)
└── @seashore/memory      (Memory management)

Specialized Layer
├── @seashore/mcp         (MCP client)
├── @seashore/genui       (React UI)
├── @seashore/observability (Tracing)
├── @seashore/evaluation  (Testing)
├── @seashore/security    (Guardrails)
└── @seashore/deploy      (Hono server)
```

### 2. Type Safety

- All packages use strict TypeScript
- Zod schemas for runtime validation
- Full type inference from tool definitions

### 3. TanStack AI Foundation

Built on `@tanstack/ai` for:
- Tree-shakeable exports
- Unified streaming interface
- Multi-provider support

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Build System** | NX | Dependency-aware builds |
| **Package Manager** | pnpm | Workspace management |
| **Language** | TypeScript 5.x | Type safety |
| **Bundler** | Rollup | Package bundling |
| **Testing** | Vitest | Unit and integration tests |
| **Database** | PostgreSQL + pgvector | Storage and vector search |
| **ORM** | Drizzle ORM | Type-safe database access |
| **Web Framework** | Hono | Edge-native server |
| **Validation** | Zod | Runtime type checking |
| **LLM Layer** | @tanstack/ai | Unified LLM interface |

## Package Dependencies

```
                    ┌─────────────────┐
                    │ @seashore/agent │
                    │   (ReAct + WF)   │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ @seashore/llm │   │ @seashore/tool│   │@seashore/memory│
│   (Adapters)  │   │   (Tools)     │   │  (Storage)    │
└───────┬───────┘   └───────────────┘   └───────┬───────┘
        │                                       │
        ▼                                       ▼
┌───────────────┐                    ┌──────────────────┐
│ @tanstack/ai-*│                    │ @seashore/storage│
│  (Providers)  │                    │  (PostgreSQL)    │
└───────────────┘                    └────────┬─────────┘
                                               │
                                    ┌──────────▼─────────┐
                                    │  PostgreSQL +      │
                                    │  pgvector          │
                                    └────────────────────┘
```

## Key Patterns

### Tool Definition Pattern

```typescript
const tool = defineTool({
  name: 'string',
  description: 'string',
  inputSchema: z.object({...}),
  execute: async (input, context) => {...}
})
```

**Benefits:**
- Type-safe parameters
- Automatic validation
- Self-documenting (description helps LLM)

### Adapter Pattern

LLM adapters provide a unified interface:

```typescript
// All adapters implement the same interface
interface TextAdapter {
  chat(messages, options): AsyncIterable<StreamChunk>
}
```

**Benefits:**
- Easy provider switching
- Consistent API
- Streaming support

### Repository Pattern

Storage uses repositories for data access:

```typescript
const threadRepo = createThreadRepository(db)
const thread = await threadRepo.create({...})
```

**Benefits:**
- Encapsulated queries
- Easy testing with mocks
- Transaction support

## Performance Considerations

### Vector Search

- **HNSW Indexing**: Approximate nearest neighbor search
- **Target**: p95 latency < 200ms for 10k documents
- **Hybrid Search**: Combine vector + text for relevance

### Streaming

- First token latency ≤ 1.2x underlying API
- Minimal overhead through pass-through streaming

### Token Efficiency

- Automatic message compression on long context
- Memory consolidation for important information

## Deployment Targets

### Cloudflare Workers

- Edge execution
- Cold start optimization
- Durable Objects for state

### Node.js

- Traditional servers
- Docker containers
- Long-running processes

## Security Architecture

### Input Validation

- Zod schemas on all tool inputs
- Prompt injection detection
- PII identification and redaction

### Output Filtering

- Content safety checks
- Guardrails for specific topics
- Audit logging for sensitive operations

## Extensibility

### Custom Tools

```typescript
const customTool = defineTool({...})
```

### Custom Nodes

```typescript
const customNode = createNode({
  type: 'custom',
  execute: async (context) => {...}
})
```

### Custom Metrics

```typescript
const customMetric = createMetric({
  name: 'custom',
  evaluate: async (output) => {...}
})
```

## Trade-offs

| Decision | Rationale |
|----------|-----------|
| PostgreSQL over specialized vector DB | Unified storage, transactional consistency |
| Drizzle over Prisma | Smaller bundle, SQL-first |
| Hono over Express | Edge-native, smaller footprint |
| NX over Turbopack | Better monorepo support for our use case |

## Future Considerations

- Additional vector database backends (Qdrant, Weaviate)
- More LLM providers (Cohere, Mistral)
- Streaming workflow execution
- Distributed tracing integration
