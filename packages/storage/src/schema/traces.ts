/**
 * @seashore/storage - Traces Schema
 *
 * Drizzle schema for traces table (observability)
 */

import { pgTable, uuid, text, timestamp, jsonb, integer, index } from 'drizzle-orm/pg-core';
import { threads } from './threads.js';

/**
 * Token usage structure
 */
interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Traces table - stores execution traces for observability
 */
export const traces = pgTable(
  'traces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    threadId: uuid('thread_id').references(() => threads.id, { onDelete: 'set null' }),
    parentId: uuid('parent_id'),
    name: text('name').notNull(),
    type: text('type', {
      enum: ['agent', 'tool', 'llm', 'retriever', 'embedding', 'chain'],
    }).notNull(),
    input: jsonb('input').$type<unknown>(),
    output: jsonb('output').$type<unknown>(),
    error: text('error'),
    tokenUsage: jsonb('token_usage').$type<TokenUsage>(),
    durationMs: integer('duration_ms'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
  },
  (table) => [
    index('traces_thread_id_idx').on(table.threadId),
    index('traces_parent_id_idx').on(table.parentId),
    index('traces_started_at_idx').on(table.startedAt),
  ]
);

/**
 * Traces table type
 */
export type TracesTable = typeof traces;
