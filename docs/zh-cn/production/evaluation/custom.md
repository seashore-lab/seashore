# 自定义评估器和指标

在以下情况下创建自定义指标：

- 您的域有严格的格式规则
- 您需要策略检查（无 PII、无禁止的主题）
- 您想要确定性的基于规则的检查

## 基于规则的自定义指标（示例 08 风格）

```ts
import { customMetric } from '@seashorelab/evaluation'

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

## 基于 LLM 的自定义指标

当您需要语义判断（忠实度、事实性、安全性）时使用此方法。
