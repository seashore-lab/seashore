# 示例 08：评估 QA

源文件：`examples/src/08-evaluation-qa.ts`

## 演示内容

- 在小型 QA 数据集上运行 agent
- 使用内置指标（相关性、连贯性）对输出进行评分
- 编写自定义基于规则的指标
- 使用单独的评估器模型来减少偏差

## 运行方法

```bash
pnpm --filter @seashorelab/examples exec tsx src/08-evaluation-qa.ts
```

## 核心概念

- 评估概述：[production/evaluation.md](../production/evaluation.md)
- QA 评估：[production/evaluation/qa.md](../production/evaluation/qa.md)
