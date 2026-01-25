# @seashorelab/storage

This package provides PostgreSQL-based storage for Seashore agents. It handles conversation persistence, message storage, and traces using Drizzle ORM.

Since PostgreSQL not only offers robust relational capabilities but also supports vector data types via pgvector, it is well-suited for managing the complex data structures involved in agent interactions and RAG.

## Database Setup

To create a Seashore database instance, use the `createDatabase` function
with a connection string:

```ts
import { createDatabase } from '@seashorelab/storage';
import { PostgreSqlContainer } from '@testcontainers/postgresql';

const container = await new PostgreSqlContainer('postgres:16')
  .withDatabase('seashore_storage_demo')
  .withUsername('demo')
  .withPassword('demo')
  .withExposedPorts({ container: 5432, host: 5432 })
  .start();

const database = createDatabase({
  connectionString: container.getConnectionUri(),
});

console.log('Database healthy:', await database.healthCheck());
```

## Data Structures

The storage package manages the following core data structures:

- **Threads**: Containers for conversations, holding metadata like agent ID, user ID, and custom attributes.
- **Messages**: Individual messages within threads, including role (user, assistant), content, tool calls, and metadata.
- **Traces**: Execution traces for observability, capturing inputs, outputs, and metadata for agent runs and tool invocations.

A thread is like a post in a forum, while messages are the comments within that post. Traces provide a behind-the-scenes look at how the agent processed information.

To know more about the schema of each data structure, please refer to the `packages/storage/src/schema` folder.


## Thread Repository

The following example demonstrates the CRUD operations of the Thread Repository to manage conversation threads:

```ts
import { createThreadRepository } from '@seashorelab/storage';

// Get a thread repository
const threadRepo = createThreadRepository(database.db);

// Create a new thread
const thread = await threadRepo.create({
  agentId: 'my-agent', // The agent that responded in this thread
  userId: 'david', // The user that started this thread
  title: 'Hello World', // Optional title for the conversation
  // Any additional metadata
  metadata: {
    status: 'active',
  },
});

// Get threads belonging to a user
// Default limit is 50 and by createdAt desc
// Valid `order` columns: createdAt, updatedAt, title
const userThreads = await threadRepo.findByUserId('david');

// Update a thread by its ID
await threadRepo.update(thread.id, {
  metadata: {
    status: 'archived',
  },
});

// Delete a thread by its ID
await threadRepo.delete(thread.id);
```

## Message Repository

The following example demonstrates the CRUD operations of the Message Repository to manage messages within threads:

```ts
import { createMessageRepository } from '@seashorelab/storage';

// Get a message repository
const messageRepo = createMessageRepository(database.db);

// Create a new message in the thread
const message = await messageRepo.create({
  threadId: thread.id, // Each message must belong to a thread
  role: 'user', // The role of the message
  content: 'Hello, how are you?', // The content of the message
  // Any additional metadata
  metadata: {
    platform: 'web',
  },
});

// Get all messages in a thread
// Default limit is 100 and by createdAt asc
const messages = await messageRepo.findByThreadId(thread.id);
```

## Trace Repository

Store execution traces for observability:

```ts
import { createTraceRepository } from '@seashorelab/storage';

const traceRepo = createTraceRepository(database.db);

// Create a trace
const trace = await traceRepo.create({
  type: 'agent_run',
  agentId: 'my-agent',
  threadId: thread.id,
  input: { query: 'test' },
  output: { result: 'success' },
  metadata: {
    model: 'gpt-4',
    durationMs: 1500,
  },
});

// Find traces by agent
const traces = await traceRepo.findByAgentId('my-agent', {
  limit: 50,
});
```

## Persistence Middleware

Automatically persist agent messages using middleware:

```ts
import { createPersistenceMiddleware } from '@seashorelab/storage';

const middleware = createPersistenceMiddleware({
  db: database.db,
  autoCreateThread: true,
  defaultAgentId: 'my-agent',
  persistMessages: true,
  onMessagePersisted: (message) => {
    console.log(`Saved message: ${message.id}`);
  },
});

// Ensure a thread exists
await middleware.ensureThread(threadId, {
  agentId: 'my-agent',
  userId: 'user-123',
});

// Persist messages automatically
await middleware.persistMessage({
  type: 'user',
  threadId: threadId,
  role: 'user',
  content: 'Hello!',
});
```

## Query Builder

Use the query builder for complex queries:

```ts
import { ThreadQueryBuilder, MessageQueryBuilder } from '@seashorelab/storage';

// Query threads with filters
const threads = await new ThreadQueryBuilder(database.db)
  .where('agentId', '=', 'my-agent')
  .where('createdAt', '>', new Date('2024-01-01'))
  .orderBy('createdAt', 'desc')
  .limit(10)
  .execute();

// Query messages with date range
const messages = await new MessageQueryBuilder(database.db)
  .where('threadId', '=', threadId)
  .where('role', 'in', ['user', 'assistant'])
  .dateRange('createdAt', {
    start: new Date('2024-01-01'),
    end: new Date(),
  })
  .execute();
```

## Database Schema

The storage package uses the following schema:

- **threads**: Conversation containers with metadata
- **messages**: Individual messages with role, content, and tool calls
- **traces**: Execution traces for observability
- **sessions**: User session management

Run migrations to set up the schema:

```sql
-- See packages/storage/drizzle/0000_initial.sql
-- This creates all necessary tables and indexes
```

## Direct Drizzle Access

You can also use Drizzle directly with the provided query helpers:

```ts
import { threads, messages, eq, and, desc } from '@seashorelab/storage';

const result = await database.db
  .select()
  .from(threads)
  .where(and(
    eq(threads.agentId, 'my-agent'),
    eq(threads.userId, 'user-123')
  ))
  .orderBy(desc(threads.createdAt))
  .limit(10);
```

## Connection Pooling

The database connection is managed with a connection pool:

```ts
const database = createDatabase({
  connectionString: process.env.DATABASE_URL,
  maxConnections: 20, // Maximum pool size
  ssl: {
    rejectUnauthorized: false, // For self-signed certs
  },
});

// The pool automatically manages connections
// No need to manually acquire/release connections
```
