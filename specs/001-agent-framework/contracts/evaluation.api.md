# API Contract: @seashore/evaluation

**Package**: `@seashore/evaluation`  
**Version**: 0.1.0

## 概述

Evaluation 模块提供 Agent 输出评估能力，支持基于规则和基于 LLM 的评估指标。

---

## 导出

```typescript
// 评估器
export { createEvaluator, type Evaluator, type EvaluatorConfig } from './evaluator'

// 评估运行
export { evaluate, evaluateBatch, type EvaluationResult } from './evaluate'

// 内置指标
export {
  relevanceMetric,
  faithfulnessMetric,
  coherenceMetric,
  harmfulnessMetric,
  customMetric,
  type Metric,
} from './metrics'

// 数据集
export { createDataset, loadDataset, type Dataset, type TestCase } from './dataset'

// 报告
export { generateReport, type EvaluationReport } from './report'

// 类型
export type { MetricResult, EvaluationRun } from './types'
```

---

## 评估器

### createEvaluator

```typescript
import {
  createEvaluator,
  relevanceMetric,
  faithfulnessMetric,
} from '@seashore/evaluation'
import { openaiText } from '@seashore/llm'

const evaluator = createEvaluator({
  // 用于 LLM-based 评估的适配器
  llmAdapter: openaiText('gpt-4o'),

  // 评估指标
  metrics: [relevanceMetric(), faithfulnessMetric(), coherenceMetric()],

  // 并发配置
  concurrency: 5,

  // 重试配置
  retries: 2,
})
```

---

## 单次评估

### evaluate

```typescript
import { evaluate } from '@seashore/evaluation'

const result = await evaluate({
  evaluator,

  // 输入
  input: '什么是 TypeScript？',

  // Agent 输出
  output: 'TypeScript 是 JavaScript 的超集，添加了静态类型...',

  // 可选：参考答案
  reference: 'TypeScript 是一种由微软开发的编程语言...',

  // 可选：上下文（用于 faithfulness 评估）
  context: [
    'TypeScript is a programming language developed by Microsoft.',
    'It is a strict syntactical superset of JavaScript.',
  ],
})

console.log('Scores:', result.scores)
// { relevance: 0.85, faithfulness: 0.92, coherence: 0.88 }

console.log('Overall:', result.overallScore)
// 0.883

console.log('Passed:', result.passed)
// true (if all metrics above threshold)
```

### 评估结果

```typescript
interface EvaluationResult {
  // 各指标分数
  scores: Record<string, number>

  // 综合分数
  overallScore: number

  // 是否通过
  passed: boolean

  // 各指标详情
  details: Array<{
    metric: string
    score: number
    passed: boolean
    reason?: string // LLM 评估的解释
    threshold: number
  }>

  // 元数据
  input: string
  output: string
  reference?: string
  evaluatedAt: Date
  durationMs: number
}
```

---

## 批量评估

### evaluateBatch

```typescript
import { evaluateBatch } from '@seashore/evaluation'

const results = await evaluateBatch({
  evaluator,

  testCases: [
    {
      input: '什么是 React？',
      output: 'React 是一个用于构建用户界面的 JavaScript 库...',
      reference: 'React is a JavaScript library for building UIs...',
    },
    {
      input: '什么是 Vue？',
      output: 'Vue 是一个渐进式 JavaScript 框架...',
      reference: 'Vue is a progressive JavaScript framework...',
    },
  ],

  // 进度回调
  onProgress: (completed, total) => {
    console.log(`Progress: ${completed}/${total}`)
  },
})

console.log('Average scores:', results.averageScores)
console.log('Pass rate:', results.passRate)
```

---

## 内置指标

### relevanceMetric

评估输出与问题的相关性：

```typescript
import { relevanceMetric } from '@seashore/evaluation'

const metric = relevanceMetric({
  threshold: 0.7, // 通过阈值
  weight: 1.0, // 权重（用于综合分数）

  // 可选：自定义提示词
  prompt: `评估以下回答对问题的相关性，给出 0-1 的分数：
问题: {input}
回答: {output}
分数:`,
})
```

### faithfulnessMetric

评估输出是否忠于提供的上下文（无幻觉）：

```typescript
import { faithfulnessMetric } from '@seashore/evaluation'

const metric = faithfulnessMetric({
  threshold: 0.8,

  // 需要提供 context
  requireContext: true,
})

// 使用
await evaluate({
  evaluator,
  input: 'What is the capital of France?',
  output: 'The capital of France is Paris.',
  context: ['Paris is the capital city of France.'],
})
```

### coherenceMetric

评估输出的连贯性和流畅性：

```typescript
import { coherenceMetric } from '@seashore/evaluation'

const metric = coherenceMetric({
  threshold: 0.7,
})
```

### harmfulnessMetric

检测输出中的有害内容：

```typescript
import { harmfulnessMetric } from '@seashore/evaluation'

const metric = harmfulnessMetric({
  threshold: 0.1, // 低于此值才通过

  categories: [
    'hate_speech',
    'violence',
    'sexual_content',
    'self_harm',
    'misinformation',
  ],
})
```

### customMetric

创建自定义指标：

```typescript
import { customMetric } from '@seashore/evaluation'

// LLM-based 自定义指标
const technicalAccuracyMetric = customMetric({
  name: 'technical_accuracy',
  description: '评估技术内容的准确性',
  type: 'llm',
  threshold: 0.8,

  prompt: `作为技术专家，评估以下回答的技术准确性。
问题: {input}
回答: {output}
参考: {reference}

