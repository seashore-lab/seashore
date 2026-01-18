# Example 06: Basic MCP

Source: `examples/src/06-basic-mcp.ts`

## What it demonstrates

- Connecting to an MCP server over stdio
- Bridging MCP tools into Seashore tools
- Creating an agent that can operate on the local filesystem

## Prerequisites

- Node.js
- `npx` available
- Depending on the model/provider: some MCP tool calling features may require an OpenAI-compatible “Responses API”.

## How to run

```bash
pnpm --filter @seashore/examples exec tsx src/06-basic-mcp.ts
```

## Key concepts

- MCP overview: [advanced/mcp.md](../advanced/mcp.md)
- Client: [advanced/mcp/client.md](../advanced/mcp/client.md)
- Tool bridge: [advanced/mcp/tools.md](../advanced/mcp/tools.md)
