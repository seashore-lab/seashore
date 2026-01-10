# Basic Agent Tutorial

This tutorial introduces you to the fundamentals of creating and using a basic agent with the Seashore framework. You'll learn how to set up an agent, run single-turn interactions, and handle multi-turn conversations with streaming responses.

## What You'll Learn

- How to create a basic agent using `createAgent`
- Configuring an agent with an LLM model and system prompt
- Running single-turn interactions with the `run` method
- Handling multi-turn conversations with the `chat` method
- Streaming responses token-by-token

## Prerequisites

Before starting this tutorial, make sure you have:

- Node.js 18+ installed
- pnpm installed
- An OpenAI API key stored in your environment variables:
  ```bash
  export OPENAI_API_KEY=your_api_key_here
  # Optional: Use a custom base URL
  export OPENAI_API_BASE_URL=https://api.openai.com/v1
  ```

## Step 1: Import Required Packages

First, import the necessary modules from the Seashore framework:

```typescript
import 'dotenv/config';
import { createAgent } from '@seashore/agent';
import { openaiText } from '@seashore/llm';
```

- `dotenv/config` - Loads environment variables from a `.env` file
- `createAgent` - The main function for creating agents
- `openaiText` - The OpenAI text adapter for LLM operations

## Step 2: Create a Basic Agent

Create an agent with a name, model, and system prompt:

```typescript
const agent = createAgent({
  name: 'basic-assistant',
  model: openaiText('gpt-5.1', {
    baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY || '',
  }),
  systemPrompt: 'You are a helpful assistant. Answer the user queries concisely.',
});
```

**Key Parameters:**

| Parameter | Description | Example |
|-----------|-------------|---------|
| `name` | Unique identifier for the agent | `'basic-assistant'` |
| `model` | LLM adapter instance | `openaiText('gpt-5.1', {...})` |
| `systemPrompt` | Instructions for agent behavior | `'You are a helpful assistant...'` |

## Step 3: Single-Turn Interaction

Use the `run` method for a single-turn interaction (no streaming):

```typescript
const userPrompt = 'Hello! Please introduce yourself in one sentence.';
const result = await agent.run(userPrompt);
console.log(`Agent: ${result.content}`);
```

The `run` method:
- Takes a string prompt as input
- Returns a complete response object with a `content` property
- Waits for the full response before returning

## Step 4: Multi-Turn Conversation with Streaming

For multi-turn conversations with real-time streaming, use the `chat` method:

```typescript
const messages = [
  { role: 'user', content: 'My name is David.' },
  { role: 'assistant', content: 'Hello David! How can I assist you today?' },
  { role: 'user', content: "What's the first letter in my name?" },
] as const;

for await (const chunk of agent.chat(messages)) {
  if (chunk.type === 'content' && chunk.delta) {
    process.stdout.write(chunk.delta);
  }
}
```

**Understanding Message Chunks:**

| Chunk Type | Description | Properties |
|------------|-------------|------------|
| `content` | Text content from the agent | `delta` - the text token |
| `tool-call-start` | A tool is being called | `toolCall` - tool details |
| `tool-result` | Result from a tool call | `toolResult` - result data |

## Running the Example

Run the example from the Seashore repository:

```bash
cd D:\Projects\seashore\examples
pnpm run 01-basic-agent
```

**Expected Output:**

```
[Example 01: Basic Agent]

--- Single Turn Interaction ---

User: Hello! Please introduce yourself in one sentence.
Agent: I'm ChatGPT, an AI assistant created by OpenAI to help answer questions, solve problems, and support you with clear, useful information.

--- Multi-Turn Interaction with Streaming ---

User: My name is David.
Agent: Hello David! How can I assist you today?
User: What's the first letter in my name?
Agent: The first letter of your name, David, is **D**.
```

## Source Code

The complete source code for this example is available at:
[`examples/src/01-basic-agent.ts`](https://github.com/seahorse/seashore/blob/main/examples/src/01-basic-agent.ts)

## Key Concepts

### Agent Configuration

Agents are configured with:
- **Model**: The LLM provider and model to use
- **System Prompt**: Behavioral instructions for the agent
- **Tools** (optional): Functions the agent can call

### Interaction Methods

| Method | Use Case | Streaming |
|--------|----------|-----------|
| `run()` | Simple prompts | No |
| `chat()` | Conversational context | Yes |
| `stream()` | Real-time responses | Yes |

### Message Structure

Messages follow the standard chat format:
```typescript
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
```

## Extensions

### Add Conversation History

Store and reuse conversation history:

```typescript
const conversationHistory: Message[] = [];

// Add user message
conversationHistory.push({ role: 'user', content: userInput });

// Get response
const result = await agent.chat(conversationHistory);

// Add assistant response
for await (const chunk of result) {
  if (chunk.type === 'content' && chunk.delta) {
    process.stdout.write(chunk.delta);
    // Accumulate full response
  }
}
```

### Customize the System Prompt

Create specialized agents with tailored system prompts:

```typescript
const codeAgent = createAgent({
  name: 'code-assistant',
  model: openaiText('gpt-5.1', { apiKey: '...' }),
  systemPrompt: `You are an expert programmer.
  Provide concise, well-commented code solutions.
  Always explain your approach before providing code.`,
});
```

### Error Handling

Add proper error handling:

```typescript
try {
  const result = await agent.run(userPrompt);
  console.log(result.content);
} catch (error) {
  if (error instanceof Error) {
    console.error('Agent error:', error.message);
  }
}
```

## Next Steps

- Learn about adding **tools** to your agent in the [Agent with Tools Tutorial](./agent-with-tools.md)
- Explore **workflows** for complex multi-step processes in the [Workflows Tutorial](./workflows.md)
- Add **memory** capabilities for persistent conversations in the [Memory Systems Tutorial](./memory-systems.md)
