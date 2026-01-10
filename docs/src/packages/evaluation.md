# @seashore/evaluation

Agent output evaluation with rule-based and LLM-based metrics.

## Installation

```bash
pnpm add @seashore/evaluation
```

Required peer dependencies:
```bash
pnpm add @seashore/llm
```

## Overview

`@seashore/evaluation` provides:

- Built-in evaluation metrics (relevance, faithfulness, coherence, harmfulness)
- Custom metric creation
- Dataset management
- Batch evaluation
- Report generation (HTML, JSON, Markdown)

## Quick Start

### Creating an Evaluator

```typescript
import {
  createEvaluator,
  relevanceMetric,
  faithfulnessMetric,
} from '@seashore/evaluation'
import { openaiText } from '@seashore/llm'

const evaluator = createEvaluator({
  llmAdapter: openaiText('gpt-4o'),
  metrics: [
    relevanceMetric({ threshold: 0.7 }),
    faithfulnessMetric({ threshold: 0.8 }),
    coherenceMetric({ threshold: 0.7 }),
  ],
  concurrency: 5,
  retries: 2,
})
```

### Single Evaluation

```typescript
import { evaluate } from '@seashore/evaluation'

const result = await evaluate({
  evaluator,
  input: 'What is TypeScript?',
  output: 'TypeScript is a typed superset of JavaScript...',
  reference: 'TypeScript is a programming language by Microsoft...',
})

console.log('Scores:', result.scores)
// { relevance: 0.85, faithfulness: 0.92, coherence: 0.88 }

console.log('Overall:', result.overallScore) // 0.883
console.log('Passed:', result.passed) // true
```

## API Reference

### createEvaluator

Creates an evaluator instance.

```typescript
function createEvaluator(config: EvaluatorConfig): Evaluator
```

#### Configuration

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `llmAdapter` | `TextAdapter` | Yes | For LLM-based metrics |
| `metrics` | `Metric[]` | Yes | Evaluation metrics |
| `concurrency` | `number` | No | Parallel evaluations (default: 5) |
| `retries` | `number` | No | Retry attempts (default: 2) |
| `timeout` | `number` | No | Timeout per evaluation (ms) |

### Evaluation Methods

#### evaluate()

```typescript
const result = await evaluate({
  evaluator,
  input: string,
  output: string,
  reference?: string,
  context?: string[],
})
```

Returns:
```typescript
interface EvaluationResult {
  scores: Record<string, number>
  overallScore: number
  passed: boolean
  details: Array<{
    metric: string
    score: number
    passed: boolean
    reason?: string
    threshold: number
  }>
  input: string
  output: string
  reference?: string
  evaluatedAt: Date
  durationMs: number
}
```

#### evaluateBatch()

```typescript
const results = await evaluateBatch({
  evaluator,
  testCases: [
    {
      input: 'What is React?',
      output: 'React is a JavaScript library...',
      reference: 'React is a UI library...',
    },
    // ... more cases
  ],
  onProgress: (completed, total) => {
    console.log(`Progress: ${completed}/${total}`)
  },
})
```

Returns:
```typescript
interface BatchEvaluationResult {
  results: EvaluationResult[]
  averageScores: Record<string, number>
  overallAverage: number
  passRate: number
  passedCount: number
  failedCount: number
  durationMs: number
}
```

## Built-in Metrics

### relevanceMetric

Evaluates output relevance to the input.

```typescript
import { relevanceMetric } from '@seashore/evaluation'

const metric = relevanceMetric({
  threshold: 0.7,
  weight: 1.0,
  prompt: `Evaluate relevance:
Input: {input}
Output: {output}
Score:`,
})
```

### faithfulnessMetric

Evaluates if output is faithful to context (no hallucinations).

```typescript
import { faithfulnessMetric } from '@seashore/evaluation'

const metric = faithfulnessMetric({
  threshold: 0.8,
  requireContext: true,
})

// Usage requires context
await evaluate({
  evaluator,
  input: 'What is the capital of France?',
  output: 'The capital is Paris.',
  context: ['Paris is the capital of France.'],
})
```

### coherenceMetric

Evaluates output coherence and flow.

```typescript
import { coherenceMetric } from '@seashore/evaluation'

const metric = coherenceMetric({
  threshold: 0.7,
})
```

### harmfulnessMetric

Detects harmful content.

```typescript
import { harmfulnessMetric } from '@seashore/evaluation'

const metric = harmfulnessMetric({
  threshold: 0.1, // Lower is better
  categories: [
    'hate_speech',
    'violence',
    'sexual_content',
    'self_harm',
    'misinformation',
  ],
})
```

## Custom Metrics

### Rule-Based Metric

```typescript
import { customMetric } from '@seashore/evaluation'

const lengthMetric = customMetric({
  name: 'response_length',
  description: 'Check response length',
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

### LLM-Based Metric

```typescript
import { customMetric } from '@seashore/evaluation'

