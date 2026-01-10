# @seashore/memory

Memory management for agents with short-term, mid-term, and long-term storage.

## Installation

```bash
pnpm add @seashore/memory
```

Required peer dependencies:
```bash
pnpm add @seashore/storage @seashore/vectordb @seashore/llm
```

## Overview

`@seashore/memory` provides:

- Multi-tier memory system (short, mid, long-term)
- Importance-based memory filtering
- Semantic search with vector embeddings
- Automatic memory consolidation
- Agent integration with automatic memory management

## Quick Start

### Creating a Memory Manager

```typescript
import { createMemoryManager } from '@seashore/memory'
import { openaiEmbed } from '@seashore/llm'
import { createDatabase } from '@seashore/storage'

const db = createDatabase({ connectionString: process.env.DATABASE_URL })

const memoryManager = createMemoryManager({
  db,
  embeddingAdapter: openaiEmbed('text-embedding-3-small'),

  // Short-term memory (session buffer)
  shortTerm: {
    maxEntries: 100,
  },

  // Long-term memory (knowledge base)
  longTerm: {
    maxEntries: 1000,
    importanceThreshold: 0.7, // Only store important memories
    enableVectorSearch: true,
  },
})
```

### Storing and Retrieving Memories

```typescript
// Store a memory
await memoryManager.store({
  type: 'short',
  key: 'current_task',
  value: { task: 'Write a report', progress: 0.5 },
  userId: 'user-123',
  agentId: 'assistant',
})

// Retrieve by key
const memory = await memoryManager.get('current_task', {
  userId: 'user-123',
  agentId: 'assistant',
})

// Semantic search
const results = await memoryManager.search({
  query: 'user preferences',
  type: 'long',
  userId: 'user-123',
  topK: 5,
  minScore: 0.7,
})
```

## API Reference

### createMemoryManager

Creates a memory manager instance.

```typescript
function createMemoryManager(config: MemoryConfig): MemoryManager
```

#### Configuration

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `db` | `Database` | Yes | Database instance |
| `embeddingAdapter` | `EmbeddingAdapter` | Yes | For semantic search |
| `shortTerm.maxEntries` | `number` | No | Max short-term memories (default: 100) |
| `longTerm.maxEntries` | `number` | No | Max long-term memories (default: 1000) |
| `longTerm.importanceThreshold` | `number` | No | Min importance for long-term (default: 0.7) |
| `autoConsolidate.enabled` | `boolean` | No | Enable auto consolidation |
| `autoConsolidate.intervalMs` | `number` | No | Consolidation interval |

### Memory Manager Methods

#### store()

Store a new memory.

```typescript
await memoryManager.store({
  type: 'short' | 'mid' | 'long',
  key: string,
  value: unknown,
  userId?: string,
  agentId?: string,
  sessionId?: string,
  importance?: number, // 0-1
  expiresAt?: Date,
  metadata?: Record<string, unknown>,
})
```

#### get()

Retrieve a memory by key.

```typescript
const memory = await memoryManager.get(key, {
  userId?: string,
  agentId?: string,
  sessionId?: string,
})
```

#### search()

Semantic search for memories.

```typescript
const results = await memoryManager.search({
  query: string,
  type?: 'short' | 'mid' | 'long',
  userId?: string,
  agentId?: string,
  topK?: number,
  minScore?: number,
})
```

Returns:
```typescript
Array<{
  memory: MemoryEntry
  score: number // Similarity score
}>
```

#### list()

List memories with filtering.

```typescript
const memories = await memoryManager.list({
  userId?: string,
  agentId?: string,
  type?: 'short' | 'mid' | 'long',
  orderBy?: 'createdAt' | 'importance' | 'lastAccessedAt',
  order?: 'asc' | 'desc',
  limit?: number,
})
```

#### update()

Update an existing memory.

```typescript
await memoryManager.update(key, updates, {
  userId?: string,
  agentId?: string,
})
```

#### updateImportance()

Update memory importance score.

```typescript
await memoryManager.updateImportance(key, importance, {
  userId?: string,
  agentId?: string,
})
```

