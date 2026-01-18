/**
 * Example 08 - Evaluation QA
 *
 * This example demonstrates how to evaluate a QA agent using Seashore's evaluation framework.
 */

import 'dotenv/config';
import {
  createEvaluator,
  evaluateBatch,
  relevanceMetric,
  coherenceMetric,
  customMetric,
  type TestCase,
} from '@seashorelab/evaluation';
import { createAgent } from '@seashorelab/agent';
import { openaiText } from '@seashorelab/llm';

async function main() {
  console.log('[📊 Example 08: Evaluation QA]\n');

  // Create the agent to be evaluated
  const agent = createAgent({
    name: 'qa-agent',
    model: openaiText('gpt-4.1', {
      baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY,
    }),
    systemPrompt: `You are a helpful assistant that provides concise and accurate answers to user questions.
Your answer should be short (around 200 characters) and to the point.`,
  });

  // Create a separate, more powerful agent for LLM-based metrics evaluation
  // Use a different (usually more capable) model for evaluation to ensure objective and accurate assessment of the agent's outputs
  const evaluatorAgent = createAgent({
    name: 'evaluator-agent',
    model: openaiText('gpt-5.1', {
      baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY,
    }),
    systemPrompt: `You are a helpful assistant that evaluates answers.`,
  });

  // Define test cases
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

  console.log(`📋 Number of test cases: ${testCases.length}\n`);

  // Run the agent on each test case to generate answers for all test cases and store the outputs.
  console.log('--- Generating Answers ---\n');
  for (const testCase of testCases) {
    console.log(`📝 Question: ${testCase.input}`);
    const result = await agent.run(testCase.input);
    testCase.output = result.content;
    console.log(`🤖 Answer: ${result.content}`);
    console.log(`📖 Reference: ${testCase.reference}\n`);
  }

  // Define evaluation metrics.
  // There are two types of metrics: Rule-based and LLM-based.
  // Rule-based metrics use predefined rules to evaluate the output.
  // LLM-based metrics use a language model to evaluate the output.
  const metrics = [
    // Seashore has built-in metrics for common evaluation needs.
    // Relevance: whether the answer is relevant to the question
    relevanceMetric({
      threshold: 0.7,
      weight: 1.0,
    }),
    // Coherence: whether the answer is coherent and well-formed
    coherenceMetric({
      threshold: 0.6,
      weight: 0.8,
    }),
    // You can also define custom metrics as needed.
    customMetric({
      name: 'length_check',
      description: 'Check if the answer length is reasonable (100-500 characters)',
      type: 'rule', // This is a rule-based metric
      threshold: 0.8,
      evaluate: (_input: string, output: string) => {
        const len = output.length;
        const passed = len >= 100 && len <= 500;
        return {
          score: passed ? 1.0 : 0.5,
          reason: passed ? 'Length is appropriate' : `Length is not appropriate: ${len} characters`,
        };
      },
    }),
  ];

  // Create the evaluator
  const evaluator = createEvaluator({
    metrics,
    // Use the separate evaluator model (not the agent being evaluated)
    llmAdapter: {
      async generate(prompt) {
        const result = await evaluatorAgent.run(prompt);
        return result.content;
      },
    },
    concurrency: 2,
  });

  // Run the evaluation
  console.log('--- Starting Evaluation ---\n');
  const batchResult = await evaluateBatch({
    evaluator,
    testCases,
    onProgress: (completed, total) => {
      console.log(`   Progress: ${completed}/${total}`);
    },
  });

  // Display evaluation results
  console.log('--- Evaluation Results ---\n');

  batchResult.results.forEach((result, index) => {
    console.log(`📋 Test Case ${index + 1}:`);
    console.log(`   Input: ${result.input.slice(0, 40)}...`);
    console.log(`   Overall Score: ${(result.overallScore * 100).toFixed(1)}%`);
    console.log(`   All Passed: ${result.passed ? '✅' : '❌'}`);
    console.log('   Metric Details:');
    result.details.forEach((detail) => {
      const status = detail.passed ? '✅' : '❌';
      console.log(`      ${status} ${detail.metric}: ${(detail.score * 100).toFixed(1)}%`);
      if (detail.reason) {
        console.log(`         Reason: ${detail.reason}`);
      }
    });
    console.log();
  });

  // Summary statistics
  console.log('--- Summary Statistics ---\n');
  console.log(`📊 Total Tests: ${batchResult.results.length}`);
  console.log(`✅ Passed: ${batchResult.passedCount}`);
  console.log(`❌ Failed: ${batchResult.failedCount}`);
  console.log(`📈 Pass Rate: ${(batchResult.passRate * 100).toFixed(1)}%`);
  console.log(`📈 Average Score: ${(batchResult.overallAverage * 100).toFixed(1)}%`);
  console.log(`⏱️ Duration: ${batchResult.durationMs}ms`);

  console.log('\n--- Evaluation Completed ---');
}

