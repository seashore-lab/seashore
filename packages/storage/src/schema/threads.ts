/**
 * @seashore/storage - Threads Schema
 *
 * Drizzle schema for threads table
 */

import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

/**
 * Threads table - stores conversation sessions
 */
export const threads = pgTable('threads', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title'),
  agentId: text('agent_id').notNull(),
  userId: text('user_id'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Threads table type
 */
export type ThreadsTable = typeof threads;
