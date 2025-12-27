/**
 * @seashore/storage - Messages Schema
 *
 * Drizzle schema for messages table
 */

import { pgTable, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { threads } from './threads';

/**
 * Tool call structure stored in messages
 */
export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * Messages table - stores conversation messages
 */
export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    threadId: uuid('thread_id')
      .notNull()
      .references(() => threads.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['user', 'assistant', 'system', 'tool'] }).notNull(),
    content: text('content'),
    toolCalls: jsonb('tool_calls').$type<ToolCall[]>(),
    toolCallId: text('tool_call_id'),
    name: text('name'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('messages_thread_id_idx').on(table.threadId),
    index('messages_created_at_idx').on(table.createdAt),
  ]
);

/**
 * Messages table type
 */
export type MessagesTable = typeof messages;
