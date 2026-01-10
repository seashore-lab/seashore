# Observability Tutorial

This tutorial introduces Seashore's observability features for monitoring, logging, and tracing your AI applications. Observability helps you understand what's happening inside your agents, debug issues, and optimize performance.

## What You'll Learn

- How to create and use loggers
- Setting up distributed tracing
- Counting tokens for cost tracking
- Creating custom spans for operations
- Exporting traces and logs

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
  createLogger,
  createTracer,
  createTokenCounter,
  createConsoleExporter,
} from '@seashore/observability';
import { createAgent } from '@seashore/agent';
import { openaiText } from '@seashore/llm';
import { defineTool } from '@seashore/tool';
import { z } from 'zod';
```

## Step 2: Create a Tool for Tracing

Define a tool that we'll trace in our examples:

```typescript
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
```

## Step 3: Create a Logger

Initialize a logger for structured logging:

```typescript
const logger = createLogger({
  name: 'example-app',
  level: 'debug',  // trace, debug, info, warn, error
  format: 'pretty',  // 'pretty' or 'json'
});
```

**Logger Configuration:**

| Option | Values | Description |
|--------|--------|-------------|
| `name` | string | Logger identifier |
| `level` | trace/debug/info/warn/error | Minimum log level |
| `format` | pretty/json | Output format |

**Log Methods:**

| Method | Use Case |
|--------|----------|
| `logger.trace()` | Very detailed debugging |
| `logger.debug()` | Debugging information |
| `logger.info()` | General information |
| `logger.warn()` | Warning messages |
| `logger.error()` | Error messages |

## Step 4: Create a Console Exporter

Set up a console exporter for trace output:

```typescript
const consoleExporter = createConsoleExporter();
```

## Step 5: Create a Tracer

Initialize a tracer for distributed tracing:

```typescript
const tracer = createTracer({
  serviceName: 'seashore-example',
  samplingRate: 1.0,  // 100% sampling rate
  exporters: [{ type: 'console' }],
});
```

**Tracer Configuration:**

| Option | Description | Default |
|--------|-------------|---------|
| `serviceName` | Name of your service | Required |
| `samplingRate` | Fraction of traces to capture (0-1) | 1.0 |
| `exporters` | Where to send traces | Console |

## Step 6: Create a Token Counter

Initialize a token counter for cost estimation:

```typescript
const tokenCounter = createTokenCounter({
  defaultEncoding: 'cl100k_base',  // OpenAI's encoding
});
```

**Supported Encodings:**

| Encoding | Models |
|----------|--------|
| `cl100k_base` | GPT-4, GPT-3.5-turbo |
| `o200k_base` | GPT-4o, GPT-4o-mini |
| `r50k_base` | Older GPT-3 models |

## Step 7: Create and Trace an Agent

Create an agent and trace its execution:

```typescript
const agent = createAgent({
  name: 'traced-agent',
  model: openaiText('gpt-5.1', {
    baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY,
  }),
  systemPrompt: 'You are a mathematical assistant who can help users perform calculations.',
  tools: [calculatorTool],
});
```

## Step 8: Execute with Tracing

Run the agent with complete observability:

```typescript
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
    console.log(`User: ${question}`);
    const result = await agent.run(question);

    // Record output metrics
    const outputTokens = tokenCounter.count(result.content);
    span.setAttributes({
      'output.tokens': outputTokens,
      'tool.calls': result.toolCalls.length,
    });

    console.log(`Agent: ${result.content}`);
    console.log(`Token usage: Input ~${inputTokens}, Output ~${outputTokens}`);

    // Display tool calls
    if (result.toolCalls.length > 0) {
      console.log('Tool calls:');
      result.toolCalls.forEach((call) => {
        console.log(`   - ${call.name}: ${JSON.stringify(call.arguments)}`);
        if (call.result.success) {
          console.log(`     Result: ${JSON.stringify(call.result.data)}`);
        }
      });
    }

    // End span successfully
    span.setStatus({ code: 'ok' });
    span.end();
    logger.info('Agent execution succeeded', {
      durationMs: span.durationMs,
      toolCalls: result.toolCalls.length,
    });
  } catch (error) {
    // End span with error
    const errorMessage = error instanceof Error ? error.message : String(error);
    span.setStatus({ code: 'error', message: errorMessage });
    span.end();
    logger.error('Agent execution failed', { error: errorMessage });
  }

  console.log();
}
```

## Step 9: Clean Up Resources

Properly shutdown tracer and exporter:

```typescript
await tracer.shutdown();
await consoleExporter.shutdown();
```

## Running the Example

```bash
cd D:\Projects\seashore\examples
pnpm run 09-observability-tracing
```

**Expected Output:**

```
[Example 09: Observability Tracing]

2026-01-10T17:20:11.947Z INFO  [example-app] Example started {"example":"09-observability"}
--- Traced Agent Execution ---

