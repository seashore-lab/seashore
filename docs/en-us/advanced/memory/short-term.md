# Short-Term Memory

Short-term memory is a lightweight, in-process store intended for:

- small chat history windows
- tool output caching within a run
- building a “conversation history” block for the next prompt

This is the pattern used in Example 05.

## Example

```ts
import { createShortTermMemory, type NewMemoryEntry } from '@seashore/memory'

const memory = createShortTermMemory({ maxEntries: 20 })

const entry: NewMemoryEntry = {
  agentId: 'memory-assistant',
  threadId: 'conversation-001',
  type: 'short',
  content: 'User said: Hello!',
  importance: 0.7,
  metadata: { role: 'user' },
}

memory.add(entry)
const items = memory.queryByAgent('memory-assistant', { threadId: 'conversation-001' })
```

## Best practices

- Keep short-term memory *small* and *recent*. You can always persist important facts to long-term memory.
- Store structured metadata (role, tool name, timestamps) so you can summarize/filter later.
