/**
 * Example 12 - Storage and Persistence
 *
 * This example demonstrates how to use Seashore's storage layer for persisting conversations.
 * It automatically spins up a PostgreSQL container using testcontainers for the demo.
 */

import 'dotenv/config';
import { createAgent } from '@seashore/agent';
import { openaiText } from '@seashore/llm';
import { defineTool } from '@seashore/tool';
import {
  createDatabase,
  createThreadRepository,
  createMessageRepository,
  createPersistenceMiddleware,
} from '@seashore/storage';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple note-taking tool to demonstrate persistence
const notesTool = defineTool({
  name: 'save_note',
  description: 'Save a note for future reference',
  inputSchema: z.object({
    title: z.string().describe('Note title'),
    content: z.string().describe('Note content'),
  }),
  execute: async (input) => {
    const { title, content } = input;
    console.log(`   📝 Saved note: "${title}"`);
    return {
      saved: true,
      title,
      noteId: crypto.randomUUID(),
    };
  },
});

async function main() {
  console.log('[Example 12: Storage and Persistence]\n');

  let container;
  let database;

  try {
    console.log('--- Step 1: Start PostgreSQL Container ---\n');

    console.log('   🐳 Starting PostgreSQL container...');
    console.log('   This may take a moment on first run (downloading image)\n');

    // Start PostgreSQL container (same setup as tests)
    container = await new PostgreSqlContainer('postgres:16')
      .withDatabase('seashore_demo')
      .withUsername('demo')
      .withPassword('demo')
      .start();

    const connectionString = container.getConnectionUri();
    console.log('   ✅ PostgreSQL container started');
    console.log(`   📍 Connection: ${connectionString.replace(/\/\/.*@/, '//***@')}\n`);

    console.log('--- Step 2: Initialize Database ---\n');

    // Create database connection
    database = createDatabase({
      connectionString,
      maxConnections: 10,
      ssl: false,
    });

    // Check database health
    const isHealthy = await database.healthCheck();
    if (!isHealthy) {
      throw new Error('Database health check failed');
    }
    console.log('   ✅ Database connection healthy\n');

    // Run migrations
    console.log('   📦 Running database migrations...');
    const migrationPath = resolve(__dirname, '../../packages/storage/drizzle/0000_initial.sql');
    const migrationSql = readFileSync(migrationPath, 'utf-8');

    const client = postgres(connectionString);
    await client.unsafe(migrationSql);
    await client.end();

    console.log('   ✅ Database schema created\n');

    console.log('--- Step 3: Create Repositories ---\n');

    // Create repositories for managing data
    const threadRepo = createThreadRepository(database.db);
    const messageRepo = createMessageRepository(database.db);

    console.log('   ✅ Thread repository created');
    console.log('   ✅ Message repository created\n');

    console.log('--- Step 4: Create a Thread (Conversation Container) ---\n');

    // Create a new thread for the conversation
    const thread = await threadRepo.create({
      title: 'Storage Demo Conversation',
      agentId: 'storage-demo-agent',
      userId: 'demo-user',
      metadata: {
        example: 'storage-persistence',
        timestamp: new Date().toISOString(),
      },
    });

    console.log(`   ✅ Created thread: ${thread.id}`);
    console.log(`      Title: ${thread.title}`);
    console.log(`      Agent: ${thread.agentId}\n`);

    console.log('--- Step 5: Manual Message Persistence ---\n');

    // Create an agent
    const agent = createAgent({
      name: 'storage-assistant',
      model: openaiText('gpt-5.1', {
        baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
        apiKey: process.env.OPENAI_API_KEY || '',
      }),
      systemPrompt: 'You are a helpful assistant that can save notes. Keep responses concise.',
      tools: [notesTool],
    });

    // First interaction - manually save messages
    const userMessage1 =
      'Hello! Can you save a note titled "Meeting" with content "Discuss Q1 goals"?';
    console.log(`📝 User: ${userMessage1}`);

    // Save user message
    const savedUserMsg = await messageRepo.create({
      threadId: thread.id,
      role: 'user',
      content: userMessage1,
    });
    console.log(`   ✅ Saved user message: ${savedUserMsg.id}`);

    // Get agent response
    const result1 = await agent.run(userMessage1);
    console.log(`🤖 Agent: ${result1.content}`);

    // Save assistant message
    const savedAssistantMsg = await messageRepo.create({
      threadId: thread.id,
      role: 'assistant',
      content: result1.content,
      metadata: {
        model: 'gpt-5.1',
        usage: result1.usage,
      },
    });
    console.log(`   ✅ Saved assistant message: ${savedAssistantMsg.id}\n`);

    console.log('--- Step 6: Automatic Persistence with Middleware ---\n');

    // Create persistence middleware for automatic message saving
    const middleware = createPersistenceMiddleware({
      db: database.db,
      autoCreateThread: true,
      defaultAgentId: 'storage-demo-agent',
      persistMessages: true,
      onMessagePersisted: (message: { id: string; role: string }) => {
        console.log(`   ✅ Auto-saved message: ${message.id} (${message.role})`);
      },
    });

    console.log('   ✅ Persistence middleware created\n');

    // Second interaction - use middleware for auto-save
    const userMessage2 = 'What notes did I save?';
    console.log(`📝 User: ${userMessage2}`);

    // Ensure thread exists in middleware
    await middleware.ensureThread(thread.id, {
      agentId: 'storage-demo-agent',
      userId: 'demo-user',
    });

    // Auto-persist user message
    await middleware.persistMessage({
      type: 'user',
      threadId: thread.id,
      role: 'user',
      content: userMessage2,
    });

    // Get agent response
    const result2 = await agent.run(userMessage2);
    console.log(`🤖 Agent: ${result2.content}`);

    // Auto-persist assistant message
    await middleware.persistMessage({
      type: 'assistant',
      threadId: thread.id,
      role: 'assistant',
      content: result2.content,
    });

    console.log();

    console.log('--- Step 7: Query Conversation History ---\n');

    // Retrieve all messages from the thread
    const history = await messageRepo.findByThreadId(thread.id);
    console.log(`   📚 Retrieved ${history.length} messages from thread history:\n`);

    history.forEach(
      (
        msg: { id: string; role: string; content?: string | null; createdAt: Date },
        idx: number
      ) => {
        const preview = msg.content?.substring(0, 60) || '[no content]';
        console.log(`   ${idx + 1}. [${msg.role}] ${preview}...`);
        console.log(`      ID: ${msg.id} | Created: ${msg.createdAt.toISOString()}`);
      }
    );

    console.log();

    console.log('--- Step 8: Thread Management ---\n');

    // List all threads for a user
    const userThreads = await threadRepo.findByUserId('demo-user', { limit: 10 });
    console.log(`   📋 Found ${userThreads.length} threads for user 'demo-user':`);

    for (const t of userThreads) {
      // Count messages for each thread
      const threadMessages = await messageRepo.findByThreadId(t.id);
      console.log(`      - ${t.title} (${threadMessages.length} messages)`);
    }

    // Update thread metadata
    await threadRepo.update(thread.id, {
      metadata: {
        ...thread.metadata,
        completed: true,
        completedAt: new Date().toISOString(),
      },
    });

    console.log(`\n   ✅ Updated thread metadata: completed = true\n`);
  } finally {
    console.log('--- Cleanup ---\n');

    // Close database connection
    if (database) {
      await database.close();
      console.log('   ✅ Database connection closed');
    }

    // Stop container
    if (container) {
      await container.stop();
      console.log('   ✅ PostgreSQL container stopped\n');
    }
  }
}

