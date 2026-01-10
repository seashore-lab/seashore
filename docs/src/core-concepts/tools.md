# Tools

Tools are the bridge between agents and the outside world. They allow agents to perform actions like searching the web, querying databases, calling APIs, and more.

## What is a Tool?

A tool in Seashore is a function that an agent can call with specific parameters. Tools have:

- **Name**: A unique identifier
- **Description**: What the tool does (helps the LLM decide when to use it)
- **Input Schema**: Defines what parameters the tool accepts
- **Execute Function**: The actual implementation

## Defining Tools

Use `defineTool()` to create a type-safe tool:

```typescript
import { defineTool } from '@seashore/tool'
import { z } from 'zod'

const weatherTool = defineTool({
  name: 'get_weather',
  description: 'Get the current weather for a location',
  inputSchema: z.object({
    location: z.string().describe('The city name'),
    units: z.enum(['celsius', 'fahrenheit']).optional().describe('Temperature units'),
  }),
  execute: async ({ location, units = 'fahrenheit' }) => {
    // Call weather API
    const data = await fetchWeather(location, units)
    return {
      location,
      temperature: data.temp,
      condition: data.condition,
    }
  },
})
```

## Input Schema with Zod

Seashore uses [Zod](https://zod.dev) for type-safe input validation:

### Basic Types

```typescript
inputSchema: z.object({
  // String
  name: z.string(),
  // Number
  age: z.number(),
  // Boolean
  active: z.boolean(),
  // Optional
  nickname: z.string().optional(),
  // Default value
  country: z.string().default('US'),
})
```

### Validation

```typescript
inputSchema: z.object({
  email: z.string().email(),
  age: z.number().min(0).max(120),
  url: z.string().url(),
  enum: z.enum(['option1', 'option2']),
})
```

### Descriptions

Add `.describe()` to help the LLM understand parameters:

```typescript
inputSchema: z.object({
  location: z.string().describe('The city name, e.g. "New York, NY"'),
  days: z.number().describe('Number of days to forecast, 1-7').min(1).max(7),
})
```

## Tool Return Values

Tools can return any JSON-serializable value:

```typescript
// Simple return
return { temperature: 72, condition: 'sunny' }

// Complex return
return {
  location: 'Tokyo',
  current: { temp: 22, condition: 'cloudy' },
  forecast: [
    { day: 'Monday', high: 25, low: 18 },
    { day: 'Tuesday', high: 24, low: 17 },
  ],
}
```

## Tool Context

The execute function receives a context object with useful information:

```typescript
const tool = defineTool({
  name: 'example_tool',
  inputSchema: z.object({ query: z.string() }),
  execute: async (input, context) => {
    console.log('Thread ID:', context.threadId)
    console.log('User ID:', context.userId)
    console.log('Agent:', context.agentName)

    // Use AbortSignal for cancellation
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
| `threadId` | `string \| undefined` | Current conversation thread ID |
| `userId` | `string \| undefined` | User ID for the request |
| `agentName` | `string \| undefined` | Name of the calling agent |
| `signal` | `AbortSignal \| undefined` | For cancelling operations |

## Tool Options

### Timeout

Set a maximum execution time:

```typescript
const tool = defineTool({
  name: 'slow_tool',
  inputSchema: z.object({}),
  timeout: 5000, // 5 seconds
  execute: async () => {
    // Will timeout after 5 seconds
    await longRunningOperation()
  },
})
```

### Retry

Configure retry behavior:

```typescript
const tool = defineTool({
  name: 'flaky_tool',
  inputSchema: z.object({}),
  retry: {
    maxAttempts: 3,
    delay: 1000, // milliseconds
  },
  execute: async () => {
    // Will retry up to 3 times on failure
    await flakyOperation()
  },
})
```

### Needs Approval

Require user approval before execution:

```typescript
const sensitiveTool = defineTool({
  name: 'delete_file',
  inputSchema: z.object({ path: z.string() }),
  needsApproval: true,
  execute: async ({ path }) => {
    // User must approve before this runs
    await fs.unlink(path)
  },
})
```

## Preset Tools

Seashore includes built-in tools for common tasks:

### Serper (Search)

```typescript
import { serperTool } from '@seashore/tool'

const searchTool = serperTool({
  apiKey: process.env.SERPER_API_KEY!,
  numResults: 10,
  country: 'us',
})
```

### Firecrawl (Web Scraping)

```typescript
import { firecrawlTool } from '@seashore/tool'

const scrapeTool = firecrawlTool({
  apiKey: process.env.FIRECRAWL_API_KEY!,
  formats: ['markdown', 'html'],
})
```

## Using Tools with Agents

Pass tools to agents when creating them:

```typescript
const agent = createAgent({
  name: 'assistant',
  model: openaiText('gpt-4o'),
  tools: [weatherTool, searchTool, scrapeTool],
  systemPrompt: 'You are a helpful assistant with access to weather, search, and web scraping tools.',
})
```

## Tool Composition

Combine tools for more complex operations:

```typescript
// Compose multiple tools into one
const researchTool = defineTool({
  name: 'research_topic',
  inputSchema: z.object({
    topic: z.string(),
    depth: z.number().min(1).max(3).default(2),
  }),
  execute: async ({ topic, depth }, context) => {
    // Use search tool
    const searchResults = await searchTool.execute({ query: topic })
    // Use scrape tool
    const articles = await Promise.all(
      searchResults.links.slice(0, depth).map(link =>
        scrapeTool.execute({ url: link })
      )
    )
    return {
      summary: summarize(articles),
      sources: searchResults.links,
    }
  },
})
```

## Best Practices

1. **Clear Descriptions**: Help the LLM understand when to use the tool

2. **Specific Names**: Use names like `get_weather` not `weather`

3. **Validated Input**: Always use Zod schemas for validation

4. **Error Handling**: Return meaningful errors

```typescript
execute: async ({ location }) => {
  try {
    const weather = await fetchWeather(location)
    return weather
  } catch (error) {
    return {
      error: 'Could not fetch weather',
      details: error.message,
    }
  }
}
```

5. **Keep Tools Focused**: One tool should do one thing well

## Next Steps

- [Agents](agents.md) - Use tools with agents
- [LLM Adapters](llm-adapters.md) - Configure LLM providers
- [Tutorials](../tutorials/agent-with-tools.md) - Complete tool examples
