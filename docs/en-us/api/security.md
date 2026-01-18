# API Reference: Security

Package: `@seashore/security`

## Guardrails

- `createGuardrails({ inputRules, outputRules, onViolation? })`
- `guardrails.checkInput(text)`
- `guardrails.checkOutput(text)`

## Built-in rules

- `promptInjectionRule(...)`
- `piiDetectionRule(...)`
- `topicBlockRule(...)`
- `toxicityRule(...)`
- `lengthLimitRule(...)`

## Custom rules

- `createSecurityRule({ name, type, check, ... })`

See:

- [production/security.md](../production/security.md)
- [examples/07-security-guardrails.md](../examples/07-security-guardrails.md)
