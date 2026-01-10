# @seashore/tool

Type-safe tool definition system with Zod validation and preset tools.

## Installation

```bash
pnpm add @seashore/tool
```

Peer dependencies:
```bash
pnpm add zod
```

## Overview

`@seashore/tool` provides:

- Type-safe tool definitions using Zod schemas
- Preset tools for common tasks (search, web scraping)
- Tool execution with timeout and retry support
- Input validation and error handling

## Quick Start

### Defining a Tool

```typescript
import { defineTool } from '@seashore/tool'
import { z } from 'zod'

const calculatorTool = defineTool({
  name: 'calculator',
  description: 'Perform mathematical calculations',
  inputSchema: z.object({
    expression: z.string().describe('Math expression to evaluate'),
  }),
  execute: async ({ expression }) => {
    const result = eval(expression) // Use a proper math parser in production
    return { result }
  },
})
```

### Using with an Agent

```typescript
import { createAgent } from '@seashore/agent'
import { openaiText } from '@seashore/llm'

const agent = createAgent({
  name: 'math-assistant',
  model: openaiText('gpt-4o'),
  tools: [calculatorTool],
})

const result = await agent.run({
  messages: [{ role: 'user', content: 'What is 25 * 37?' }],
})
```

## API Reference

### defineTool

Creates a type-safe tool definition.

```typescript
function defineTool<TInput extends ZodSchema, TOutput>(
  config: ToolConfig<TInput, TOutput>
): Tool<z.infer<TInput>, TOutput>
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Unique tool identifier |
| `description` | `string` | Yes | What the tool does (helps LLM decide when to use it) |
| `inputSchema` | `ZodSchema` | Yes | Input parameter validation schema |
| `execute` | `function` | Yes | Tool implementation |
| `needsApproval` | `boolean` | No | Require user approval before execution |
| `timeout` | `number` | No | Execution timeout in ms (default: 30000) |
| `retry` | `object` | No | Retry configuration |

#### Returns

A `Tool` object with `execute()` and `validate()` methods.

## Input Schema with Zod

### Basic Types

```typescript
inputSchema: z.object({
  // Primitives
  name: z.string(),
  count: z.number(),
  active: z.boolean(),

  // Optional
  nickname: z.string().optional(),

  // Default values
  region: z.string().default('us'),

  // Enums
  sort: z.enum(['asc', 'desc']),
})
```

### Validation

```typescript
inputSchema: z.object({
  email: z.string().email(),
  age: z.number().min(0).max(120),
  url: z.string().url(),
  phoneNumber: z.string().regex(/^\d{3}-\d{3}-\d{4}$/),
})
```

### Descriptions

Add descriptions to help the LLM understand parameters:

```typescript
inputSchema: z.object({
  location: z.string().describe('City name, e.g. "San Francisco, CA"'),
  units: z.enum(['celsius', 'fahrenheit']).describe('Temperature units'),
})
```

### Complex Schemas

```typescript
inputSchema: z.object({
  items: z.array(z.object({
    name: z.string(),
    quantity: z.number().positive(),
  })),
  metadata: z.record(z.string(), z.unknown()),
})
```

## Tool Options

### Timeout

```typescript
const tool = defineTool({
  name: 'slow_operation',
  inputSchema: z.object({}),
  timeout: 5000, // 5 seconds
  execute: async () => {
    await longRunningTask()
  },
})
```

### Retry

```typescript
const tool = defineTool({
  name: 'flaky_api',
  inputSchema: z.object({ endpoint: z.string() }),
  retry: {
    maxAttempts: 3,
    delay: 1000, // ms between retries
  },
  execute: async ({ endpoint }) => {
    return await fetch(endpoint)
  },
})
```

### Needs Approval

```typescript
const tool = defineTool({
  name: 'delete_file',
  inputSchema: z.object({ path: z.string() }),
  needsApproval: true,
  execute: async ({ path }) => {
    await fs.unlink(path)
    return { deleted: path }
  },
})
```

## Preset Tools

### Serper (Search)

```typescript
import { serperTool } from '@seashore/tool'

const searchTool = serperTool({
  apiKey: process.env.SERPER_API_KEY!,
  numResults: 10,
  country: 'us',
  locale: 'en',
})
```

### Firecrawl (Web Scraping)

```typescript
import { firecrawlTool } from '@seashore/tool'

const scrapeTool = firecrawlTool({
  apiKey: process.env.FIRECRAWL_API_KEY!,
  formats: ['markdown', 'html'],
  timeout: 30000,
})
```

## Tool Context

The execute function receives a context object:

```typescript
const tool = defineTool({
  name: 'contextual_tool',
  inputSchema: z.object({ query: z.string() }),
  execute: async (input, context) => {
    console.log('Thread:', context.threadId)
    console.log('User:', context.userId)
    console.log('Agent:', context.agentName)

    // Check for cancellation
    if (context.signal?.aborted) {
      throw new Error('Cancelled')
    }

    return { result: 'done' }
  },
})
```

### Context Properties

| Property | Type | Description |
|----------|------|-------------|
| `threadId` | `string \| undefined` | Conversation thread ID |
| `userId` | `string \| undefined` | User ID |
| `agentName` | `string \| undefined` | Calling agent name |
| `signal` | `AbortSignal \| undefined` | Cancellation signal |
| `tracer` | `Tracer \| undefined` | Observability tracer |

## Error Handling

Tools should handle errors gracefully:

```typescript
const tool = defineTool({
  name: 'api_call',
  inputSchema: z.object({ endpoint: z.string() }),
  execute: async ({ endpoint }) => {
    try {
      const response = await fetch(endpoint)
      if (!response.ok) {
        return {
          error: `API error: ${response.status}`,
          message: await response.text(),
        }
      }
      return await response.json()
    } catch (error) {
      return {
        error: 'Request failed',
        details: error.message,
      }
    }
  },
})
```

## Best Practices

1. **Clear Names**: Use verbs like `get_weather`, `search_web`
2. **Descriptive Descriptions**: Help the LLM understand when to use the tool
3. **Specific Schemas**: Use Zod validation to catch errors early
4. **Handle Errors**: Return structured errors, don't throw
5. **Keep Focused**: One tool should do one thing well

## See Also

- [Tools Core Concept](../core-concepts/tools.md)
- [Agent Package](agent.md)
- [Tutorials](../tutorials/agent-with-tools.md)
