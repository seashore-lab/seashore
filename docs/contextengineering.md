# @seashorelab/contextengineering

This package provides tools for building high-quality prompts and context for LLMs. It helps make agents aware of their environment, capabilities, and constraints.

## Context Builder

Build structured prompts with context:

```ts
import { createContext } from '@seashorelab/contextengineering';

const context = createContext({
  identity: {
    name: 'CodeAssistant',
    role: 'expert programming assistant',
    personality: ['technical', 'thorough', 'patient'],
    capabilities: [
      'Write clean, documented code',
      'Debug and fix errors',
      'Explain complex concepts',
      'Suggest best practices',
    ],
  },
  environment: {
    currentDateTime: true,
    timezone: true,
    weekday: true,
    locale: 'en-US',
  },
  instructions: [
    'Always provide code examples with explanations',
    'Include error handling in examples',
    'Use TypeScript by default',
  ],
  examples: [
    {
      user: 'How do I fetch data in React?',
      assistant: 'Here is how to fetch data in React using useEffect...',
    },
  ],
});

const systemPrompt = await context.build();
console.log(systemPrompt);
```

## Environment Awareness

Make agents aware of current time and environment:

```ts
import { createEnvironmentProvider, env } from '@seashorelab/contextengineering';

const envProvider = createEnvironmentProvider({
  currentDateTime: true,
  timezone: true,
  weekday: true,
  locale: 'en-US',
  // Add custom environment data
  custom: {
    appVersion: '1.0.0',
    environment: 'production',
  },
});

// Get formatted environment string
const envString = await envProvider.format();
console.log(envString);
/*
Current date and time: Thursday, January 23, 2026 at 2:30 PM
Timezone: America/New_York (EST)
Locale: en-US
*/

// Get environment object
const envData = await envProvider.getContext();
console.log(envData);
// { currentDateTime: '...', weekday: 'Thursday', ... }

// Shorthand for environment string
const quickEnv = await env({
  currentDateTime: true,
  timezone: true,
  weekday: true,
  locale: 'en-US',
});
```

## Presets

Use preset context blocks for common patterns:

```ts
import { presets, createContext } from '@seashorelab/contextengineering';

const context = createContext({
  blocks: [
    // Identity preset
    presets.identity({
      name: 'SupportBot',
      role: 'customer support specialist',
      personality: ['friendly', 'professional', 'helpful'],
    }),

    // Time awareness
    presets.timeAwareness({
      locale: 'en-US',
      includeWeekday: true,
      includeTimezone: true,
    }),

    // Safety guidelines
    presets.safetyGuidelines({
      level: 'standard', // 'basic' | 'standard' | 'strict'
    }),

    // Code generation
    presets.codeGeneration({
      languages: ['TypeScript', 'Python', 'Go'],
      style: 'documented', // 'clean' | 'documented' | 'verbose'
      includeTests: true,
    }),

    // Output constraints
    presets.outputConstraints({
      format: 'markdown',
      tone: 'professional',
      maxLength: 1000,
    }),
  ],
});
```

## Template System

Create reusable prompt templates:

```ts
import { createTemplate } from '@seashorelab/contextengineering';

const template = createTemplate(`
# Agent Configuration

You are **{{agentName}}**, a {{role}} at {{company}}.

## Current Context
- Date: {{currentDate}}
- User: {{userName}}

## Responsibilities
{{#each responsibilities}}
- {{this}}
{{/each}}

## Guidelines
{{guidelines}}

Please assist the user professionally.
`);

// Get variables
console.log(template.getVariables());
// ['agentName', 'role', 'company', 'currentDate', 'userName', 'responsibilities', 'guidelines']

// Render template
const rendered = await template.render({
  agentName: 'TechSupport',
  role: 'support specialist',
  company: 'TechCorp',
  currentDate: new Date().toLocaleDateString(),
  userName: 'Alice',
  responsibilities: [
    'Answer technical questions',
    'Troubleshoot issues',
    'Provide solutions',
  ],
  guidelines: 'Be helpful and concise.',
});
```

## Static/Dynamic Separation

Separate static and dynamic content for prompt caching:

```ts
const context = createContext({
  // Static content (cacheable)
  identity: { name: 'Assistant' },
  instructions: ['Be helpful', 'Be concise'],

  // Dynamic content (per-request)
  environment: true,
});

// Get static portion (cache this)
const static = await context.getStaticPortion();
console.log('Static (cacheable):', static);

// Get dynamic portion (per-request)
const dynamic = await context.getDynamicPortion({
  currentDate: new Date().toISOString(),
});
console.log('Dynamic:', dynamic);

// Combine for final prompt
const fullPrompt = static + '\n\n' + dynamic;
```

## Agent Integration

Use context with agents:

```ts
import { createAgent } from '@seashorelab/agent';
import { openaiText } from '@seashorelab/llm';
import { createContext, env } from '@seashorelab/contextengineering';

// Build system prompt
const systemPrompt =
  `You are a helpful assistant.\n\n` +
  await env({ currentDateTime: true, timezone: true }) +
  `\n\nAlways reference the current time when answering time-related questions.`;

const agent = createAgent({
  name: 'time-aware-assistant',
  model: openaiText('gpt-4o'),
  systemPrompt,
});

// Agent now knows the current time
const result = await agent.run('What time is it right now?');
```

## Custom Context Blocks

Create your own context blocks:

```ts
import { createContext, createTemplate } from '@seashorelab/contextengineering';

const customBlock = createTemplate(`
## Company Information
Company: {{company.name}}
Industry: {{company.industry}}
Founded: {{company.founded}}

## Product Knowledge
Our main product: {{product.name}}
Version: {{product.version}}
`);

const context = createContext({
  blocks: [
    {
      name: 'company-info',
      build: async () => customBlock.render({
        company: {
          name: 'TechCorp',
          industry: 'Software',
          founded: 2020,
        },
        product: {
          name: 'SuperApp',
          version: '2.0',
        },
      }),
    },
  ],
});
```

## Context Composition

Combine multiple contexts:

```ts
import { createContext, mergeContexts } from '@seashorelab/contextengineering';

const baseContext = createContext({
  identity: { name: 'Assistant' },
});

const timeContext = createContext({
  environment: { currentDateTime: true },
});

const safetyContext = createContext({
  instructions: ['Be safe', 'Follow guidelines'],
});

// Merge contexts
const combined = mergeContexts([baseContext, timeContext, safetyContext]);
const prompt = await combined.build();
```

## Conditional Context

Include context conditionally:

```ts
const context = createContext({
  identity: { name: 'Assistant' },
  // Conditional environment
  environment: process.env.INCLUDE_TIME ? {
    currentDateTime: true,
  } : undefined,
  // Conditional instructions
  instructions: process.env.NODE_ENV === 'production' ? [
    'Be concise',
    'Follow policies',
  ] : [
    'Be verbose',
    'Show your work',
  ],
});
```

## Context Variables

Pass variables to context:

```ts
const context = createContext({
  identity: {
    name: '{{agentName}}',
    role: '{{role}}',
  },
});

const prompt = await context.build({
  agentName: 'SupportBot',
  role: 'Customer Support',
});
```

## Multi-Language Support

Localize context for different languages:

```ts
const context = createContext({
  identity: {
    name: 'Asistente',
    role: 'Asistente de ayuda',
  },
  environment: {
    currentDateTime: true,
    locale: 'es-ES',
  },
  instructions: [
    'Habla en español',
    'Sé amable y servicial',
  ],
});

const prompt = await context.build();
```
