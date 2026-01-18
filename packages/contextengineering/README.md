# @seashorelab/contextengineering

Context engineering utilities for building high-quality LLM prompts in the Seashore Agent Framework.

## Overview

Context Engineering is the art and science of filling the context window with just the right information for the LLM to accomplish its task. This package provides tools to:

- **Inject runtime environment information** (current time, date, timezone, locale)
- **Build structured prompts** with clear sections (identity, instructions, examples)
- **Use templates** with variable interpolation
- **Separate static and dynamic content** for prompt caching optimization
- **Use presets** for common prompt components

## Installation

```bash
pnpm add @seashore/contextengineering
```

## Quick Start

### Environment-Aware Prompts

Make your LLM aware of the current time and date:

```typescript
import { createEnvironmentProvider } from '@seashorelab/contextengineering'

const env = createEnvironmentProvider({
  currentDateTime: true,
  timezone: true,
  locale: 'en-US',
})

const envContext = await env.getContext()
// {
//   currentDateTime: "2026-01-17T14:30:00+08:00",
//   timezone: "Asia/Shanghai",
//   locale: "en-US",
// }

const systemPrompt = `
You are a helpful assistant.

## Current Environment
${env.format()}
`
```

### Context Builder

Build structured prompts with a fluent API:

```typescript
import { createContext } from '@seashorelab/contextengineering'

const context = createContext({
  identity: {
    name: 'Assistant',
    role: 'You are a helpful AI assistant.',
  },
  environment: {
    currentTime: true,
    timezone: true,
  },
  instructions: [
    'Be concise and accurate.',
    'Always cite sources when providing information.',
  ],
  examples: [
    { user: 'What time is it?', assistant: 'The current time is {{currentTime}}.' },
  ],
})

const systemPrompt = await context.build()
```

### Using Presets

```typescript
import { presets } from '@seashorelab/contextengineering'

const context = createContext({
  blocks: [
    presets.identity({ name: 'CodeBot', role: 'coding assistant' }),
    presets.timeAwareness({ locale: 'en-US' }),
    presets.safetyGuidelines(),
    presets.codeGeneration({ languages: ['typescript', 'python'] }),
  ],
})
```

### Template System

Use templates with variable interpolation:

```typescript
import { createTemplate } from '@seashorelab/contextengineering'

const template = createTemplate(`
# Identity
You are {{name}}, a {{role}}.

# Current Context
- Date: {{env.date}}
- Time: {{env.time}}
- User: {{state.userName}}
`)

const result = await template.render({
  name: 'Assistant',
  role: 'helpful AI',
  state: { userName: 'John' },
})
```

## API Reference

### Environment Provider

```typescript
createEnvironmentProvider(options: EnvironmentOptions): EnvironmentProvider
```

Options:
- `currentTime`: Include current time (HH:mm:ss)
- `currentDate`: Include current date (YYYY-MM-DD)
- `currentDateTime`: Include full ISO 8601 datetime
- `timezone`: Include timezone name
- `utcOffset`: Include UTC offset
- `weekday`: Include day of week
- `locale`: Locale for formatting (default: system locale)
- `dateFormat`: Custom date format
- `timeFormat`: Custom time format

### Context Builder

```typescript
createContext(config: ContextConfig): ContextBuilder
```

Config:
- `identity`: Agent identity configuration
- `environment`: Environment provider options
- `instructions`: Array of instruction strings
- `examples`: Few-shot examples
- `blocks`: Array of context blocks

### Template

```typescript
createTemplate(templateString: string): Template
```

Methods:
- `render(variables: Record<string, unknown>)`: Render template with variables

## License

MIT
