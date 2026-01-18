# API 参考：评估

包：`@seashore/evaluation`

## 评估器

- `createEvaluator({ metrics, llmAdapter, concurrency })`
- `evaluate(...)` / `evaluateBatch(...)`

## 内置指标

- `relevanceMetric`、`coherenceMetric`、`faithfulnessMetric`、`harmfulnessMetric`
- `customMetric(...)`

参见：

- [production/evaluation.md](../production/evaluation.md)
- [examples/08-evaluation-qa.md](../examples/08-evaluation-qa.md)