main().catch(console.error);

// [📊 Example 08: Evaluation QA]

// 📋 Number of test cases: 3

// --- Generating Answers ---

// 📝 Question: What is TypeScript?
// 🤖 Answer: TypeScript is a superset of JavaScript that adds static typing and other features, helping developers catch errors early and write more maintainable code. It compiles to plain JavaScript.
// 📖 Reference: TypeScript is a superset of JavaScript that adds static typing.

// 📝 Question: What are the main features of React?
// 🤖 Answer: React’s main features include:

// 1. Component-based architecture
// 2. Virtual DOM for fast updates
// 3. One-way data binding
// 4. JSX syntax
// 5. Reusable components
// 6. Strong community support
// 📖 Reference: React is a JavaScript library for building user interfaces, with main features including component-based architecture, virtual DOM, and one-way data flow.

// 📝 Question: What is Node.js suitable for?
// 🤖 Answer: Node.js is suitable for building scalable web applications, APIs, real-time apps (like chat), microservices, and tools requiring non-blocking I/O, thanks to its event-driven, asynchronous architecture.
// 📖 Reference: Node.js is suitable for building high-concurrency network applications, API services, real-time applications (such as chat), and utility scripts.

// --- Starting Evaluation ---

//    Progress: 1/3
//    Progress: 2/3
//    Progress: 3/3
// --- Evaluation Results ---

// 📋 Test Case 1:
//    Input: What is TypeScript?...
//    Overall Score: 100.0%
//    All Passed: ✅
//    Metric Details:
//       ✅ relevance: 100.0%
//          Reason: The response directly and accurately defines TypeScript as a superset of JavaScript with static typing that compiles to JavaScript, fully answering the question.
//       ✅ coherence: 100.0%
//          Reason: The response is concise, logically organized, grammatically correct, and easy to understand. It clearly explains what TypeScript is and how it relates to JavaScript without any awkward phrasing or ambiguity.
//       ✅ length_check: 100.0%
//          Reason: Length is appropriate

// 📋 Test Case 2:
//    Input: What are the main features of React?...
//    Overall Score: 100.0%
//    All Passed: ✅
//    Metric Details:
//       ✅ relevance: 100.0%
//          Reason: The response directly lists and accurately describes several main features of React (component-based architecture, virtual DOM, one-way data binding, JSX, reusability, community), which is exactly what the question asks for.
//       ✅ coherence: 100.0%
//          Reason: The response is concise, clearly structured as a numbered list, grammatically correct, and easy to read. The logical flow is straightforward and the language is fluent, making it highly coherent and well-written for its purpose.
//       ✅ length_check: 100.0%
//          Reason: Length is appropriate

// 📋 Test Case 3:
//    Input: What is Node.js suitable for?...
//    Overall Score: 100.0%
//    All Passed: ✅
//    Metric Details:
//       ✅ relevance: 100.0%
//          Reason: The response directly and accurately answers what Node.js is suitable for, listing appropriate use cases (scalable web apps, APIs, real-time apps, microservices, non-blocking I/O tools) and briefly explaining why (event-driven, asynchronous architecture).
//       ✅ coherence: 100.0%
//          Reason: The response is clear, concise, and grammatically correct. It has a logical flow, explicitly states use cases for Node.js, and briefly explains the underlying reason (event-driven, asynchronous architecture). The sentence is easy to read and well-structured.
//       ✅ length_check: 100.0%
//          Reason: Length is appropriate

// --- Summary Statistics ---

// 📊 Total Tests: 3
// ✅ Passed: 3
// ❌ Failed: 0
// 📈 Pass Rate: 100.0%
// 📈 Average Score: 100.0%
// ⏱️ Duration: 7971ms

// --- Evaluation Completed ---
