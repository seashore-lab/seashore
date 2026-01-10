# Agent with Tools and Streaming

This tutorial shows you how to extend your agent with tools that enable it to perform actions beyond text generation. You'll learn how to define custom tools, integrate them into an agent, and handle streaming responses that include tool calls.

## What You'll Learn

- How to define custom tools using `defineTool`
- Specifying tool input schemas with Zod
- Integrating tools into an agent
- Streaming responses with tool execution events
- Building multi-tool agents

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
import { createAgent } from '@seashore/agent';
import { openaiText } from '@seashore/llm';
import { defineTool } from '@seashore/tool';
import { z } from 'zod';
```

## Step 2: Define a Weather Tool

Create a tool that returns weather information for a city:

```typescript
const weatherTool = defineTool({
  name: 'get_weather',
  description: 'Get the current weather for a specified city (in Celsius).',
  inputSchema: z.object({
    city: z.string().describe('City name, e.g., "Beijing", "Shanghai"'),
  }),
  execute: async (input) => {
    const { city } = input;
    const mockWeather: Record<string, { temp: number; condition: string }> = {
      Beijing: { temp: 5, condition: 'Clear' },
      Shanghai: { temp: 12, condition: 'Cloudy' },
      Shenzhen: { temp: 22, condition: 'Clear' },
      Tokyo: { temp: 8, condition: 'Overcast' },
    };

    const weather = mockWeather[city] || { temp: 0, condition: 'Unknown' };
    return {
      city,
      temperature: weather.temp,
      condition: weather.condition,
    };
  },
});
```

**Tool Structure:**

| Property | Description | Required |
|----------|-------------|----------|
| `name` | Unique identifier for the tool | Yes |
| `description` | What the tool does (helps LLM decide when to use it) | Yes |
| `inputSchema` | Zod schema validating input parameters | Yes |
| `execute` | Async function that runs the tool logic | Yes |

## Step 3: Define a Calculator Tool

Create a tool for mathematical calculations:

```typescript
const calculatorTool = defineTool({
  name: 'calculator',
  description: 'Perform basic mathematical calculations given an expression.',
  inputSchema: z.object({
    expression: z.string().describe('Mathematical expression, e.g., "2 + 3 * 4"'),
  }),
  execute: async (input) => {
    const { expression } = input;
    try {
      const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, '');
      const result = Function(`"use strict"; return (${sanitized})`)();
      return { expression, result: Number(result) };
    } catch {
      return { expression, error: 'Unable to calculate the expression' };
    }
  },
});
```

## Step 4: Create an Agent with Tools

Pass the tools array when creating the agent:

```typescript
const agent = createAgent({
  name: 'tool-assistant',
  model: openaiText('gpt-5.1', {
    baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY || '',
  }),
  systemPrompt:
    'You are a helpful assistant that can query the weather and perform mathematical calculations.',
  tools: [weatherTool, calculatorTool],
});
```

## Step 5: Stream with Tool Events

Handle streaming responses that include tool calls:

```typescript
for await (const chunk of agent.stream(userPrompt)) {
  if (chunk.type === 'content' && chunk.delta) {
    // Stream text content
    process.stdout.write(chunk.delta);
  } else if (chunk.type === 'tool-call-start' && chunk.toolCall) {
    // Log when a tool starts executing
    console.log(`[Calling Tool: ${chunk.toolCall.name}]`);
  } else if (chunk.type === 'tool-result' && chunk.toolResult) {
    // Log tool results
    console.log(`[Tool Result: ${JSON.stringify(chunk.toolResult.data)}]`);
  }
}
```

**Stream Event Types:**

| Event Type | Description |
|------------|-------------|
| `content` | Text token from the LLM |
| `tool-call-start` | Tool execution has begun |
| `tool-result` | Tool execution completed with result |

## Running the Example

```bash
cd D:\Projects\seashore\examples
pnpm run 02-agent-with-tools-and-stream
```

**Expected Output:**

```
[Example 02: Agent with Tools]

