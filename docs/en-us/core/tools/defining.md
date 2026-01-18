# Defining Tools

Seashore tools are defined with `defineTool()` from `@seashore/tool`.

## Design Goals

- Make the tool easy for the model to select (good `name` + `description`).
- Validate inputs at runtime (Zod schemas).
- Return structured outputs (objects/arrays), not “pretty strings”.

## Anatomy

```ts
import { defineTool } from '@seashore/tool'
import { z } from 'zod'

const tool = defineTool({
  name: 'get_weather',
  description: 'Get the current weather for a city (Celsius).',
  inputSchema: z.object({
    city: z.string().describe('City name, e.g. "Beijing"'),
  }),
  execute: async ({ city }) => {
    return { city, temperature: 20, condition: 'Clear' }
  },
})
```

## Naming Rules

- Use `snake_case` names (`get_weather`, `serper_search`).
- Keep names stable: the LLM learns by tool name.

## Return Shape

Return JSON-friendly objects.

Bad:

```ts
return `The temperature is 20C`;
```

Good:

```ts
return { temperature: 20, unit: 'C' };
```

## Testing Tools

Tools can be executed directly without an agent:

```ts
const result = await tool.execute({ city: 'Tokyo' })
if (result.success) console.log(result.data)
```