#### delete()

Delete a memory.

```typescript
await memoryManager.delete(key, {
  userId?: string,
  agentId?: string,
})
```

#### deleteExpired()

Remove all expired memories.

```typescript
const deleted = await memoryManager.deleteExpired()
```

#### clear()

Clear all memories matching criteria.

```typescript
await memoryManager.clear({
  userId?: string,
  agentId?: string,
  type?: 'short' | 'mid' | 'long',
})
```

## Memory Consolidation

### Manual Consolidation

```typescript
const consolidated = await memoryManager.consolidate({
  userId: 'user-123',
  agentId: 'assistant',
  strategy: 'importance', // 'importance' | 'frequency' | 'recency'
  threshold: 0.7,
})

console.log(`Consolidated ${consolidated.count} memories`)
```

### Automatic Consolidation

```typescript
const memoryManager = createMemoryManager({
  db,
  embeddingAdapter: openaiEmbed('text-embedding-3-small'),
  autoConsolidate: {
    enabled: true,
    intervalMs: 1000 * 60 * 60, // Every hour
    strategy: 'importance',
    threshold: 0.7,
  },
})

// Manually trigger consolidation
await memoryManager.runConsolidationCycle()
```

## Importance Evaluation

### Using LLM to Evaluate Importance

```typescript
import { createImportanceEvaluator } from '@seashore/memory'
import { openaiText } from '@seashore/llm'

const evaluator = createImportanceEvaluator({
  adapter: openaiText('gpt-4o-mini'),
})

// Evaluate single memory
const score = await evaluator.evaluate({
  key: 'user_statement',
  value: { statement: 'I am learning Rust programming' },
  context: 'User chatting with programming assistant',
})

console.log('Importance score:', score) // 0.0 - 1.0

// Batch evaluation
const scores = await evaluator.evaluateBatch([
  { key: 'greeting', value: { message: 'Hello' } },
  { key: 'goal', value: { goal: 'I want to become a full-stack developer' } },
])
```

## Agent Integration

### withMemory

Add memory capabilities to an agent.

```typescript
import { createAgent } from '@seashore/agent'
import { withMemory } from '@seashore/memory'

const agent = createAgent({
  name: 'memory-agent',
  adapter: openaiText('gpt-4o'),
})

const agentWithMemory = withMemory(agent, {
  memoryManager,

  // Auto-store strategy
  autoStore: {
    userPreferences: true,
    facts: true,
    summaries: {
      enabled: true,
      afterMessages: 10, // Generate summary every 10 messages
    },
  },

  // Auto-retrieve strategy
  autoRetrieve: {
    contextInjection: true,
    maxMemories: 5,
    minScore: 0.7,
  },
})

// Agent automatically manages memories
const result = await agentWithMemory.run({
  userId: 'user-123',
  messages: [{ role: 'user', content: 'Remember I like using TypeScript' }],
})
```

## Memory Types

### Short-term Memory

- Volatile session data
- Current task state
- Temporary context
- Quick access pattern

### Mid-term Memory

- User preferences
- Recent interactions
- Session summaries
- Medium-persistence data

### Long-term Memory

- Important facts about users
- Learned information
- Knowledge base entries
- Semantic search enabled

## Database Schema

The package uses the following schema (defined in `@seashore/storage`):

```typescript
{
  id: string
  type: 'short' | 'mid' | 'long'
  key: string
  value: unknown
  userId: string | null
  agentId: string | null
  sessionId: string | null
  embedding: number[] | null
  importance: number
  accessCount: number
  lastAccessedAt: Date | null
  expiresAt: Date | null
  metadata: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}
```

## Best Practices

1. **Set appropriate importance scores** (0-1) for memories
2. **Use semantic search** for long-term memory retrieval
3. **Enable auto-consolidation** for production systems
4. **Regularly clean expired memories** to manage storage
5. **Use withMemory helper** for automatic agent memory management

## See Also

- [Memory Core Concept](../core-concepts/memory.md)
- [Storage Package](storage.md)
- [VectorDB Package](vectordb.md)
- [Agent Package](agent.md)
