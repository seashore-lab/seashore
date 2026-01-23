# @seashorelab/tool

This package provides the ability to define type-safe tools for Seashore agents. Tools are the primary way for agents to interact with external systems, perform actions, and retrieve information.

## Defining Tools

Use `defineTool` to create a tool with a Zod schema for input validation. The tool configuration includes a name, description, input schema, and an execute function.

```ts
import { defineTool } from '@seashorelab/tool';
import { z } from 'zod';

const calculatorTool = defineTool({
  name: 'calculator',
  description: 'Perform mathematical calculations',
  inputSchema: z.object({
    expression: z.string().describe('Math expression to evaluate'),
  }),
  execute: async ({ expression }) => {
    const result = eval(expression);
    return { result: Number(result) };
  },
});
```

The `execute` function receives validated input and returns the result. The tool automatically handles timeout (default 30 seconds) and can be configured with retry logic.

## Tool Configuration Options

### Timeout

Set a custom timeout for tool execution:

```ts
const slowTool = defineTool({
  name: 'slow_tool',
  description: 'A tool that takes time to complete',
  inputSchema: z.object({ query: z.string() }),
  timeout: 60000, // 60 seconds
  execute: async ({ query }) => {
    // Long-running operation
    return { result: 'done' };
  },
});
```

### Retry

Configure retry logic for transient failures:

```ts
const flakyTool = defineTool({
  name: 'flaky_api',
  description: 'Call a flaky external API',
  inputSchema: z.object({ endpoint: z.string() }),
  retry: {
    maxAttempts: 3,
    delay: 1000, // 1 second
    backoffMultiplier: 2, // Exponential backoff
  },
  execute: async ({ endpoint }) => {
    const response = await fetch(endpoint);
    return await response.json();
  },
});
```

## Approval Workflow

For sensitive operations, you can require approval before tool execution using `withApproval`:

```ts
import { withApproval, createMemoryApprovalHandler } from '@seashorelab/tool';

const approvalHandler = createMemoryApprovalHandler();

const sensitiveTool = withApproval(baseTool, {
  reason: 'This operation requires approval',
  riskLevel: 'medium',
  handler: approvalHandler,
  timeout: 30000,
});

// Later, approve or reject requests
approvalHandler.approve(requestId, 'user-123');
approvalHandler.reject(requestId, 'Operation not allowed');
```

## Validation Middleware

Add input/output validation using `withValidation`:

```ts
import { withValidation, sanitizeString } from '@seashorelab/tool';

const validatedTool = withValidation(someTool, {
  inputValidators: [
    sanitizeString(), // Remove potentially harmful content
    createValidator({
      check: (input) => {
        if (input.someField.length > 1000) {
          return { passed: false, reason: 'Input too long' };
        }
        return { passed: true };
      },
    }),
  ],
});
```

## Preset Tools

Seashore provides preset tools for common operations:

### Serper Search

Search the web using the Serper API:

```ts
import { serperTool } from '@seashorelab/tool';

const searchTool = serperTool({
  apiKey: process.env.SERPER_API_KEY!,
  country: 'us',
  locale: 'en',
  numResults: 5,
});

// Returns: { organic: [...], knowledgeGraph?: {...}, relatedSearches?: [...] }
```

### Firecrawl Scraping

Scrape web pages using Firecrawl:

```ts
import { firecrawlTool } from '@seashorelab/tool';

const scrapeTool = firecrawlTool({
  apiKey: process.env.FIRECRAWL_API_KEY!,
  formats: ['markdown'],
});

// Returns: { markdown: string, metadata: {...} }
```

## Client-Side Tools

For tools that should run on the client (e.g., browser APIs), use `defineClientTool`:

```ts
import { defineClientTool } from '@seashorelab/tool';

const geolocationTool = defineClientTool({
  name: 'get_geolocation',
  description: 'Get the current user location',
  inputSchema: z.object({}),
  execute: async () => {
    const position = await navigator.geolocation.getCurrentPosition();
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  },
});
```

Client tools have a special `isClientTool: true` property that allows them to be distinguished from server tools.

## Tool Context

The execute function receives a `ToolContext` with additional information:

```ts
const contextAwareTool = defineTool({
  name: 'context_aware',
  description: 'A tool aware of execution context',
  inputSchema: z.object({ query: z.string() }),
  execute: async (input, context) => {
    // context.executionId - Unique ID for this execution
    // context.signal - AbortSignal for cancellation
    return {
      executionId: context.executionId,
      result: input.query,
    };
  },
});
```

## Tool Result

Tools return a `ToolResult<T>` object:

```ts
interface ToolResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  durationMs: number;
}
```

The `success` field indicates whether the tool executed successfully. If `success` is `false`, `error` contains the error message.
