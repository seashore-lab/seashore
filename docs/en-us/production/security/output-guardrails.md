# Output Guardrails

Output guardrails run *after* the model generates content.

Example 07 applies:

- PII redaction for email/phone
- topic blocking for specific topics

## Checking output

```ts
const outputResult = await guardrails.checkOutput(modelText)
const finalText = outputResult.transformed ? (outputResult.output ?? modelText) : modelText
```