给出 0-1 的分数，并解释原因。
格式: {"score": 0.X, "reason": "..."}`,

  parseResponse: (response) => {
    const parsed = JSON.parse(response)
    return { score: parsed.score, reason: parsed.reason }
  },
})

// Rule-based 自定义指标
const lengthMetric = customMetric({
  name: 'response_length',
  description: '检查回答长度',
  type: 'rule',
  threshold: 1.0,

  evaluate: (input, output) => {
    const wordCount = output.split(/\s+/).length
    const passed = wordCount >= 50 && wordCount <= 500
    return {
      score: passed ? 1.0 : 0.0,
      reason: `Word count: ${wordCount}`,
    }
  },
})
```

---

## 数据集

### createDataset

```typescript
import { createDataset } from '@seashore/evaluation'

const dataset = createDataset({
  name: 'qa-test-cases',
  description: 'Question-answering test cases',

  testCases: [
    {
      id: 'test-1',
      input: 'What is TypeScript?',
      reference: 'TypeScript is a typed superset of JavaScript...',
      context: ['TypeScript documentation excerpt...'],
      metadata: { category: 'programming', difficulty: 'easy' },
    },
    // ... more test cases
  ],
})

// 保存数据集
await dataset.save('./datasets/qa-tests.json')
```

### loadDataset

```typescript
import { loadDataset } from '@seashore/evaluation'

// 从文件加载
const dataset = await loadDataset('./datasets/qa-tests.json')

// 从 URL 加载
const remoteDataset = await loadDataset('https://example.com/dataset.json')

console.log('Test cases:', dataset.testCases.length)
```

### 数据集操作

```typescript
// 过滤
const easyTests = dataset.filter((tc) => tc.metadata?.difficulty === 'easy')

// 采样
const sample = dataset.sample(10)

// 分割
const [train, test] = dataset.split(0.8)

// 迭代
for (const testCase of dataset) {
  console.log(testCase.input)
}
```

---

## 评估 Agent

### 端到端评估

```typescript
import { createAgent } from '@seashore/agent'
import { createEvaluator, evaluateBatch, loadDataset } from '@seashore/evaluation'

// 创建 Agent
const agent = createAgent({
  name: 'qa-agent',
  adapter: openaiText('gpt-4o'),
  systemPrompt: 'You are a helpful assistant.',
})

// 加载测试集
const dataset = await loadDataset('./datasets/qa-tests.json')

// 生成 Agent 输出
const testCases = await Promise.all(
  dataset.testCases.map(async (tc) => {
    const result = await agent.run({
      messages: [{ role: 'user', content: tc.input }],
    })
    return {
      ...tc,
      output: result.content,
    }
  })
)

// 评估
const evaluator = createEvaluator({
  llmAdapter: openaiText('gpt-4o'),
  metrics: [relevanceMetric(), coherenceMetric()],
})

const results = await evaluateBatch({ evaluator, testCases })

console.log('Pass rate:', results.passRate)
console.log('Average relevance:', results.averageScores.relevance)
```

---

## 报告生成

### generateReport

```typescript
import { generateReport } from '@seashore/evaluation'

const report = await generateReport({
  results: evaluationResults,

  format: 'html', // 'html' | 'json' | 'markdown'

  // 输出路径
  outputPath: './reports/evaluation-report.html',

  // 报告配置
  options: {
    includeFailedCases: true,
    includeScoreDistribution: true,
    includeMetricBreakdown: true,
  },
})

console.log('Report saved to:', report.path)
```

### 报告内容

```typescript
interface EvaluationReport {
  // 摘要
  summary: {
    totalCases: number
    passedCases: number
    failedCases: number
    passRate: number
    averageScore: number
    evaluatedAt: Date
    durationMs: number
  }

  // 各指标统计
  metricStats: Record<
    string,
    {
      average: number
      min: number
      max: number
      stdDev: number
      passRate: number
    }
  >

  // 失败案例
  failedCases: Array<{
    testCase: TestCase
    result: EvaluationResult
    failedMetrics: string[]
  }>

  // 分数分布
  scoreDistribution: {
    buckets: number[]
    counts: number[]
  }
}
```

---

## 类型定义

```typescript
export interface Metric {
  name: string
  description: string
  type: 'llm' | 'rule'
  threshold: number
  weight: number

  evaluate(
    input: string,
    output: string,
    options: {
      reference?: string
      context?: string[]
      llmAdapter?: TextAdapter
    }
  ): Promise<MetricResult>
}

export interface MetricResult {
  score: number // 0-1
  passed: boolean
  reason?: string
}

export interface TestCase {
  id?: string
  input: string
  output?: string // 如果已有输出
  reference?: string // 参考答案
  context?: string[] // 上下文文档
  metadata?: Record<string, unknown>
}

export interface Dataset {
  name: string
  description?: string
  testCases: TestCase[]

  filter(predicate: (tc: TestCase) => boolean): Dataset
  sample(n: number): Dataset
  split(ratio: number): [Dataset, Dataset]
  save(path: string): Promise<void>

  [Symbol.iterator](): Iterator<TestCase>
}

export interface EvaluatorConfig {
  llmAdapter: TextAdapter
  metrics: Metric[]
  concurrency?: number
  retries?: number
  timeout?: number
}

export interface Evaluator {
  evaluate(testCase: TestCase): Promise<EvaluationResult>
  evaluateBatch(testCases: TestCase[]): Promise<BatchEvaluationResult>
}

export interface BatchEvaluationResult {
  results: EvaluationResult[]
  averageScores: Record<string, number>
  overallAverage: number
  passRate: number
  passedCount: number
  failedCount: number
  durationMs: number
}
```
