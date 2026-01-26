import {
  createDatabase,
  createThreadRepository,
  createMessageRepository,
} from '@seashorelab/storage';
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
const userThreads = await threadRepo.findByUserId('david');

// Update a thread by its ID
await threadRepo.update(thread.id, {
  metadata: {
    status: 'archived',
  },
});

// Delete a thread by its ID
await threadRepo.delete(thread.id);

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
