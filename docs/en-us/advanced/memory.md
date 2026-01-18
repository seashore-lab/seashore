# Memory Systems

Seashore supports memory at multiple levels:

- **In-process short-term memory** for lightweight chat history and scratchpad context.
- **Persistent long-term memory** backed by a database, optionally with vector search.
- **Memory manager + middleware** for integrating memory into agent prompts and tool loops.

If you want a runnable baseline, see [examples/05-basic-memory.md](../examples/05-basic-memory.md).

## What “memory” means here

There are (at least) three practical layers:

1. **Short-term**: the current thread/session history you pass into the prompt.
2. **Mid-term**: summaries and consolidated key points (reduces token growth).
3. **Long-term**: durable facts/preferences/knowledge retrieved semantically.

Seashore provides primitives for all three, but you choose how to apply them.

## Next steps

- [advanced/memory/short-term.md](./memory/short-term.md)
- [advanced/memory/mid-term.md](./memory/mid-term.md)
- [advanced/memory/long-term.md](./memory/long-term.md)
- [advanced/memory/integration.md](./memory/integration.md)
# Memory Systems

Memory systems enable agents to remember information across conversations and interactions. Seashore provides three types of memory: short-term, mid-term, and long-term.

## Overview

Memory types:

- **Short-Term**: Current conversation (in-memory)
- **Mid-Term**: Session-level (hours/days, in-memory or cached)
- **Long-Term**: Persistent across sessions (database-backed)

## Short-Term Memory

For current conversation context:

```typescript
import { createShortTermMemory, type NewMemoryEntry } from '@seashorelab/memory'

const memory = createShortTermMemory({
  maxEntries: 50, // Max items to store
})

// Add memory entry
memory.add({
  agentId: 'assistant',
  threadId: 'conv-123',
  type: 'short',
  content: 'User name is Alice',
  importance: 0.8,
  metadata: { role: 'user' },
})

// Query memories
const memories = memory.queryByAgent('assistant', {
  threadId: 'conv-123',
  type: 'short',
})

// Get summary
const summary = memory.getSummary('conv-123')
```

## Mid-Term Memory

For session-level context:

```typescript
import { createMidTermMemory } from '@seashorelab/memory'

const memory = createMidTermMemory({
  maxEntries: 100,
  ttlMs: 24 * 60 * 60 * 1000, // 24 hours
})

// Similar API to short-term
memory.add({
  agentId: 'assistant',
  threadId: 'session-456',
  type: 'mid',
  content: 'User preferences: dark mode, compact view',
  importance: 0.9,
})

const memories = memory.queryByAgent('assistant', {
  threadId: 'session-456',
})
```

## Long-Term Memory

Persistent memory across sessions:

```typescript
import { createLongTermMemory } from '@seashorelab/memory'
import { createDatabase } from '@seashorelab/storage'

const database = createDatabase({
  connectionString: process.env.DATABASE_URL,
})

const memory = createLongTermMemory({
  database,
  maxEntries: 1000,
})

// Save important information
await memory.add({
  agentId: 'assistant',
  userId: 'user-789',
  type: 'long',
  content: 'User birthday: 1990-05-15',
  importance: 1.0,
  metadata: { category: 'personal' },
})

// Retrieve across sessions
const memories = await memory.queryByUser('user-789', {
  minImportance: 0.8,
})
```

## Memory Entry Structure

```typescript
interface MemoryEntry {
  id: string              // Unique identifier
  agentId: string         // Agent identifier
  threadId?: string       // Conversation thread
  userId?: string         // User identifier
  type: 'short' | 'mid' | 'long'
  content: string         // Memory content
  importance: number      // 0-1 relevance score
  metadata?: Record<string, any>
  createdAt: Date
  expiresAt?: Date        // For mid-term memory
}
```

## Using Memory with Agents

### Manual Memory Management

```typescript
import { createAgent } from '@seashorelab/agent'
import { createShortTermMemory } from '@seashorelab/memory'

const agent = createAgent({
  name: 'memory-assistant',
  model: openaiText('gpt-4o'),
  systemPrompt: 'You remember past conversations.',
})

const memory = createShortTermMemory({ maxEntries: 50 })
const threadId = 'conv-001'

// Handle user message
const userMessage = 'My name is Alice'

// Store user message
memory.add({
  agentId: agent.name,
  threadId,
  type: 'short',
  content: `User: ${userMessage}`,
  importance: 0.7,
})

// Retrieve context
const memories = memory.queryByAgent(agent.name, { threadId })
const context = memories.map(m => m.content).join('\n')

// Query with context
const result = await agent.run(`
Past conversation:
${context}

User: ${userMessage}
`)

// Store assistant response
memory.add({
  agentId: agent.name,
  threadId,
  type: 'short',
  content: `Assistant: ${result.content}`,
  importance: 0.6,
})
```

### Memory Middleware

Automatic memory integration:

```typescript
import { withMemory } from '@seashorelab/agent'

const memoryAgent = withMemory(agent, {
  memory,
  threadId: 'conv-001',
  includeInPrompt: true,
})

// Memory is automatically managed
const result = await memoryAgent.run('What is my name?')
// Agent remembers: "Your name is Alice"
```

## Memory Querying

### By Agent

```typescript
const memories = memory.queryByAgent('assistant', {
  threadId: 'conv-123',
  type: 'short',
  limit: 10,
})
```

### By User

```typescript
const memories = await memory.queryByUser('user-789', {
  minImportance: 0.8,
  fromDate: new Date('2024-01-01'),
  limit: 50,
})
```

### By Time Range

```typescript
const memories = memory.queryByTimeRange(
  new Date('2024-01-01'),
  new Date('2024-01-31'),
  {
    agentId: 'assistant',
    minImportance: 0.5,
  }
)
```

