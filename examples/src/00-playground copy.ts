import { openaiText } from '@seashorelab/llm';
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
        '```json {\n  "explanation": "A closure is a feature in JavaScript where an inner function has access to the outer (enclosing) function\'s variables even after the outer function has returned. This allows the inner function to remember the environment in which it was created.",\n  "codeSnippet": "function makeCounter() {\n  let count = 0;\n  return function() {\n    count++;\n    return count;\n  };\n}\n\nconst counter = makeCounter();\nconsole.log(counter()); // 1\nconsole.log(counter()); // 2"\n}```',
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

builder.build()