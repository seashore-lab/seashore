# Memory Systems Tutorial

This tutorial demonstrates how to add memory capabilities to your agents, enabling them to remember and recall information from conversations. Memory systems are essential for building contextually aware AI applications that can maintain coherent multi-turn conversations.

## What You'll Learn

- How to create short-term memory with `createShortTermMemory`
- Adding and querying memory entries
- Integrating memory into agent conversations
- Building context-aware responses with memory
- Managing memory lifecycle

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
import { createShortTermMemory, type NewMemoryEntry } from '@seashore/memory';
```

## Step 2: Create Short-Term Memory

Initialize a short-term memory store:

```typescript
const memory = createShortTermMemory({
  maxEntries: 20,
});
```

**Memory Configuration:**

| Parameter | Description | Default |
|-----------|-------------|---------|
| `maxEntries` | Maximum number of entries to store | 100 |
| `ttl` | Time-to-live for entries in milliseconds | No expiration |

## Step 3: Create a Memory-Enabled Agent

Create an agent that will use memory for context:

```typescript
const agentId = 'memory-assistant';
const threadId = 'conversation-001';

const agent = createAgent({
  name: agentId,
  model: openaiText('gpt-5.1', {
    baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY || '',
  }),
  systemPrompt:
    'You are a memory-enabled assistant. Please provide coherent answers based on the conversation history.',
});
```

## Step 4: Implement a Conversation Loop

Create a loop that saves messages to memory and retrieves context:

```typescript
const userMessages = [
  'Hello! My name is Xiaoming.',
  'I enjoy programming, especially TypeScript.',
  'Do you remember what my name is?',
  'Which programming language do I like?',
];

for (const userMessage of userMessages) {
  console.log(`User: ${userMessage}`);

  // 1. Save user message to memory
  const userEntry: NewMemoryEntry = {
    agentId,
    threadId,
    type: 'short',
    content: `User said: ${userMessage}`,
    importance: 0.7,
    metadata: { role: 'user' },
  };
  memory.add(userEntry);

  // 2. Get historical memories as context
  const memories = memory.queryByAgent(agentId, { threadId });
  const context = memories.map((m: { content: string }) => m.content).join('\n');

  // 3. Build prompt with context
  const promptWithContext = `
Conversation History:
${context}

Current Question: ${userMessage}

Please answer the user's question based on the conversation history.`;

  // 4. Get agent response
  const result = await agent.run(promptWithContext);
  console.log(`Agent: ${result.content}\n`);

  // 5. Save assistant response to memory
  const assistantEntry: NewMemoryEntry = {
    agentId,
    threadId,
    type: 'short',
    content: `Assistant said: ${result.content}`,
    importance: 0.6,
    metadata: { role: 'assistant' },
  };
  memory.add(assistantEntry);
}
```

## Step 5: Query and Display Memory Statistics

```typescript
const allMemories = memory.queryByAgent(agentId);
const threadMemories = memory.queryByAgent(agentId, { threadId });

console.log(`Total memories for agent '${agentId}': ${allMemories.length}`);
console.log(`Memories in thread '${threadId}': ${threadMemories.length}`);
```

## Step 6: Clean Up Resources

```typescript
memory.dispose();
```

## Running the Example

```bash
cd D:\Projects\seashore\examples
pnpm run 05-basic-memory
```

**Expected Output:**

```
[Example 05: Memory Conversation]

--- Conversation Example ---

User: Hello! My name is Xiaoming.
Agent: Nice to see you again, Xiaoming!

User: I enjoy programming, especially TypeScript.
Agent: That's awesome, Xiaoming—TypeScript is a great choice.

User: Do you remember what my name is?
Agent: Yes, your name is Xiaoming.

User: Which programming language do I like?
Agent: You like TypeScript.

