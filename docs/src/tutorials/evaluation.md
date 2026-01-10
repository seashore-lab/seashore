# Evaluation Tutorial

This tutorial demonstrates how to evaluate your AI agents using Seashore's evaluation framework. Evaluation helps you measure agent performance, identify issues, and improve quality before deployment.

## What You'll Learn

- How to create test cases for evaluation
- Using built-in metrics (relevance, coherence)
- Creating custom evaluation metrics
- Running batch evaluations
- Analyzing evaluation results

## Prerequisites

Before starting this tutorial, make sure you have:

- Node.js 18+ installed
- pnpm installed
- An OpenAI API key:
  ```bash
  export OPENAI_API_KEY=your_api_key_here
  ```

## Step 1: Import Required Packages

```typescript
import 'dotenv/config';
import {
  createEvaluator,
  evaluateBatch,
  relevanceMetric,
  coherenceMetric,
  customMetric,
  type TestCase,
} from '@seashore/evaluation';
import { createAgent } from '@seashore/agent';
import { openaiText } from '@seashore/llm';
```

## Step 2: Create Agents for Evaluation

Create two agents: one to evaluate, and a more capable one for evaluation:

```typescript
// The agent being evaluated
const agent = createAgent({
  name: 'qa-agent',
  model: openaiText('gpt-4.1', {
    baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY,
  }),
  systemPrompt: `You are a helpful assistant that provides concise and accurate answers to user questions.
Your answer should be short (around 200 characters) and to the point.`,
});

// A separate, more capable agent for evaluation
const evaluatorAgent = createAgent({
  name: 'evaluator-agent',
  model: openaiText('gpt-5.1', {
    baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY,
  }),
  systemPrompt: `You are a helpful assistant that evaluates answers.`,
});
```

**Why use a separate evaluator?**
Using a different (usually more capable) model for evaluation ensures objective and accurate assessment of the agent's outputs.

## Step 3: Define Test Cases

Create test cases with inputs and reference answers:

```typescript
const testCases: TestCase[] = [
  {
    id: 'q1',
    input: 'What is TypeScript?',
    reference: 'TypeScript is a superset of JavaScript that adds static typing.',
  },
  {
    id: 'q2',
    input: 'What are the main features of React?',
    reference:
      'React is a JavaScript library for building user interfaces, with main features including component-based architecture, virtual DOM, and one-way data flow.',
  },
  {
    id: 'q3',
    input: 'What is Node.js suitable for?',
    reference:
      'Node.js is suitable for building high-concurrency network applications, API services, real-time applications (such as chat), and utility scripts.',
  },
];
```

**Test Case Structure:**

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique identifier |
| `input` | string | User input/question |
| `output` | string | Agent's response (filled during evaluation) |
| `reference` | string | Expected/correct answer |

## Step 4: Generate Agent Responses

Run the agent on each test case to generate responses:

```typescript
for (const testCase of testCases) {
  console.log(`Question: ${testCase.input}`);
  const result = await agent.run(testCase.input);
  testCase.output = result.content;
  console.log(`Answer: ${result.content}`);
  console.log(`Reference: ${testCase.reference}\n`);
}
```

## Step 5: Define Evaluation Metrics

Create metrics for evaluation:

```typescript
const metrics = [
  // Built-in relevance metric
  relevanceMetric({
    threshold: 0.7,
    weight: 1.0,
  }),

  // Built-in coherence metric
  coherenceMetric({
    threshold: 0.6,
    weight: 0.8,
  }),

  // Custom metric for length checking
  customMetric({
    name: 'length_check',
    description: 'Check if the answer length is reasonable (100-500 characters)',
    type: 'rule', // Rule-based metric
    threshold: 0.8,
    evaluate: (_input: string, output: string) => {
      const len = output.length;
      const passed = len >= 100 && len <= 500;
      return {
        score: passed ? 1.0 : 0.5,
        reason: passed
          ? 'Length is appropriate'
          : `Length is not appropriate: ${len} characters`,
      };
    },
  }),
];
```

**Metric Types:**

| Type | Description | Example |
|------|-------------|---------|
| `rule` | Rule-based, deterministic | Length check, keyword matching |
| `llm` | LLM-based, semantic | Relevance, coherence, quality |

**Built-in Metrics:**

| Metric | Type | What It Measures |
|--------|------|------------------|
| `relevanceMetric` | LLM | How relevant the answer is to the question |
| `coherenceMetric` | LLM | How coherent and well-formed the answer is |
| `accuracyMetric` | LLM | Factual correctness |
| `lengthLimitMetric` | Rule | Adherence to length constraints |

## Step 6: Create the Evaluator

Initialize the evaluator with metrics and LLM adapter:

```typescript
const evaluator = createEvaluator({
  metrics,
  llmAdapter: {
    async generate(prompt) {
      const result = await evaluatorAgent.run(prompt);
      return result.content;
    },
  },
  concurrency: 2, // Number of parallel evaluations
});
```

## Step 7: Run the Evaluation

Execute batch evaluation with progress tracking:

```typescript
const batchResult = await evaluateBatch({
  evaluator,
  testCases,
  onProgress: (completed, total) => {
    console.log(`Progress: ${completed}/${total}`);
  },
});
```

## Step 8: Display Results

Analyze and display evaluation results:

