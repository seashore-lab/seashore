# API Reference: Evaluation

Package: `@seashorelab/evaluation`

## Evaluators

- `createEvaluator({ metrics, llmAdapter, concurrency })`
- `evaluate(...)` / `evaluateBatch(...)`

## Built-in metrics

- `relevanceMetric`, `coherenceMetric`, `faithfulnessMetric`, `harmfulnessMetric`
- `customMetric(...)`

See:

- [production/evaluation.md](../production/evaluation.md)
- [examples/08-evaluation-qa.md](../examples/08-evaluation-qa.md)
