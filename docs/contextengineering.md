# @seashorelab/contextengineering

Many developers find it challenging to create structured, effective and efficient prompts that guide LLMs to produce desired outputs. This package provides tools for building high-quality prompts and context for LLMs, awaring environment, capabilities, and constraints.

## Context Builder

A context is built of multiple blocks, each serving a specific purpose. Use the `createContext` function to define and compose these blocks into a coherent prompt.
Here is a full example:

```ts
import { createContext } from '@seashorelab/contextengineering';

const builder = createContext({
  // Agent identity configuration
  identity: {
    name: 'Code Assistant', // let it know who it is
    role: 'You are a helpful coding assistant.', // define its role
    personality: ['friendly', 'concise'], // set personality traits
    capabilities: ['Write clean and documented code'], // list capabilities
    constraints: ['Use Python by default to answer'], // set constraints (limitations)
  },
  // Provide environment context (e.g., current date/time)
  environment: {
    currentDateTime: true, // e.g., 2026-01-17T14:30:00+08:00
    timezone: true, // e.g., Asia/Shanghai
    weekday: true, // e.g., Friday or 星期五
    locale: 'en-US', // e.g., en-US or zh-CN
    // custom variables
    custom: {
      location: 'San Francisco, CA',
    },
  },
  // Provide instructions that are not exactly personality / capability / constraint
  instructions: ['Let it crash your code if necessary to demonstrate the issue.'],
  // Require the output to follow a specific format (not enforced strictly since this is prompt based)
  outputFormat: {
    type: 'json',
    schema: {
      type: 'object',
      properties: {
        explanation: { type: 'string' },
        codeSnippet: { type: 'string' },
      },
      required: ['explanation', 'codeSnippet'],
    },
  },
  // Few-shot examples to guide the agent behavior
  examples: [
    {
      user: 'Explain what a closure is in JavaScript and provide a code example.',
      assistant:
        '```json {\n  "explanation": "A closure is a feature in JavaScript where ...",\n  "codeSnippet": "function makeCounter() {\n  let count = 0;\n  return function() {\n    count++;\n    return count;\n  };\n}\n\nconst counter = makeCounter();\nconsole.log(counter()); // 1\nconsole.log(counter()); // 2"\n}```',
      explanation:
        'Output starts with ```json and ends with ``` to folow the output format specification.',
    },
  ],
  // Provide extra background information if necessary
  context: {
    conversationHistorySummary:
      'The user is a software developer seeking coding assistance and explanations.',
  },
});
```

This provides almost all the common context blocks needed to build a high-quality prompt for an LLM-based agent.

To get the built prompt string, call `await builder.build()`. By default, blocks are sorted in the order of priority: identity > environment > instructions > output format > examples > context. The latter blocks will appear later in the prompt.

If you want to maximize the prompt caching efficiency, you can separate static and dynamic portions of the context using `getStaticPortion` and `getDynamicPortion` methods. Basically, identity, instructions, output format, examples are static, and environment and extra context are dynamic. And you get the final prompt by combining both portions.

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