### Semantic Search

Search memories by meaning:

```typescript
import { createSemanticMemory } from '@seashorelab/memory'

const semanticMemory = createSemanticMemory({
  embeddingFunction: embeddingFn,
  maxEntries: 100,
})

await semanticMemory.add({
  agentId: 'assistant',
  content: 'User likes hiking and outdoor activities',
  importance: 0.9,
})

const relevant = await semanticMemory.semanticSearch(
  'What does the user enjoy?',
  { k: 5 }
)
```

## Memory Importance

Assign importance scores to prioritize memories:

```typescript
memory.add({
  agentId: 'assistant',
  content: 'User birthday',
  importance: 1.0, // Critical information
})

memory.add({
  agentId: 'assistant',
  content: 'Weather discussion',
  importance: 0.3, // Casual conversation
})

// Query only important memories
const important = memory.queryByAgent('assistant', {
  minImportance: 0.7,
})
```

## Memory Summarization

Summarize conversation history:

```typescript
const summary = await memory.getSummary(threadId, {
  maxLength: 500,
  focusOn: ['key decisions', 'user preferences'],
})

console.log(summary)
// "User Alice prefers dark mode. Discussed project deadline of Jan 15."
```

## Memory Pruning

Manage memory size:

### Automatic Pruning

```typescript
const memory = createShortTermMemory({
  maxEntries: 50,
  pruneStrategy: 'least-important', // Remove low importance
})
```

### Manual Pruning

```typescript
// Remove old entries
memory.prune({
  olderThan: new Date('2024-01-01'),
  minImportance: 0.5,
})

// Keep only recent
memory.prune({
  keepRecent: 20,
})
```

## Memory Patterns

### Conversation History

```typescript
const conversationMemory = createShortTermMemory({
  maxEntries: 100,
})

// Store each exchange
for (const exchange of conversation) {
  conversationMemory.add({
    agentId: 'assistant',
    threadId,
    content: `${exchange.role}: ${exchange.content}`,
    importance: 0.7,
  })
}
```

### Entity Tracking

```typescript
// Track entities mentioned
memory.add({
  agentId: 'assistant',
  content: 'Project "Phoenix" deadline: 2024-02-15',
  importance: 0.9,
  metadata: {
    entityType: 'project',
    entityName: 'Phoenix',
    attribute: 'deadline',
  },
})

// Query entities
const projects = memory.queryByAgent('assistant', {
  filter: m => m.metadata?.entityType === 'project',
})
```

### User Preferences

```typescript
memory.add({
  agentId: 'assistant',
  userId: 'user-123',
  type: 'long',
  content: 'Prefers: email notifications, dark theme, concise answers',
  importance: 1.0,
  metadata: { category: 'preferences' },
})
```

## Memory Exports

Export memory for backup or analysis:

```typescript
// Export to JSON
const exported = memory.export()
fs.writeFileSync('memory-backup.json', JSON.stringify(exported))

// Import from JSON
const data = JSON.parse(fs.readFileSync('memory-backup.json'))
memory.import(data)
```

## Best Practices

1. **Importance Scores**: Assign higher scores to critical information
2. **Metadata**: Use metadata for categorization and filtering
3. **Pruning**: Regularly prune low-importance memories
4. **Summarization**: Summarize long conversations periodically
5. **Type Selection**: Use appropriate memory type for use case
6. **Privacy**: Be careful with sensitive information in long-term memory
7. **Testing**: Test memory behavior with edge cases

## Example: Complete Memory System

```typescript
import { createAgent } from '@seashorelab/agent'
import { createShortTermMemory, createLongTermMemory } from '@seashorelab/memory'

// Short-term for conversation
const shortTerm = createShortTermMemory({ maxEntries: 50 })

// Long-term for user facts
const longTerm = createLongTermMemory({
  database,
  maxEntries: 1000,
})

const agent = createAgent({
  name: 'memory-agent',
  model: openaiText('gpt-4o'),
  systemPrompt: 'You remember conversations and user preferences.',
})

async function chat(userId: string, threadId: string, message: string) {
  // Load long-term memories about user
  const userFacts = await longTerm.queryByUser(userId, {
    minImportance: 0.8,
  })
  
  // Load recent conversation
  const recentChat = shortTerm.queryByAgent(agent.name, {
    threadId,
    limit: 10,
  })
  
  // Build context
  const context = [
    '=== User Facts ===',
    ...userFacts.map(m => m.content),
    '',
    '=== Recent Conversation ===',
    ...recentChat.map(m => m.content),
  ].join('\n')
  
  // Store user message
  shortTerm.add({
    agentId: agent.name,
    threadId,
    content: `User: ${message}`,
    importance: 0.7,
  })
  
  // Get response
  const result = await agent.run(`
${context}

User: ${message}

Respond naturally, using what you remember about the user.
`)
  
  // Store response
  shortTerm.add({
    agentId: agent.name,
    threadId,
    content: `Assistant: ${result.content}`,
    importance: 0.6,
  })
  
  // Extract and store important facts
  const facts = extractFacts(message, result.content)
  for (const fact of facts) {
    await longTerm.add({
      agentId: agent.name,
      userId,
      type: 'long',
      content: fact,
      importance: 0.9,
    })
  }
  
  return result.content
}
```

## Next Steps

- [Short-Term Memory](./memory/short-term.md) - Detailed short-term API
- [Mid-Term Memory](./memory/mid-term.md) - Session-level memory
- [Long-Term Memory](./memory/long-term.md) - Persistent memory
- [Memory Integration](./memory/integration.md) - Agent integration patterns

## Examples

- [05: Basic Memory](../examples/05-basic-memory.md) - Conversation memory