Total memories for agent 'memory-assistant': 8
Memories in thread 'conversation-001': 8
```

## Source Code

The complete source code for this example is available at:
[`examples/src/05-basic-memory.ts`](https://github.com/seahorse/seashore/blob/main/examples/src/05-basic-memory.ts)

## Key Concepts

### Memory Entry Structure

Each memory entry contains:

| Property | Type | Description |
|----------|------|-------------|
| `agentId` | string | Identifier for the agent |
| `threadId` | string | Conversation thread identifier |
| `type` | 'short' \| 'long' | Memory type classification |
| `content` | string | The actual memory content |
| `importance` | number | Relevance score (0-1) |
| `metadata` | object | Additional contextual information |

### Memory Querying

Query memories with different scopes:

```typescript
// Query all memories for an agent
const allMemories = memory.queryByAgent(agentId);

// Query memories for a specific thread
const threadMemories = memory.queryByAgent(agentId, { threadId });

// Query with filtering
const importantMemories = memory.queryByAgent(agentId, {
  threadId,
  filter: (m) => m.importance > 0.7,
});
```

### Memory Management

```typescript
// Add to memory
memory.add(entry);

// Query memories
const memories = memory.queryByAgent(agentId);

// Clear all memories
memory.clear();

// Clear specific thread
memory.clearThread(threadId);

// Dispose of memory instance
memory.dispose();
```

## Extensions

### Long-Term Memory with Vector Store

Combine short-term memory with persistent vector storage:

```typescript
import { createVectorDBRetriever } from '@seashore/vectordb';

const longTermMemory = createVectorDBRetriever({
  collection: vectorCollection,
  embeddingFn,
});

// Move important memories to long-term storage
const importantMemories = memory.queryByAgent(agentId, {
  filter: (m) => m.importance > 0.8,
});

for (const mem of importantMemories) {
  await longTermMemory.add({
    content: mem.content,
    metadata: { agentId: mem.agentId, threadId: mem.threadId },
  });
}
```

### Automatic Memory Summarization

Summarize old conversations to save space:

```typescript
async function summarizeAndArchive(memory: ShortTermMemory, threadId: string) {
  const memories = memory.queryByAgent(agentId, { threadId });

  if (memories.length > 50) {
    // Summarize first 30 messages
    const toSummarize = memories.slice(0, 30);
    const summary = await summarizeAgent.run(
      toSummarize.map(m => m.content).join('\n')
    );

    // Remove old messages and add summary
    memory.clearThread(threadId);
    memory.add({
      agentId,
      threadId,
      type: 'short',
      content: `Conversation summary: ${summary.content}`,
      importance: 0.9,
      metadata: { type: 'summary' },
    });
  }
}
```

### Memory with Importance Scoring

Use LLM to score importance automatically:

```typescript
async function scoreImportance(content: string): Promise<number> {
  const scorer = createAgent({
    name: 'importance-scorer',
    model: openaiText('gpt-5.1', { apiKey: '...' }),
    systemPrompt: 'Rate importance 0-1. Output only the number.',
  });

  const result = await scorer.run(
    `Rate importance: "${content.slice(0, 200)}"`
  );

  return parseFloat(result.content) || 0.5;
}
```

### Cross-Thread Memory Sharing

Share important information across conversations:

```typescript
// Extract key facts from conversation
const facts = memory.queryByAgent(agentId, {
  filter: (m) => m.metadata?.type === 'fact',
});

// Apply to new thread
for (const fact of facts) {
  memory.add({
    ...fact,
    threadId: newThreadId,
    metadata: { ...fact.metadata, source: 'shared' },
  });
}
```

## Best Practices

1. **Use thread IDs** - Separate conversations by thread for clarity
2. **Set importance scores** - Help prioritize what to remember
3. **Regular cleanup** - Clear or summarize old conversations
4. **Add metadata** - Store context for better retrieval
5. **Combine memory types** - Use short-term for session, long-term for persistence

## Next Steps

- Learn about **RAG pipelines** for knowledge retrieval in the [RAG Tutorial](./rag-pipeline.md)
- Explore **workflows** for complex multi-step processes in the [Workflows Tutorial](./workflows.md)
- Add **security guardrails** to protect against misuse in the [Security Guardrails Tutorial](./security-guardrails.md)
