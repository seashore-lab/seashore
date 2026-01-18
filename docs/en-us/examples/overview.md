# Examples Overview

The `examples/` package contains runnable TypeScript scripts that demonstrate Seashore features end-to-end.

## Prerequisites

- Node.js (see repo requirements)
- pnpm
- An OpenAI-compatible API key for most examples

## Install and build

From the repository root:

```bash
pnpm install
pnpm build
```

## Environment variables

Most examples load environment variables via `dotenv/config`.

Common variables:

- `OPENAI_API_KEY` (required for most examples)
- `OPENAI_API_BASE_URL` (optional; defaults to `https://api.openai.com/v1`)
- `SERPER_API_KEY` (required for Example 11 search)
- `FIRECRAWL_API_KEY` (required for Example 11 scraping)

## Running an example

The examples package does not rely on npm scripts; run files directly with `tsx`.

From the repository root:

```bash
pnpm --filter @seashore/examples exec tsx src/01-basic-agent.ts
```

Or from the `examples/` folder:

```bash
pnpm exec tsx src/01-basic-agent.ts
```

## Tips

- If you see `Cannot find module '@seashore/...'`, you likely skipped `pnpm build`.
- For container-based examples (12, 13), you need Docker running.
