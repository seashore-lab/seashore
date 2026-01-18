# Tools

Tools are the bridge between an LLM and the external world.

In Seashore, tools are:

- **type-safe**: inputs are defined with Zod
- **self-describing**: JSON Schema is derived for the LLM
- **executable**: tools have an `execute()` function that returns structured data

Tools are defined in `@seashore/tool` and consumed by agents (`@seashore/agent`) and workflows (`@seashore/workflow`).

## Quick Example

```ts
import { defineTool } from '@seashore/tool'
import { z } from 'zod'

export const calculatorTool = defineTool({
  name: 'calculator',
  description: 'Evaluate a basic math expression',
  inputSchema: z.object({ expression: z.string() }),
  execute: async ({ expression }) => {
    const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, '')
    const result = Function(`"use strict"; return (${sanitized})`)()
    return { expression, result: Number(result) }
  },
})
```

See [Defining Tools](./tools/defining.md) for best practices.

## Related Examples

- [Example 02: Agent with Tools and Stream](../examples/02-agent-tools-stream.md)
- [Example 11: Tool Presets with Approval](../examples/11-tool-presets.md)
- [Example 15: New Preset Tools](../examples/15-new-preset-tools.md)
# Tools

Tools are the primary way agents interact with the outside world. In Seashore, tools are type-safe functions that agents can call to perform actions like fetching data, performing calculations, or interacting with APIs.

## Overview

A tool in Seashore consists of:

- **Name**: Unique identifier for the tool
- **Description**: Explains when and how to use the tool (LLM reads this)
- **Input Schema**: Zod schema defining expected parameters
- **Execute Function**: The actual implementation

Tools are defined using `defineTool()` and provide full type safety from definition to execution.

## Defining a Tool

### Basic Tool

```typescript
import { defineTool } from '@seashore/tool'
import { z } from 'zod'

const weatherTool = defineTool({
  name: 'get_weather',
  description: 'Get the current weather for a specified city',
  inputSchema: z.object({
    city: z.string().describe('City name, e.g., "Tokyo"'),
    unit: z.enum(['celsius', 'fahrenheit']).optional(),
  }),
  execute: async ({ city, unit = 'celsius' }) => {
    // Call weather API
    const weather = await fetchWeather(city)
    
    return {
      city,
      temperature: weather.temp,
      condition: weather.condition,
      unit,
    }
  },
})
```

### Tool with Context

Access execution context in your tool:

```typescript
const databaseTool = defineTool({
  name: 'query_database',
  description: 'Query the database',
  inputSchema: z.object({
    query: z.string().describe('SQL query'),
  }),
  execute: async ({ query }, context) => {
    // Access context
    console.log('Execution ID:', context.executionId)
    console.log('User ID:', context.userId)
    console.log('Thread ID:', context.threadId)
    
    // Check for abort signal
    if (context.signal?.aborted) {
      throw new Error('Execution cancelled')
    }
    
    // Execute query with custom context
    const database = context.metadata?.database
    return await database.query(query)
  },
})
```

### Tool with Timeout

Set execution timeout to prevent hanging:

```typescript
const slowApiTool = defineTool({
  name: 'fetch_external_api',
  description: 'Fetch data from external API',
  inputSchema: z.object({
    endpoint: z.string(),
  }),
  timeout: 10000, // 10 seconds
  execute: async ({ endpoint }) => {
    const response = await fetch(endpoint)
    return await response.json()
  },
})
```

### Tool with Retry

Automatically retry on failure:

```typescript
const unreliableTool = defineTool({
  name: 'unreliable_api',
  description: 'Call an unreliable API',
  inputSchema: z.object({
    url: z.string(),
  }),
  retry: {
    maxAttempts: 3,
    delay: 1000, // 1 second
    backoffMultiplier: 2, // Exponential backoff
  },
  execute: async ({ url }) => {
    const response = await fetch(url)
    if (!response.ok) throw new Error('API failed')
    return await response.json()
  },
})
```

## Tool Result Format

Tools return a `ToolResult<T>` object:

```typescript
interface ToolResult<T> {
  success: boolean        // Whether execution succeeded
  data?: T                // Result data (if successful)
  error?: string          // Error message (if failed)
  durationMs: number      // Execution duration
  metadata?: Record<string, unknown> // Additional info
}
```

The `execute` function can return the data directly - it's automatically wrapped in a `ToolResult`:

```typescript
// This:
execute: async ({ x, y }) => {
  return { sum: x + y }
}

// Becomes this internally:
{
  success: true,
  data: { sum: 5 },
  durationMs: 12,
}
```

## Using Tools with Agents

### Single Tool

```typescript
const agent = createAgent({
  name: 'assistant',
  model: openaiText('gpt-4o'),
  systemPrompt: 'You are a helpful assistant.',
  tools: [weatherTool],
})

const result = await agent.run('What is the weather in Tokyo?')
// Agent automatically calls weatherTool and uses the result
```

### Multiple Tools

```typescript
const agent = createAgent({
  name: 'assistant',
  model: openaiText('gpt-4o'),
  systemPrompt: 'You are a helpful assistant.',
  tools: [weatherTool, calculatorTool, searchTool],
})

const result = await agent.run(
  'What is the weather in Tokyo and what is 15 + 27?'
)
// Agent calls both weatherTool and calculatorTool
```

### Tool Context

Pass custom context to tools:

```typescript
const result = await agent.run('Query users table', {
  toolContext: {
    database: myDatabaseConnection,
    userId: currentUser.id,
    permissions: currentUser.permissions,
  },
})
```

## Tool Validation

Tools automatically validate inputs using the Zod schema:

