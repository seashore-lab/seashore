# @seashorelab/memory

This package provides memory management capabilities for Seashore agents. It supports short-term in-memory storage and long-term persistent memory with importance-based consolidation.

## Short-Term Memory

Create an in-memory store for recent conversations:

```ts
import { createShortTermMemory } from '@seashorelab/memory';

const memory = createShortTermMemory({
  maxEntries: 20, // Maximum number of memories to keep
});

// Add a memory entry
memory.add({
  agentId: 'assistant',
  threadId: 'conv-001',
  type: 'short',
  content: 'User said their name is David',
  importance: 0.7,
  metadata: {
    role: 'user',
    timestamp: new Date().toISOString(),
  },
});

// Query memories
const memories = memory.queryByAgent('assistant', {
  threadId: 'conv-001',
});

// Filter by importance
const importantMemories = memory.queryByAgent('assistant', {
  threadId: 'conv-001',
  minImportance: 0.5,
});

// Get recent memories
const recentMemories = memory.getRecent(5);

// Clear all memories
memory.dispose();
```

## Long-Term Memory

Create persistent long-term memory with database storage:

```ts
import { createLongTermMemory } from '@seashorelab/memory';
import { createDatabase } from '@seashorelab/storage';
import { openaiEmbed } from '@seashorelab/llm';

const database = createDatabase({
  connectionString: process.env.DATABASE_URL,
});

const longTermMemory = await createLongTermMemory({
  store: database.db,
  embeddings: async (texts) => {
    const embedder = openaiEmbed('text-embedding-3-small', 1536, {
      apiKey: process.env.OPENAI_API_KEY,
    });
    const result = await generateBatchEmbeddings({
      adapter: embedder,
      input: texts,
    });
    return result.embeddings;
  },
  maxEntries: 1000,
  importanceThreshold: 0.6, // Only store memories above this importance
});

// Add to long-term memory
await longTermMemory.add({
  agentId: 'assistant',
  threadId: 'conv-001',
  type: 'long',
  content: 'User is a software engineer working on AI projects',
  importance: 0.8,
  metadata: {
    category: 'profile',
  },
});

// Semantic search in long-term memory
const relevantMemories = await longTermMemory.search('What does the user do?', {
  limit: 3,
});
```

## Memory Manager

Unified memory management combining short and long-term:

```ts
import { createMemoryManager } from '@seashorelab/memory';

const memoryManager = await createMemoryManager({
  agentId: 'assistant',
  store: database.db,
  embeddings: embeddingFunction,
  shortTerm: {
    maxEntries: 20,
  },
  longTerm: {
    maxEntries: 1000,
    importanceThreshold: 0.6,
  },
  autoConsolidate: true, // Automatically move important memories to long-term
});

// Add memory - automatically routed to short or long-term
await memoryManager.add({
  threadId: 'conv-001',
  content: 'User prefers TypeScript over JavaScript',
  importance: 0.9,
});

// Query all memories (both short and long-term)
const allMemories = await memoryManager.query({
  threadId: 'conv-001',
});

// Semantic search across all memories
const relevant = await memoryManager.search('user preferences', {
  threadId: 'conv-001',
  limit: 5,
});
```

## Importance Calculation

Evaluate memory importance for consolidation:

```ts
import { calculateImportance } from '@seashorelab/memory';

// Calculate importance based on content
const importance = await calculateImportance('User shared their phone number: 555-1234');
console.log('Importance:', importance); // 0.9 (high importance)

// Custom importance calculation
const customImportance = calculateImportance('User said hello', {
  keywords: ['phone', 'email', 'address'],
  keywordWeight: 0.3,
  lengthWeight: 0.2,
  questionWeight: 0.5,
});
```

## Memory System Prompt

Generate memory-aware system prompts:

```ts
import { createMemorySystemPrompt } from '@seashorelab/memory';

const promptBuilder = createMemorySystemPrompt({
  maxMemories: 5,
  format: 'summary', // 'summary' | 'detailed'
  includeTimestamps: true,
});

const memories = memory.queryByAgent('assistant', {
  threadId: 'conv-001',
});

const systemPrompt = promptBuilder.build(memories);
// Returns: "You are a helpful assistant. Here's what you remember from the conversation:..."
```

## Agent Integration

Add memory to an agent:

```ts
import { createAgent } from '@seashorelab/agent';
import { withMemory } from '@seashorelab/memory';

const baseAgent = createAgent({
  name: 'assistant',
  model: openaiText('gpt-4o'),
  systemPrompt: 'You are a helpful assistant.',
});

const agentWithMemory = withMemory(baseAgent, {
  memory: memoryManager,
  systemPrompt: (memories) => {
    const context = memories.map(m => m.content).join('\n');
    return `You are a helpful assistant. Previous context:\n${context}`;
  },
});

// Agent automatically remembers conversations
const result = await agentWithMemory.run('My name is Alice');
const result2 = await agentWithMemory.run('What is my name?');
// Agent will remember: Alice
```

## Memory Consolidation

Automatically consolidate and summarize memories:

```ts
import { consolidateMemories } from '@seashorelab/memory';

// Group similar memories and create summaries
const consolidated = await consolidateMemories({
  memories: oldMemories,
  model: openaiText('gpt-4o'),
  strategy: 'similarity', // 'similarity' | 'time' | 'category'
  threshold: 0.8,
});

// Consolidated memories are more compact
console.log('Original:', oldMemories.length);
console.log('Consolidated:', consolidated.length);
```

## Memory Queries

Advanced querying options:

```ts
// Query by date range
const recentMemories = memory.queryByAgent('assistant', {
  threadId: 'conv-001',
  startDate: new Date('2024-01-01'),
  endDate: new Date(),
});

// Query by metadata
const profileMemories = memory.queryByAgent('assistant', {
  threadId: 'conv-001',
  metadata: {
    category: 'profile',
  },
});

// Query by content pattern
const nameMemories = memory.queryByAgent('assistant', {
  threadId: 'conv-001',
  contentContains: 'name',
});

// Combining filters
const filtered = memory.queryByAgent('assistant', {
  threadId: 'conv-001',
  minImportance: 0.5,
  metadata: { type: 'preference' },
  limit: 10,
});
```

## Memory Types

Different memory types for different purposes:

```ts
// Conversation memory
memory.add({
  type: 'conversation',
  content: 'User: Hello\nAssistant: Hi there!',
  importance: 0.5,
});

// Fact memory
memory.add({
  type: 'fact',
  content: 'User lives in San Francisco',
  importance: 0.8,
});

// Preference memory
memory.add({
  type: 'preference',
  content: 'User prefers concise answers',
  importance: 0.7,
});

// Profile memory
memory.add({
  type: 'profile',
  content: 'User is a software engineer',
  importance: 0.9,
});
```

## Memory Expiration

Set expiration times for memories:

```ts
memory.add({
  agentId: 'assistant',
  threadId: 'conv-001',
  content: 'Temporary session data',
  importance: 0.3,
  expiresAt: new Date(Date.now() + 3600000), // 1 hour
});

// Clean expired memories
memory.cleanupExpired();
```
