# Example 14: Context Engineering

Source: `examples/src/14-context-engineering.ts`

## What it demonstrates

- Injecting runtime environment info (time, timezone)
- Building structured system prompts with `createContext`
- Using presets (identity, time awareness, safety)
- Using templates with variable interpolation
- Separating static vs dynamic prompt portions for caching

## How to run

```bash
pnpm --filter @seashore/examples exec tsx src/14-context-engineering.ts
```

## Key concepts

- Context engineering overview: [advanced/context-engineering.md](../advanced/context-engineering.md)
- Compression: [advanced/context-engineering/compression.md](../advanced/context-engineering/compression.md)
