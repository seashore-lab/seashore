# Example 11: Tool Presets

Source: `examples/src/11-tool-presets.ts`

## What it demonstrates

- Using preset tools (Serper search + Firecrawl scraping)
- Wrapping a tool with an approval workflow (`withApproval`)
- Handling tool call lifecycle events while streaming

## Prerequisites

- `SERPER_API_KEY`
- `FIRECRAWL_API_KEY`

## How to run

```bash
pnpm --filter @seashore/examples exec tsx src/11-tool-presets.ts
```

## Key concepts

- Tool presets: [core/tools/presets.md](../core/tools/presets.md)
- Tool approval: [core/tools/approval.md](../core/tools/approval.md)
