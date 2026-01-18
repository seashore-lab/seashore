# Custom Evaluators and Metrics

Create custom metrics when:

- your domain has strict formatting rules
- you need policy checks (no PII, no forbidden topics)
- you want deterministic rule-based checks

## Rule-based custom metric (Example 08 style)

```ts
import { customMetric } from '@seashore/evaluation'

const lengthCheck = customMetric({
  name: 'length_check',
  description: 'Check answer length is 100-500 characters',
  type: 'rule',
  threshold: 0.8,
  evaluate: (_input, output) => {
    const ok = output.length >= 100 && output.length <= 500
    return { score: ok ? 1.0 : 0.5, reason: ok ? 'ok' : 'too short/long' }
  },
})
```

## LLM-based custom metric

Use this when you need semantic judgement (faithfulness, factuality, safety).
