# Example 09: Observability Tracing

Source: `examples/src/09-observability-tracing.ts`

## What it demonstrates

- Structured logging with `createLogger`
- Token estimation with `createTokenCounter`
- Manual spans with `createTracer` around agent calls

## How to run

```bash
pnpm --filter @seashorelab/examples exec tsx src/09-observability-tracing.ts
```

## Key concepts

- Observability overview: [production/observability.md](../production/observability.md)
- Tracing: [production/observability/tracing.md](../production/observability/tracing.md)
- Token counting: [production/observability/token-counting.md](../production/observability/token-counting.md)
