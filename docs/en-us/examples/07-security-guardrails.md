# Example 07: Security Guardrails

Source: `examples/src/07-security-guardrails.ts`

## What it demonstrates

- Creating guardrails with built-in rules (prompt injection, PII, topic blocks)
- Implementing a custom security rule
- Redacting sensitive information while still allowing the request

## How to run

```bash
pnpm --filter @seashore/examples exec tsx src/07-security-guardrails.ts
```

## Key concepts

- Security overview: [production/security.md](../production/security.md)
- Input guardrails: [production/security/input-guardrails.md](../production/security/input-guardrails.md)
- Output guardrails: [production/security/output-guardrails.md](../production/security/output-guardrails.md)
