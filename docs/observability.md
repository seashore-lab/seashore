# @seashorelab/observability

This package provides observability tools for Seashore agents, including distributed tracing, structured logging, and token counting.

## Creating a Tracer

Set up distributed tracing:

```ts
import { createTracer } from '@seashorelab/observability';

const tracer = createTracer({
  serviceName: 'my-agent-service',
  samplingRate: 1.0, // 100% sampling
  exporters: [
    { type: 'console' },
    {
      type: 'otlp',
      config: {
        url: 'https://otlp-collector.example.com:4317',
        headers: {
          'X-API-Key': process.env.OTLP_API_KEY,
        },
      },
    },
  ],
});

// Create a span
const span = tracer.startSpan('agent.run', {
  type: 'agent',
  attributes: {
    'agent.name': 'assistant',
    'user.id': 'user-123',
  },
});

// Do work...
span.setAttributes({
  'output.tokens': 100,
  'tool.calls': 2,
});

// End span
span.end();
```

## Span Management

Manage spans for nested operations:

```ts
// Parent span
const parentSpan = tracer.startSpan('workflow.execute');

// Child span
const childSpan = tracer.startSpan('llm.call', {
  parent: parentSpan,
  attributes: { 'model': 'gpt-4o' },
});

// Add events
childSpan.addEvent('prompt_sent', {
  'prompt.length': 150,
});

childSpan.end();
parentSpan.end();

// Check span status
console.log('Duration:', parentSpan.durationMs);
console.log('Status:', parentSpan.status);
```

## Logger

Create structured loggers:

```ts
import { createLogger } from '@seashorelab/observability';

const logger = createLogger({
  name: 'my-app',
  level: 'debug', // 'debug' | 'info' | 'warn' | 'error'
  format: 'pretty', // 'pretty' | 'json'
});

// Log at different levels
logger.debug('Debug info', { userId: '123' });
logger.info('User logged in', { userId: '123', timestamp: Date.now() });
logger.warn('High memory usage', { usage: '90%' });
logger.error('API error', { error: 'Connection failed', code: 500 });

// Structured logging
logger.info('Agent execution', {
  agentId: 'assistant',
  input: 'Hello',
  output: 'Hi there!',
  durationMs: 1500,
  toolCalls: ['search', 'calculator'],
});
```

## Token Counter

Count tokens for usage tracking:

```ts
import { createTokenCounter } from '@seashorelab/observability';

const tokenCounter = createTokenCounter({
  defaultEncoding: 'cl100k_base', // OpenAI's encoding
});

// Count tokens in text
const inputTokens = tokenCounter.count('What is the capital of France?');
console.log('Input tokens:', inputTokens);

// Estimate cost
const cost = tokenCounter.estimateCost(inputTokens, 0.0001);
console.log('Estimated cost:', cost);

// Get encoding info
const encoding = tokenCounter.getEncoding();
console.log('Encoding:', encoding.name);
console.log('Vocabulary size:', encoding.vocabSize);
```

## Console Exporter

Export traces to console:

```ts
import { createConsoleExporter } from '@seashorelab/observability';

const consoleExporter = createConsoleExporter({
  pretty: true,
  colors: true,
});

const tracer = createTracer({
  serviceName: 'my-app',
  exporters: [{ type: 'console', config: consoleExporter }],
});

// Shutdown when done
await consoleExporter.shutdown();
```

## OTLP Exporter

Export traces to OTLP-compatible backends:

```ts
import { createOTLPExporter } from '@seashorelab/observability';

const otlpExporter = createOTLPExporter({
  url: 'https://otlp-collector.example.com:4317',
  headers: {
    'Authorization': `Bearer ${process.env.OTLP_TOKEN}`,
  },
  compression: 'gzip', // 'gzip' | 'none'
  timeoutMs: 5000,
});

const tracer = createTracer({
  serviceName: 'my-app',
  exporters: [{ type: 'otlp', config: otlpExporter }],
});
```

## Observability Middleware

Add automatic observability to agents:

```ts
import { observabilityMiddleware } from '@seashorelab/observability';
import { createAgent } from '@seashorelab/agent';

const agent = createAgent({
  name: 'assistant',
  model: openaiText('gpt-4o'),
});

const tracedAgent = observabilityMiddleware(agent, {
  tracer,
  logger,
  tokenCounter,
  logLevel: 'info',
  traceLevel: 'debug',
});

// All agent calls are now traced
const result = await tracedAgent.run('Hello!');
```

## Custom Attributes

Add custom attributes to spans:

```ts
const span = tracer.startSpan('custom.operation');

// Set individual attributes
span.setAttribute('custom.key', 'value');
span.setAttributes({
  'user.id': '123',
  'session.id': 'abc',
  'feature.flags': ['feature1', 'feature2'],
});

// Record exceptions
span.recordException(new Error('Something went wrong'));

// End with status
span.setStatus({
  code: 'error',
  message: 'Operation failed',
});
span.end();
```

## Span Events

Add events to spans for detailed tracking:

```ts
const span = tracer.startSpan('llm.generation');

span.addEvent('stream_started', { 'model': 'gpt-4o' });
span.addEvent('first_token', { 'latency_ms': 150 });
span.addEvent('last_token', { 'total_tokens': 100 });

span.end();
```

## Baggage Context

Propagate context across operations:

```ts
import { getBaggage, setBaggage } from '@seashorelab/observability';

// Set baggage
setBaggage({
  'user.id': '123',
  'trace.id': 'abc',
});

// Get baggage in another operation
const baggage = getBaggage();
console.log('User ID:', baggage['user.id']);
```

## Metrics

Track custom metrics:

```ts
import { createMetrics } from '@seashorelab/observability';

const metrics = createMetrics({
  prefix: 'myapp',
});

// Counter
metrics.increment('requests.total', {
  'endpoint': '/api/chat',
});

// Histogram
metrics.record('request.duration', 150, {
  'endpoint': '/api/chat',
});

// Gauge
metrics.set('active.connections', 10);

// Get metrics
const snapshot = metrics.snapshot();
console.log('Metrics:', snapshot);
```

## Agent Tracing

Trace agent execution:

```ts
import { createTracer } from '@seashorelab/observability';
import { createAgent } from '@seashorelab/agent';

const tracer = createTracer({ serviceName: 'agent-service' });

async function runTracedAgent() {
  const span = tracer.startSpan('agent.run', {
    type: 'agent',
    attributes: { 'agent.name': 'assistant' },
  });

  try {
    const agent = createAgent({
      name: 'assistant',
      model: openaiText('gpt-4o'),
    });

    // Create child span for actual execution
    const execSpan = tracer.startSpan('agent.execute', { parent: span });

    const result = await agent.run('Hello!');

    execSpan.setAttributes({
      'output.length': result.content.length,
      'tool.calls': result.toolCalls.length,
    });
    execSpan.end();

    span.setStatus({ code: 'ok' });
    return result;
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({
      code: 'error',
      message: (error as Error).message,
    });
    throw error;
  } finally {
    span.end();
  }
}
```

## Shutdown

Properly shutdown exporters:

```ts
// Graceful shutdown
async function shutdown() {
  // Flush any pending traces
  await tracer.shutdown();

  // Shutdown exporters
  await consoleExporter.shutdown();
  await otlpExporter.shutdown();

  // Clear resources
  await logger.flush();
}
```
