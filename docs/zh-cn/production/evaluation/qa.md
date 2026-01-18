# QA 评估

示例 08 演示了一个实用的评估循环：

1. 在一组问题上运行 Agent
2. 在每个测试用例上存储输出
3. 使用指标对输出进行评分
4. 汇总通过率和平均值

## 关键模式：独立的评估器模型

使用比被评估的模型更强的模型进行评估，以减少偏差并提高评分质量。

## 批量评估

```ts
import { createEvaluator, evaluateBatch, relevanceMetric, coherenceMetric } from '@seashore/evaluation'

const evaluator = createEvaluator({
  metrics: [relevanceMetric({ threshold: 0.7 }), coherenceMetric({ threshold: 0.6 })],
  llmAdapter: { async generate(prompt) { return evaluatorAgent.run(prompt).then(r => r.content) } },
  concurrency: 2,
})

const result = await evaluateBatch({ evaluator, testCases })
```