2026-01-10T17:20:11.950Z INFO  [example-app] User question {"question":"Hello! Can you help me calculate 15 * 7 + 23?"}
2026-01-10T17:20:11.950Z DEBUG [example-app] Token estimation {"inputTokens":12}
User: Hello! Can you help me calculate 15 * 7 + 23?
Agent: The result of 15 * 7 + 23 is 128.
Token usage: Input ~12, Output ~10
Tool calls:
   - calculator: {"expression":"15 * 7 + 23"}
     Result: {"result":128}
[agent] agent.run (4454ms)
2026-01-10T17:20:16.405Z INFO  [example-app] Agent execution succeeded {"durationMs":4454,"toolCalls":1}
```

## Source Code

The complete source code for this example is available at:
[`examples/src/09-observability-tracing.ts`](https://github.com/seahorse/seashore/blob/main/examples/src/09-observability-tracing.ts)

## Key Concepts

### Observability Pillars

1. **Logs**: Structured event records with context
2. **Metrics**: Numerical measurements over time
3. **Traces**: Request lifecycle across components

### Span Attributes

Add custom attributes to spans for richer tracing:

```typescript
span.setAttributes({
  'user.id': userId,
  'session.id': sessionId,
  'feature.flags': JSON.stringify(flags),
});
```

### Span Status

Set status to indicate operation result:

```typescript
// Success
span.setStatus({ code: 'ok' });

// Error
span.setStatus({ code: 'error', message: 'Something went wrong' });
```

## Extensions

### Nested Spans

Create parent-child relationships:

```typescript
const parentSpan = tracer.startSpan('workflow.execute');

const childSpan1 = tracer.startSpan('workflow.step1', {
  parent: parentSpan,
});
// ... do work
childSpan1.end();

const childSpan2 = tracer.startSpan('workflow.step2', {
  parent: parentSpan,
});
// ... do work
childSpan2.end();

parentSpan.end();
```

### Custom Exporters

Export traces to external services:

```typescript
import { createOTLPExporter } from '@seashore/observability';

const otlpExporter = createOTLPExporter({
  endpoint: 'http://localhost:4318/v1/traces',
  headers: {
    'X-API-Key': process.env.OTEL_API_KEY,
  },
});

const tracer = createTracer({
  serviceName: 'my-service',
  exporters: [
    { type: 'otlp', exporter: otlpExporter },
  ],
});
```

### Middleware Integration

Integrate with Express/Hono:

```typescript
import { createTracingMiddleware } from '@seashore/observability';

app.use(createTracingMiddleware(tracer));

app.get('/api/chat', async (c) => {
  const span = tracer.getActiveSpan();
  span?.setAttributes({
    'http.method': 'GET',
    'http.route': '/api/chat',
  });
  // ... handle request
});
```

### Cost Tracking

Track LLM costs across operations:

```typescript
class CostTracker {
  private costs = new Map<string, number>();

  track(operation: string, inputTokens: number, outputTokens: number, model: string) {
    const pricing = {
      'gpt-5.1': { input: 0.00001, output: 0.00003 },
    };

    const cost = (inputTokens * pricing[model].input) +
                 (outputTokens * pricing[model].output);

    const current = this.costs.get(operation) || 0;
    this.costs.set(operation, current + cost);

    logger.info('Cost tracked', {
      operation,
      inputTokens,
      outputTokens,
      cost,
    });
  }

  getTotal() {
    return Array.from(this.costs.values()).reduce((a, b) => a + b, 0);
  }
}
```

### Performance Metrics

Track custom performance metrics:

```typescript
class PerformanceTracker {
  private measurements = new Map<string, number[]>();

  track(operation: string, durationMs: number) {
    const measurements = this.measurements.get(operation) || [];
    measurements.push(durationMs);
    this.measurements.set(operation, measurements);
  }

  getStats(operation: string) {
    const measurements = this.measurements.get(operation) || [];
    if (measurements.length === 0) return null;

    const sorted = [...measurements].sort((a, b) => a - b);
    return {
      count: measurements.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      avg: measurements.reduce((a, b) => a + b, 0) / measurements.length,
    };
  }
}
```

## Best Practices

1. **Log at appropriate levels** - Use debug, info, warn, error correctly
2. **Add context to logs** - Include relevant metadata
3. **Use structured logging** - JSON format for production
4. **Trace end-to-end** - Cover complete request lifecycles
5. **Sample intelligently** - Lower sampling rates for high-traffic systems
6. **Clean up resources** - Always shutdown tracers and exporters

## Next Steps

- Learn about **deployment** for production monitoring in the [Deployment Tutorial](./deployment.md)
- Explore **evaluation** to measure quality in the [Evaluation Tutorial](./evaluation.md)
- Add **security guardrails** for safety in the [Security Tutorial](./security-guardrails.md)