main().catch(console.error);

// [Example 12: Storage and Persistence]

// --- Step 1: Start PostgreSQL Container ---

//    🐳 Starting PostgreSQL container...
//    This may take a moment on first run (downloading image)

//    ✅ PostgreSQL container started
//    📍 Connection: postgres://***@localhost:32769/seashore_demo

// --- Step 2: Initialize Database ---

//    ✅ Database connection healthy

//    📦 Running database migrations...
//    ✅ Database schema created

// --- Step 3: Create Repositories ---

//    ✅ Thread repository created
//    ✅ Message repository created

// --- Step 4: Create a Thread (Conversation Container) ---

//    ✅ Created thread: a405fb0b-c36a-4abc-9931-16fcde4e00cd
//       Title: Storage Demo Conversation
//       Agent: storage-demo-agent

// --- Step 5: Manual Message Persistence ---

// 📝 User: Hello! Can you save a note titled "Meeting" with content "Discuss Q1 goals"?
//    ✅ Saved user message: cc39dce4-ef65-44e7-8425-d1264d66a660
//    📝 Saved note: "Meeting"
// 🤖 Agent: Your note has been saved with the title "Meeting" and content "Discuss Q1 goals."
//    ✅ Saved assistant message: 974ae240-8f21-4eae-94e7-80391f8429c4

// --- Step 6: Automatic Persistence with Middleware ---

//    ✅ Persistence middleware created

// 📝 User: What notes did I save?
//    ✅ Auto-saved message: b854feac-0e97-4cd8-a023-55f9234377d3 (user)
// 🤖 Agent: I don’t have access to any previously saved notes or past interactions in this environment, so I can’t see notes you may have saved before.

// If you tell me what you’d like to keep, I can save new notes for you going forward.
//    ✅ Auto-saved message: f6c7ba39-dafa-47a5-b0a2-ffec8038b735 (assistant)

// --- Step 7: Query Conversation History ---

//    📚 Retrieved 4 messages from thread history:

//    1. [user] Hello! Can you save a note titled "Meeting" with content "Di...
//       ID: cc39dce4-ef65-44e7-8425-d1264d66a660 | Created: 2026-01-14T16:53:42.878Z
//    2. [assistant] Your note has been saved with the title "Meeting" and conten...
//       ID: 974ae240-8f21-4eae-94e7-80391f8429c4 | Created: 2026-01-14T16:53:47.045Z
//    3. [user] What notes did I save?...
//       ID: b854feac-0e97-4cd8-a023-55f9234377d3 | Created: 2026-01-14T16:53:47.065Z
//    4. [assistant] I don’t have access to any previously saved notes or past in...
//       ID: f6c7ba39-dafa-47a5-b0a2-ffec8038b735 | Created: 2026-01-14T16:53:49.056Z

// --- Step 8: Thread Management ---

//    📋 Found 1 threads for user 'demo-user':
//       - Storage Demo Conversation (4 messages)

//    ✅ Updated thread metadata: completed = true

// --- Cleanup ---

//    ✅ Database connection closed
//    ✅ PostgreSQL container stopped