```typescript
const calculatorTool = defineTool({
  name: 'calculator',
  description: 'Perform calculations',
  inputSchema: z.object({
    a: z.number().int().positive(),
    b: z.number().int().positive(),
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
  }),
  execute: async ({ a, b, operation }) => {
    // Inputs are guaranteed to be valid here
    switch (operation) {
      case 'add': return { result: a + b }
      case 'subtract': return { result: a - b }
      case 'multiply': return { result: a * b }
      case 'divide': return { result: a / b }
    }
  },
})
```

If the agent provides invalid input, the validation error is returned as a tool result.

## Advanced Validation

Use `withValidation` for additional runtime validation:

```typescript
import { withValidation, ValidationError } from '@seashore/tool'

const userTool = defineTool({
  name: 'update_user',
  description: 'Update user information',
  inputSchema: z.object({
    userId: z.string(),
    email: z.string().email(),
  }),
  execute: async ({ userId, email }) => {
    // Additional validation
    if (!isValidEmail(email)) {
      throw new ValidationError('Invalid email format')
    }
    
    return await updateUser(userId, email)
  },
})

// Wrap with validation middleware
const validatedTool = withValidation(userTool, {
  sanitize: true,
  maxStringLength: 1000,
})
```

## Tool Approval Workflow

For sensitive operations, require user approval before execution:

```typescript
import { withApproval, createMemoryApprovalHandler } from '@seashore/tool'

// Create approval handler
const approvalHandler = createMemoryApprovalHandler()

// Wrap tool with approval requirement
const deleteTool = withApproval(
  defineTool({
    name: 'delete_file',
    description: 'Delete a file',
    inputSchema: z.object({
      path: z.string(),
    }),
    execute: async ({ path }) => {
      await fs.unlink(path)
      return { deleted: true }
    },
  }),
  {
    reason: 'File deletion requires approval',
    riskLevel: 'high',
    handler: approvalHandler,
  }
)

// Later, approve or reject
const pendingRequests = approvalHandler.getPending()
approvalHandler.approve(pendingRequests[0].id, 'user-123')
```

## Client-Side Tools

Define tools that execute on the client side (browser):

```typescript
import { defineClientTool } from '@seashore/tool'

const showMapTool = defineClientTool({
  name: 'show_map',
  description: 'Display a map with a location',
  inputSchema: z.object({
    latitude: z.number(),
    longitude: z.number(),
    zoom: z.number().optional(),
  }),
})

// In your frontend:
for await (const chunk of agent.stream('Show me Tokyo on a map')) {
  if (chunk.type === 'tool-call-start' && chunk.toolCall) {
    if (isClientTool(chunk.toolCall.name)) {
      // Render map UI with the provided coordinates
      renderMap(chunk.toolCall.arguments)
    }
  }
}
```

## Built-in Tool Presets

Seashore provides ready-to-use tools:

### Serper Search

Web search powered by Serper API:

```typescript
import { serperTool } from '@seashore/tool'

const searchTool = serperTool({
  apiKey: process.env.SERPER_API_KEY,
  country: 'us',
  locale: 'en',
  numResults: 5,
})
```

### Firecrawl Scraping

Web scraping with Firecrawl:

```typescript
import { firecrawlTool } from '@seashore/tool'

const scrapeTool = firecrawlTool({
  apiKey: process.env.FIRECRAWL_API_KEY,
  formats: ['markdown', 'html'],
})
```

## Best Practices

1. **Clear Descriptions**: Write descriptions that help the LLM understand when to use the tool
2. **Descriptive Parameters**: Use `.describe()` on schema fields to provide context
3. **Error Handling**: Handle errors gracefully and return meaningful error messages
4. **Timeouts**: Set appropriate timeouts for external API calls
5. **Validation**: Use Zod schemas to validate all inputs
6. **Idempotency**: Make tools idempotent when possible
7. **Security**: Validate and sanitize all inputs, especially for file operations
8. **Approval**: Require approval for destructive or sensitive operations

## Example: Complete Tool Implementation

```typescript
import { defineTool } from '@seashore/tool'
import { z } from 'zod'

const emailTool = defineTool({
  name: 'send_email',
  description: 'Send an email to a recipient. Use this when the user wants to send a message.',
  inputSchema: z.object({
    to: z.string().email().describe('Recipient email address'),
    subject: z.string().min(1).max(200).describe('Email subject line'),
    body: z.string().min(1).max(10000).describe('Email body content'),
    cc: z.array(z.string().email()).optional().describe('CC recipients'),
  }),
  timeout: 15000,
  retry: {
    maxAttempts: 2,
    delay: 1000,
  },
  execute: async ({ to, subject, body, cc }, context) => {
    // Check abort signal
    if (context.signal?.aborted) {
      throw new Error('Email sending cancelled')
    }
    
    try {
      // Send email using your email service
      const messageId = await emailService.send({
        to,
        subject,
        body,
        cc,
        userId: context.userId,
      })
      
      return {
        sent: true,
        messageId,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      throw new Error(`Failed to send email: ${error.message}`)
    }
  },
})
```

## Next Steps

- [Defining Tools](./tools/defining.md) - Detailed tool creation guide
- [Tool Validation](./tools/validation.md) - Advanced validation techniques
- [Client-Side Tools](./tools/client-tools.md) - Build interactive UI tools
- [Tool Approval](./tools/approval.md) - Implement approval workflows
- [Tool Presets](./tools/presets.md) - Use built-in tools

## Examples

- [02: Agent with Tools](../examples/02-agent-tools-stream.md) - Basic tool usage
- [11: Tool Presets](../examples/11-tool-presets.md) - Serper and Firecrawl tools
- [15: New Preset Tools](../examples/15-new-preset-tools.md) - Create custom presets
