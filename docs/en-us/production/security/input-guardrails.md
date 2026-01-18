# Input Guardrails

Input guardrails run *before* the agent sees user content.

Example 07 configures input rules including:

- a custom rule
- `promptInjectionRule({ methods: ['keyword'] })`
- `piiDetectionRule({ action: 'redact' })`

## Checking input

```ts
const result = await guardrails.checkInput(userText)
if (!result.passed) return
const safeText = result.transformed ? (result.output ?? userText) : userText
```

Common policies:

- fail-closed (block on violation)
- fail-open for certain rule failures (e.g. external moderation outage)