const technicalAccuracyMetric = customMetric({
  name: 'technical_accuracy',
  description: 'Evaluate technical accuracy',
  type: 'llm',
  threshold: 0.8,

  prompt: `As a technical expert, evaluate accuracy:
Input: {input}
Output: {output}
Reference: {reference}

Return JSON: {"score": 0.X, "reason": "..."}`,

  parseResponse: (response) => {
    const parsed = JSON.parse(response)
    return { score: parsed.score, reason: parsed.reason }
  },
})
```

## Datasets

### createDataset

```typescript
import { createDataset } from '@seashore/evaluation'

const dataset = createDataset({
  name: 'qa-test-cases',
  description: 'Question-answering tests',
  testCases: [
    {
      id: 'test-1',
      input: 'What is TypeScript?',
      reference: 'TypeScript is a typed superset...',
      context: ['Documentation excerpt...'],
      metadata: { category: 'programming', difficulty: 'easy' },
    },
  ],
})

// Save dataset
await dataset.save('./datasets/qa-tests.json')
```

### loadDataset

```typescript
import { loadDataset } from '@seashore/evaluation'

// Load from file
const dataset = await loadDataset('./datasets/qa-tests.json')

// Load from URL
const remoteDataset = await loadDataset('https://example.com/dataset.json')
```

### Dataset Operations

```typescript
// Filter
const easyTests = dataset.filter((tc) => tc.metadata?.difficulty === 'easy')

// Sample
const sample = dataset.sample(10)

// Split
const [train, test] = dataset.split(0.8)

// Iterate
for (const testCase of dataset) {
  console.log(testCase.input)
}
```

## Evaluating Agents

### End-to-End Evaluation

```typescript
import { createAgent } from '@seashore/agent'
import { evaluateBatch, loadDataset } from '@seashore/evaluation'

// Create agent
const agent = createAgent({
  name: 'qa-agent',
  adapter: openaiText('gpt-4o'),
  systemPrompt: 'You are helpful.',
})

// Load test set
const dataset = await loadDataset('./datasets/qa-tests.json')

// Generate outputs
const testCases = await Promise.all(
  dataset.testCases.map(async (tc) => {
    const result = await agent.run({
      messages: [{ role: 'user', content: tc.input }],
    })
    return { ...tc, output: result.content }
  })
)

// Evaluate
const evaluator = createEvaluator({
  llmAdapter: openaiText('gpt-4o'),
  metrics: [relevanceMetric(), coherenceMetric()],
})

const results = await evaluateBatch({ evaluator, testCases })

console.log('Pass rate:', results.passRate)
console.log('Average relevance:', results.averageScores.relevance)
```

## Report Generation

### generateReport

```typescript
import { generateReport } from '@seashore/evaluation'

const report = await generateReport({
  results: evaluationResults,
  format: 'html', // 'html' | 'json' | 'markdown'
  outputPath: './reports/evaluation-report.html',
  options: {
    includeFailedCases: true,
    includeScoreDistribution: true,
    includeMetricBreakdown: true,
  },
})
```

### Report Structure

```typescript
interface EvaluationReport {
  summary: {
    totalCases: number
    passedCases: number
    failedCases: number
    passRate: number
    averageScore: number
    evaluatedAt: Date
    durationMs: number
  }

  metricStats: Record<string, {
    average: number
    min: number
    max: number
    stdDev: number
    passRate: number
  }>

  failedCases: Array<{
    testCase: TestCase
    result: EvaluationResult
    failedMetrics: string[]
  }>

  scoreDistribution: {
    buckets: number[]
    counts: number[]
  }
}
```

## Type Definitions

### Metric

```typescript
interface Metric {
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

interface MetricResult {
  score: number // 0-1
  passed: boolean
  reason?: string
}
```

### TestCase

```typescript
interface TestCase {
  id?: string
  input: string
  output?: string
  reference?: string
  context?: string[]
  metadata?: Record<string, unknown>
}
```

### Dataset

```typescript
interface Dataset {
  name: string
  description?: string
  testCases: TestCase[]

  filter(predicate: (tc: TestCase) => boolean): Dataset
  sample(n: number): Dataset
  split(ratio: number): [Dataset, Dataset]
  save(path: string): Promise<void>

  [Symbol.iterator](): Iterator<TestCase>
}
```

## Best Practices

1. **Use multiple metrics** for comprehensive evaluation
2. **Set appropriate thresholds** based on your use case
3. **Include diverse test cases** covering edge cases
4. **Use reference answers** when available
5. **Regularly re-evaluate** as models change

## See Also

- [Agent Package](agent.md)
- [LLM Package](llm.md)
- [Testing Guide](../guides/testing.md)
