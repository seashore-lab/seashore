/**
 * Example 09 - Observability Tracing
 */

import 'dotenv/config';
import {
  createLogger,
  createTracer,
  createTokenCounter,
  createConsoleExporter,
} from '@seashorelab/observability';
import { createAgent } from '@seashorelab/agent';
import { openaiText } from '@seashorelab/llm';
import { defineTool } from '@seashorelab/tool';
import { z } from 'zod';

// Create a simple calculator tool
const calculatorTool = defineTool({
  name: 'calculator',
  description: 'Perform mathematical calculations',
  inputSchema: z.object({
    expression: z.string().describe('Mathematical expression'),
  }),
  execute: async (input) => {
    const { expression } = input;
    const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, '');
    const result = Function(`"use strict"; return (${sanitized})`)();
    return { result: Number(result) };
  },
});

async function main() {
  console.log('[🔍 Example 09: Observability Tracing]\n');

  // 1. Create a logger
  const logger = createLogger({
    name: 'example-app',
    level: 'debug',
    format: 'pretty',
  });

  logger.info('Example started', { example: '09-observability' });

  // 2. Create a console exporter
  const consoleExporter = createConsoleExporter();

  // 3. Create a tracer
  const tracer = createTracer({
    serviceName: 'seashore-example',
    samplingRate: 1.0, // 100% sampling rate
    exporters: [{ type: 'console' }],
  });

  // 4. Create a Token Counter
  const tokenCounter = createTokenCounter({
    defaultEncoding: 'cl100k_base',
  });

  // 5. Create an agent to trace
  const agent = createAgent({
    name: 'traced-agent',
    model: openaiText('gpt-5.1', {
      baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY,
    }),
    systemPrompt: 'You are a mathematical assistant who can help users perform calculations.',
    tools: [calculatorTool],
  });

  console.log('--- Traced Agent Execution ---\n');
  const questions = [
    'Hello! Can you help me calculate 15 * 7 + 23?',
    'What about 100 divided by 4 minus 5?',
  ];

  for (const question of questions) {
    logger.info('User question', { question });

    // Estimate input tokens
    const inputTokens = tokenCounter.count(question);
    logger.debug('Token estimation', { inputTokens });

    // Create a tracing span
    const span = tracer.startSpan('agent.run', {
      type: 'agent',
      attributes: {
        'agent.name': agent.name,
        'input.tokens': inputTokens,
      },
    });

    try {
      console.log(`📝 User: ${question}`);
      const result = await agent.run(question);

      // Record output
      const outputTokens = tokenCounter.count(result.content);
      span.setAttributes({
        'output.tokens': outputTokens,
        'tool.calls': result.toolCalls.length,
      });

      console.log(`🤖 Agent: ${result.content}`);
      console.log(`📊 Token usage: Input ~${inputTokens}, Output ~${outputTokens}`);

      // Display tool calls
      if (result.toolCalls.length > 0) {
        console.log('🛠️ Tool calls:');
        result.toolCalls.forEach((call) => {
          console.log(`   - ${call.name}: ${JSON.stringify(call.arguments)}`);
          if (call.result.success) {
            console.log(`     Result: ${JSON.stringify(call.result.data)}`);
          }
        });
      }

      // Successfully end span
      span.setStatus({ code: 'ok' });
      span.end();
      logger.info('Agent execution succeeded', {
        durationMs: span.durationMs,
        toolCalls: result.toolCalls.length,
      });
    } catch (error) {
      // Error end span
      const errorMessage = error instanceof Error ? error.message : String(error);
      span.setStatus({ code: 'error', message: errorMessage });
      span.end();
      logger.error('Agent execution failed', { error: errorMessage });
    }

    console.log();
  }

  // Shutdown tracer and exporter
  await tracer.shutdown();
  await consoleExporter.shutdown();
}

main().catch(console.error);

// [🔍 Example 09: Observability Tracing]

// 2026-01-10T17:20:11.947Z INFO  [example-app] Example started {"example":"09-observability"}
// --- Traced Agent Execution ---

// 2026-01-10T17:20:11.950Z INFO  [example-app] User question {"question":"Hello! Can you help me calculate 15 * 7 + 23?"}
// 2026-01-10T17:20:11.950Z DEBUG [example-app] Token estimation {"inputTokens":12}
// 📝 User: Hello! Can you help me calculate 15 * 7 + 23?
// 🤖 Agent: The result of 15 * 7 + 23 is 128.
// 📊 Token usage: Input ~12, Output ~10
// 🛠️ Tool calls:
//    - calculator: {"expression":"15 * 7 + 23"}
//      Result: {"result":128}
// [agent] ✓ agent.run (4454ms)
// 2026-01-10T17:20:16.405Z INFO  [example-app] Agent execution succeeded {"durationMs":4454,"toolCalls":1}

// 2026-01-10T17:20:16.405Z INFO  [example-app] User question {"question":"What about 100 divided by 4 minus 5?"}
// 2026-01-10T17:20:16.405Z DEBUG [example-app] Token estimation {"inputTokens":9}
// 📝 User: What about 100 divided by 4 minus 5?
// 🤖 Agent: The result of \(100 \div 4 - 5\) is **20**.
// 📊 Token usage: Input ~9, Output ~11
// 🛠️ Tool calls:
//    - calculator: {"expression":"100/4-5"}
//      Result: {"result":20}
// [agent] ✓ agent.run (2579ms)
// 2026-01-10T17:20:18.984Z INFO  [example-app] Agent execution succeeded {"durationMs":2579,"toolCalls":1}
