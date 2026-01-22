# @seashorelab/agent

This package provides the ability to create agents in Seashore. Agents can be equipped with LLM, tools, memory, and other capabilities to perform complex tasks. 

Currently two types of agents are considered: 

- Workflow Agent: Executes a predefined sequence of steps to accomplish a task.
- ReAct Agent: Uses reasoning and action to interact with tools dynamically to achieve a goal.

## ReAct Agent

The ReAct pattern consists of:
 1. Thought: LLM reasons about the current state
 2. Action: LLM decides which tool to call (if any)
 3. Observation: Tool execution result
 4. Repeat until task is complete

Use the following code to create a ReAct agent with LLM and tools.

`createAgent` is an alias of `createReActAgent`. This implies the "By default intelligent" philosophy of Seashore.

```ts
import { createAgent } from '@seashorelab/agent';

const agent = createAgent({
  name: 'Assistant',
  model: openaiTextAdapter,
  systemPrompt: 'You are a helpful assistant.',
  tools: [weatherTool],
});
```

To know how to create LLM adapters and tools, please refer to the documentation of `@seashorelab/llm` and `@seashorelab/tools`.

The default `maxIterations` is 5, and `temperature` is 0.7. You can customize these parameters as needed.

The agent exposes three methods to interact with it.

- `run` runs a single-turn interaction with the agent without streaming
- `stream` runs a single-turn interaction with the agent with streaming
- `chat` runs a multi-turn interaction with the agent with streaming, allowing maintaining conversation histories across turns

```ts
// Two types of inputs
const userPrompt = 'What is the weather like in New York City today?';
const messages = [
  { role: 'user', content: 'My name is David.' }
] as const;

// 1 - run
const result = await agent.run(userPrompt);
console.log(`🤖 Agent: ${result.content}`);

// 2 - stream
for await (const chunk of agent.stream(userPrompt)) {
  if (chunk.type === 'content' && chunk.delta) {
    process.stdout.write(chunk.delta);
  }
}

// 3 - chat
for await (const chunk of agent.chat(messages)) {
  if (chunk.type === 'content' && chunk.delta) {
    process.stdout.write(chunk.delta);
  }
}
```

In Seashore, an `AgentStreamChunk` object and can be one of the following types:

- ⬇️ `{ type: 'thinking', delta: string }` 
  
  The agent is thinking (reasoning) and the `delta` contains the latest thought content incrementally.

- ⬇️ `{ type: 'content', delta: string }`

  The agent is generating the response and the `delta` contains the latest content incrementally.

- ⬇️ `{ type: 'tool-call-start', toolCall: { id: string, name: string } }`

  The agent is requesting to call a tool.

- ⬇️ `{ type: 'tool-call-args', toolCall: { id: string, name: string, arguments: string } }`

  The agent is providing the arguments (as JSON string) for the tool call.

- ⬇️ `{ type: 'tool-call-end', toolCall: { id: string, name: string, arguments: string } }`

  The agent has finished providing the arguments for the tool call.

- ⬆️ `{ type: 'tool-result', toolCall: { id: string, name: string, arguments: string }, toolResult: ToolResult<T> }`

  The tool call has been satisfied and the `toolResult` contains the result returned by the tool. To know more about `ToolResult<T>`, please refer to the documentation of `@seashorelab/tools`. This

- ⬇️ `{ type: 'finish', result: AgentRunResult }`

  The agent has finished the entire run and the `result` contains the final response from the agent.

- ⬇️ `{ type: 'error', error: Error }`

  An error has occurred during the agent run. `error` is a common JavaScript `Error` object.

Here `⬇️` indicates data flowing from the agent to the user, while `⬆️` indicates data flowing from the user (tools) to the agent.