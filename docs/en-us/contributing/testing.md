# Testing

Seashore uses Vitest across packages.

## Run tests

```bash
pnpm test
```

## Run a specific test file

```bash
pnpm test packages/agent/__tests__/integration.test.ts
```

## Notes

- Some tests may use testcontainers (requires Docker).
- Some tests require API keys for provider integration.