```typescript
// Individual test case results
batchResult.results.forEach((result, index) => {
  console.log(`Test Case ${index + 1}:`);
  console.log(`   Input: ${result.input.slice(0, 40)}...`);
  console.log(`   Overall Score: ${(result.overallScore * 100).toFixed(1)}%`);
  console.log(`   All Passed: ${result.passed ? 'Yes' : 'No'}`);
  console.log('   Metric Details:');
  result.details.forEach((detail) => {
    const status = detail.passed ? 'PASS' : 'FAIL';
    console.log(`      ${status} ${detail.metric}: ${(detail.score * 100).toFixed(1)}%`);
    if (detail.reason) {
      console.log(`         Reason: ${detail.reason}`);
    }
  });
});

// Summary statistics
console.log('--- Summary ---');
console.log(`Total Tests: ${batchResult.results.length}`);
console.log(`Passed: ${batchResult.passedCount}`);
console.log(`Failed: ${batchResult.failedCount}`);
console.log(`Pass Rate: ${(batchResult.passRate * 100).toFixed(1)}%`);
console.log(`Average Score: ${(batchResult.overallAverage * 100).toFixed(1)}%`);
console.log(`Duration: ${batchResult.durationMs}ms`);
```

## Running the Example

```bash
cd D:\Projects\seashore\examples
pnpm run 08-evaluation-qa
```

**Expected Output:**

```
[Example 08: Evaluation QA]

Number of test cases: 3

--- Generating Answers ---

Question: What is TypeScript?
Answer: TypeScript is a superset of JavaScript that adds static typing and other features...
Reference: TypeScript is a superset of JavaScript that adds static typing.

--- Starting Evaluation ---

Progress: 1/3
Progress: 2/3
Progress: 3/3

--- Evaluation Results ---

Test Case 1:
   Input: What is TypeScript?...
   Overall Score: 100.0%
   All Passed: Yes
   Metric Details:
      PASS relevance: 100.0%
      PASS coherence: 100.0%
      PASS length_check: 100.0%

--- Summary ---

Total Tests: 3
Passed: 3
Failed: 0
Pass Rate: 100.0%
Average Score: 100.0%
Duration: 7971ms
```

## Source Code

The complete source code for this example is available at:
[`examples/src/08-evaluation-qa.ts`](https://github.com/seahorse/seashore/blob/main/examples/src/08-evaluation-qa.ts)

## Key Concepts

### Evaluation Workflow

```
Test Cases → Agent → Outputs → Evaluator → Metrics → Results
```

### Metric Scoring

All metrics return a score between 0 and 1:

| Score Range | Interpretation |
|-------------|----------------|
| 0.9 - 1.0 | Excellent |
| 0.7 - 0.9 | Good |
| 0.5 - 0.7 | Fair |
| 0.0 - 0.5 | Poor |

### Weights and Thresholds

- **Weight**: Importance multiplier for overall score (default: 1.0)
- **Threshold**: Minimum score to pass (default: 0.7)

## Extensions

### Custom LLM-Based Metrics

Create semantic evaluation metrics:

```typescript
const helpfulnessMetric = customMetric({
  name: 'helpfulness',
  description: 'How helpful the answer is',
  type: 'llm',
  threshold: 0.7,
  evaluate: async (input: string, output: string, reference?: string) => {
    const prompt = `Rate the helpfulness of this answer (0-1):

Question: ${input}
Answer: ${output}

Provide only a number between 0 and 1.`;

    const result = await evaluatorAgent.run(prompt);
    const score = parseFloat(result.content) || 0.5;

    return {
      score,
      reason: score > 0.7 ? 'Very helpful' : 'Could be more helpful',
    };
  },
});
```

### Dataset-Based Evaluation

Load test cases from external datasets:

```typescript
import { createFileLoader } from '@seashore/rag';

async function loadTestCases(datasetPath: string): Promise<TestCase[]> {
  const loader = createFileLoader(datasetPath);
  const content = await loader.load();

  return JSON.parse(content[0].content);
}

const testCases = await loadTestCases('./datasets/qa-dataset.json');
```

### Comparative Evaluation

Compare multiple agents:

```typescript
const agents = {
  'gpt-4': createAgent({ model: openaiText('gpt-4', {...}) }),
  'gpt-4-turbo': createAgent({ model: openaiText('gpt-4-turbo', {...}) }),
};

for (const [name, agent] of Object.entries(agents)) {
  const results = await evaluateAgent(agent, testCases, metrics);
  console.log(`${name}: ${results.averageScore}`);
}
```

### Evaluation for RAG Systems

Evaluate retrieval-augmented generation:

```typescript
const ragMetrics = [
  customMetric({
    name: 'context_relevance',
    description: 'Is the retrieved context relevant to the query?',
    type: 'llm',
    threshold: 0.7,
    evaluate: async (input, output, reference, context) => {
      const retrieved = context?.retrievedDocs || [];
      // Evaluate relevance of retrieved documents
    },
  }),
  customMetric({
    name: 'answer_faithfulness',
    description: 'Is the answer faithful to the retrieved context?',
    type: 'llm',
    threshold: 0.7,
    evaluate: async (input, output, reference, context) => {
      // Check if answer is supported by retrieved context
    },
  }),
];
```

## Best Practices

1. **Use diverse test cases** - Cover edge cases and common scenarios
2. **Include references** - Provide expected answers when possible
3. **Balance metric types** - Mix rule-based and LLM-based metrics
4. **Set appropriate thresholds** - Adjust based on your requirements
5. **Track over time** - Monitor for regression as you make changes

## Next Steps

- Add **observability** to track evaluation metrics in the [Observability Tutorial](./observability.md)
- Learn about **deployment** for production monitoring in the [Deployment Tutorial](./deployment.md)
- Explore **security guardrails** to protect against misuse in the [Security Tutorial](./security-guardrails.md)
