# Example 15: New Preset Tools

Source: `examples/src/15-new-preset-tools.ts`

## What it demonstrates

- A showcase of preset tools in `@seashorelab/tool/presets`
- Offline tools (calculator family)
- Network tools (DuckDuckGo, Wikipedia, GitHub, finance, arXiv, article extraction)
- A restricted shell tool for controlled command execution
- (Optional) an agent that uses several preset tools together

## How to run

```bash
pnpm --filter @seashorelab/examples exec tsx src/15-new-preset-tools.ts
```

## Notes

- Many sub-examples depend on network access.
- Some providers may rate-limit (GitHub without a token).

## Key concepts

- Tool presets: [core/tools/presets.md](../core/tools/presets.md)
- Security policies: [production/security/policies.md](../production/security/policies.md)