--- Combination Test ---

User: What is the temperature difference between Shanghai and Shenzhen?

[Calling Tool: get_weather]
[Calling Tool: get_weather]
[Tool Result: {"city":"Shanghai","temperature":12,"condition":"Cloudy"}]
[Tool Result: {"city":"Shenzhen","temperature":22,"condition":"Clear"}]
[Calling Tool: calculator]
[Tool Result: {"expression":"22 - 12","result":10}]
The temperature difference between Shanghai and Shenzhen is 10C, with Shenzhen being warmer.
```

## Source Code

The complete source code for this example is available at:
[`examples/src/02-agent-with-tools-and-stream.ts`](https://github.com/seahorse/seashore/blob/main/examples/src/02-agent-with-tools-and-stream.ts)

## Key Concepts

### Tool Definition Pattern

Tools follow a consistent pattern in Seashore:

1. **Define** the tool schema with Zod
2. **Implement** the execute function
3. **Register** with the agent
4. **Handle** tool events in streaming

### Input Validation

Zod schemas provide:
- Type safety for tool parameters
- Automatic validation
- Clear error messages
- IntelliSense support in IDEs

```typescript
inputSchema: z.object({
  city: z.string().describe('City name'),
  country: z.string().optional().describe('Optional country'),
  units: z.enum(['celsius', 'fahrenheit']).default('celsius'),
})
```

### Tool Descriptions Matter

The agent uses your tool description to decide when to call it. Write clear, descriptive explanations:

```typescript
// Good
description: 'Get the current weather for a specified city (in Celsius)'

// Too vague
description: 'Weather tool'

// Too verbose
description: 'This tool retrieves weather data by taking a city name as input and returning the current temperature in Celsius along with weather conditions like clear, cloudy, etc.'
```

## Extensions

### Connect to Real APIs

Replace mock data with real API calls:

```typescript
const weatherTool = defineTool({
  name: 'get_weather',
  description: 'Get real weather data from OpenWeatherMap API',
  inputSchema: z.object({
    city: z.string(),
  }),
  execute: async (input) => {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${input.city}&appid=${process.env.WEATHER_API_KEY}`
    );
    const data = await response.json();
    return {
      city: input.city,
      temperature: data.main.temp - 273.15, // Kelvin to Celsius
      condition: data.weather[0].description,
    };
  },
});
```

### Asynchronous Tool Operations

Tools can perform async operations like database queries:

```typescript
const dbQueryTool = defineTool({
  name: 'query_database',
  description: 'Query the user database',
  inputSchema: z.object({
    userId: z.string(),
  }),
  execute: async (input) => {
    const user = await db.users.findById(input.userId);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  },
});
```

### Tool Error Handling

Handle errors gracefully within tools:

```typescript
execute: async (input) => {
  try {
    const result = await someOperation(input);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

### Composite Tools

Create tools that call other tools:

```typescript
const multiCityWeatherTool = defineTool({
  name: 'compare_weather',
  description: 'Compare weather across multiple cities',
  inputSchema: z.object({
    cities: z.array(z.string()),
  }),
  execute: async (input, context) => {
    // Use the weather tool internally
    const results = await Promise.all(
      input.cities.map(city => weatherTool.execute({ city }))
    );
    return { comparisons: results };
  },
});
```

## Best Practices

1. **Keep tools focused** - Each tool should do one thing well
2. **Use descriptive names** - Names like `get_weather` are clearer than `weather`
3. **Validate inputs** - Use Zod schemas to ensure type safety
4. **Handle errors** - Return structured error responses
5. **Document well** - Help the agent understand when to use each tool

## Next Steps

- Explore **workflows** for complex multi-step processes in the [Workflows Tutorial](./workflows.md)
- Learn about **MCP integration** for external tool providers in the [MCP Integration Tutorial](./mcp-integration.md)
- Add **security guardrails** to protect against misuse in the [Security Guardrails Tutorial](./security-guardrails.md)
