/**
 * @seashore/storage - Message Repository
 *
 * Repository for message CRUD operations
 */

import { eq, desc, asc } from 'drizzle-orm';
import type { DrizzleDB } from '../database';
import { messages } from '../schema/messages';
import type { Message, NewMessage, ListOptions } from '../types';

/**
 * Message repository interface
 */
export interface MessageRepository {
  /** Create a new message */
  create(data: NewMessage): Promise<Message>;

  /** Create multiple messages */
  createMany(data: NewMessage[]): Promise<Message[]>;

  /** Find message by ID */
  findById(id: string): Promise<Message | null>;

  /** Find messages by thread ID */
  findByThreadId(threadId: string, options?: ListOptions): Promise<Message[]>;

  /** Delete a message */
  delete(id: string): Promise<boolean>;

  /** Delete all messages in a thread */
  deleteByThreadId(threadId: string): Promise<number>;
}

/**
 * Create a message repository
 *
 * @example
 * ```typescript
 * import { createDatabase, createMessageRepository } from '@seashore/storage';
 *
 * const database = createDatabase({ connectionString: process.env.DATABASE_URL! });
 * const messageRepo = createMessageRepository(database.db);
 *
 * const message = await messageRepo.create({
 *   threadId: 'thread-123',
 *   role: 'user',
 *   content: 'Hello!',
 * });
 * ```
 */
export function createMessageRepository(db: DrizzleDB): MessageRepository {
  return {
    async create(data: NewMessage): Promise<Message> {
      const [message] = await db
        .insert(messages)
        .values({
          threadId: data.threadId,
          role: data.role,
          content: data.content ?? null,
          toolCalls: (data.toolCalls as any) ?? null,
          toolCallId: data.toolCallId ?? null,
          name: data.name ?? null,
          metadata: data.metadata ?? null,
        })
        .returning();

      if (message === undefined) {
        throw new Error('Failed to create message');
      }

      return mapMessage(message);
    },

    async createMany(data: NewMessage[]): Promise<Message[]> {
      if (data.length === 0) {
        return [];
      }

      const result = await db
        .insert(messages)
        .values(
          data.map((d) => ({
            threadId: d.threadId,
            role: d.role,
            content: d.content ?? null,
            toolCalls: (d.toolCalls as any) ?? null,
            toolCallId: d.toolCallId ?? null,
            name: d.name ?? null,
            metadata: d.metadata ?? null,
          }))
        )
        .returning();

      return result.map(mapMessage);
    },

    async findById(id: string): Promise<Message | null> {
      const [message] = await db.select().from(messages).where(eq(messages.id, id)).limit(1);

      return message !== undefined ? mapMessage(message) : null;
    },

    async findByThreadId(threadId: string, options: ListOptions = {}): Promise<Message[]> {
      const { limit = 100, offset = 0, order = 'asc' } = options;

      const orderFn = order === 'desc' ? desc : asc;

      const result = await db
        .select()
        .from(messages)
        .where(eq(messages.threadId, threadId))
        .orderBy(orderFn(messages.createdAt))
        .limit(limit)
        .offset(offset);

      return result.map(mapMessage);
    },

    async delete(id: string): Promise<boolean> {
      const result = await db
        .delete(messages)
        .where(eq(messages.id, id))
        .returning({ id: messages.id });

      return result.length > 0;
    },

    async deleteByThreadId(threadId: string): Promise<number> {
      const result = await db
        .delete(messages)
        .where(eq(messages.threadId, threadId))
        .returning({ id: messages.id });

      return result.length;
    },
  };
}

/**
 * Map database row to Message type
 */
function mapMessage(row: typeof messages.$inferSelect): Message {
  return {
    id: row.id,
    threadId: row.threadId,
    role: row.role as Message['role'],
    content: row.content,
    toolCalls: row.toolCalls,
    toolCallId: row.toolCallId,
    name: row.name,
    metadata: row.metadata,
    createdAt: row.createdAt,
  };
}
