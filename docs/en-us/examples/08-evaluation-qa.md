# Example 08: Evaluation QA

Source: `examples/src/08-evaluation-qa.ts`

## What it demonstrates

- Running an agent over a small QA dataset
- Scoring outputs with built-in metrics (relevance, coherence)
- Writing a custom rule-based metric
- Using a separate evaluator model to reduce bias

## How to run

```bash
pnpm --filter @seashorelab/examples exec tsx src/08-evaluation-qa.ts
```

## Key concepts

- Evaluation overview: [production/evaluation.md](../production/evaluation.md)
- QA evaluation: [production/evaluation/qa.md](../production/evaluation/qa.md)
