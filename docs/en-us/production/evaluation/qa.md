# QA Evaluation

Example 08 demonstrates a pragmatic evaluation loop:

1. run the agent across a set of questions
2. store outputs on each test case
3. score the outputs using metrics
4. summarize pass rate and averages

## Key pattern: separate evaluator model

Use a stronger model for evaluation than the model being evaluated, to reduce bias and improve scoring quality.

## Batch evaluation

```ts
import { createEvaluator, evaluateBatch, relevanceMetric, coherenceMetric } from '@seashorelab/evaluation'

const evaluator = createEvaluator({
  metrics: [relevanceMetric({ threshold: 0.7 }), coherenceMetric({ threshold: 0.6 })],
  llmAdapter: { async generate(prompt) { return evaluatorAgent.run(prompt).then(r => r.content) } },
  concurrency: 2,
})

const result = await evaluateBatch({ evaluator, testCases })
```
