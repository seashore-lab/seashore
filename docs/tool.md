# @seashorelab/tool

This package provides the ability to define type-safe tools for Seashore agents. Tools are the primary way for agents to interact with external systems, perform actions, and retrieve information.

## Defining Tools

Use `defineTool` to create a tool with a Zod schema for input validation. The tool configuration includes

- `name` to uniquely identify the tool
- `description` to tell agents what the tool does
- `inputSchema` to tell agents what to pass as input
- `execute` function that actually performs the tool's action. It receives validated input and returns the result.

```ts
import { defineTool } from '@seashorelab/tool';
import { z } from 'zod';

const weatherTool = defineTool({
  name: 'getWeather',
  description: 'Get the current weather for a given city.',
  inputSchema: z.object({
    city: z.string().describe('The city to get the weather for.'),
  }),
  execute: async ({ city }) => {
    // Simulated data
    return {
      city,
      temperature: '22°C',
      condition: 'Cloudy',
    };
  },
});
```

The tool automatically handles timeout (default 30 seconds) and can be configured with retry logic.

```ts
defineTool({
  ...,
  timeout: 30000, // default timeout is 30 seconds
  retry: {
    maxAttempts: 2,
    delay: 2000, // 2 seconds
    backoffMultiplier: 2, // exponential backoff
  },
})
```

The defined tool can be passed to an agent for use. Internally, the `execute` function will be called when the agent decides to use the tool.

```ts
weatherTool.execute({ city: 'San Francisco' }).then((result) => {
  console.log('Weather Tool Result:', result);
});
```

## Approval Workflow

For sensitive operations, you can require approval before tool execution using `withApproval`:

```ts
import { withApproval, createMemoryApprovalHandler } from '@seashorelab/tool';

const approvalHandler = createMemoryApprovalHandler();
const weatherToolWithApproval = withApproval(weatherTool, {
  reason: 'Fetching weather data requires approval.',
  handler: approvalHandler,
});
```

Here `createMemoryApprovalHandler` saves all pending approvals in memory. It's simple but not very production-ready.

When a tool with approval is executed, it will pend its request into the approval handler. Only after approval / rejection will the tool proceed.

```ts
const weatherToolExecution = weatherToolWithApproval.execute({ city: 'San Francisco' });

// Simulates an asynchronous approval process that approves or rejects after some time
setInterval(() => {
  const { pendingRequests } = approvalHandler;
  const [requestId] = pendingRequests.keys();

  if (requestId) {
    console.log('Approving Request ID:', requestId);
    approvalHandler.approve(requestId); // approve
    // approvalHandler.reject(requestId, 'No reason.'); // or reject
  }
}, 1000);

// Won't resolve until approved or rejected
await weatherToolExecution.then((result) => {
  console.log('Tool Execution Result:', result);
});
```

`result.metadata.approvalStatus` can be `'approved'` or `'rejected'` based on the outcome.

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
