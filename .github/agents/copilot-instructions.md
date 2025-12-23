````chatagent
# Seashore Agent Framework - Development Guidelines

Auto-generated from feature plans. Last updated: 2025-07-11

## Active Technologies

| Category | Technology | Version/Details |
|----------|-----------|-----------------|
| Core AI | @tanstack/ai | Provider adapters, toolDefinition(), streaming |
| React | @tanstack/ai-react | useChat, fetchServerSentEvents |
| Backend | Hono | streamSSE, Cloudflare Workers + Node.js |
| ORM | Drizzle ORM | PostgreSQL, customType for vector/tsvector |
| Database | PostgreSQL | pgvector (HNSW), tsvector for full-text |
| Validation | Zod | Schema validation for tools and APIs |
| Testing | vitest | ESM-native unit testing |
| Monorepo | pnpm + nx + Rollup | Package management, ESM bundling |

## Project Structure

```text
packages/
  agent/       # ReAct, Workflow agents
  deploy/      # Hono server, Cloudflare Workers
  evaluation/  # Agent benchmarking
  genui/       # React chat components
  llm/         # Provider adapters (OpenAI, Anthropic, Gemini)
  mcp/         # Model Context Protocol client
  memory/      # Short/mid/long term memory
  observability/ # OpenTelemetry integration
  rag/         # Vector search + hybrid retrieval
  security/    # Rate limiting, content filtering
  storage/     # Thread/Message persistence
  tool/        # Tool definitions (Serper, Firecrawl)
  vectordb/    # pgvector wrapper with HNSW
  workflow/    # DAG workflow engine
```

## Commands

```bash
pnpm install          # Install dependencies
pnpm build            # Build all packages
pnpm test             # Run vitest tests
pnpm lint             # ESLint with TypeScript
```

## Code Style

- TypeScript 5.x strict mode
- ESM Only (no CommonJS)
- Prefer functional patterns over classes
- Use Zod for runtime validation
- All async functions must handle errors

## Key Patterns

### LLM Client
```typescript
const llm = createLLMClient({ provider: "openai", model: "gpt-4o" });
```

### Tool Definition
```typescript
const tool = defineTool({
  name: "search",
  parameters: z.object({ query: z.string() }),
  execute: async ({ query }) => { /* ... */ },
});
```

### Agent Creation
```typescript
const agent = createReActAgent({ llm, tools: [tool] });
```

## Recent Changes

- 001-agent-framework: Full technical design with 14 packages
- PostgreSQL unified storage (relational + vector)
- HNSW + tsvector hybrid search with RRF fusion
- Tool Call-based Generative UI

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->

````
