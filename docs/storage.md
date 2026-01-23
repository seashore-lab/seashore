# @seashorelab/storage

This package provides PostgreSQL-based storage for Seashore agents. It handles conversation persistence, message storage, and traces using Drizzle ORM.

## Database Setup

Create a database connection with the storage package:

```ts
import { createDatabase } from '@seashorelab/storage';

const database = createDatabase({
  connectionString: process.env.DATABASE_URL,
  maxConnections: 10,
  ssl: true,
});

// Check connection health
const isHealthy = await database.healthCheck();
if (!isHealthy) {
  throw new Error('Database connection failed');
}

// Access the underlying Drizzle instance
const db = database.db;

// Close connection when done
await database.close();
```

## Repositories

The storage package provides repositories for managing different data types:

### Thread Repository

Threads represent conversation containers:

```ts
import { createThreadRepository } from '@seashorelab/storage';

const threadRepo = createThreadRepository(database.db);

// Create a new thread
const thread = await threadRepo.create({
  title: 'Customer Support Conversation',
  agentId: 'support-agent',
  userId: 'user-123',
  metadata: {
    department: 'sales',
    priority: 'high',
  },
});

// Find threads by user
const userThreads = await threadRepo.findByUserId('user-123', {
  limit: 10,
  offset: 0,
});

// Update thread
await threadRepo.update(thread.id, {
  title: 'Updated Title',
  metadata: { ...thread.metadata, status: 'resolved' },
});

// Delete thread
await threadRepo.delete(thread.id);
```

### Message Repository

Store and retrieve messages within threads:

```ts
import { createMessageRepository } from '@seashorelab/storage';

const messageRepo = createMessageRepository(database.db);

// Create a message
const message = await messageRepo.create({
  threadId: thread.id,
  role: 'user',
  content: 'Hello, how can you help me?',
  metadata: {
    source: 'web',
  },
});

// Get all messages in a thread
const messages = await messageRepo.findByThreadId(thread.id, {
  limit: 100,
});

// Find messages by role
const userMessages = await messageRepo.findByThreadId(thread.id, {
  role: 'user',
});

// Update message content
await messageRepo.update(message.id, {
  content: 'Updated content',
});
```

### Trace Repository

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
