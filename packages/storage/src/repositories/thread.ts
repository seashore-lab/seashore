/**
 * @seashorelab/storage - Thread Repository
 *
 * Repository for thread CRUD operations
 */

import { eq, desc, asc } from 'drizzle-orm';
import type { DrizzleDB } from '../database';
import { threads } from '../schema/threads';
import type { Thread, NewThread, UpdateThread, ListOptions } from '../types';

/**
 * Thread repository interface
 */
export interface ThreadRepository {
  /** Create a new thread */
  create(data: NewThread): Promise<Thread>;

  /** Find thread by ID */
  findById(id: string): Promise<Thread | null>;

  /** Find threads by user ID */
  findByUserId(userId: string, options?: ListOptions): Promise<Thread[]>;

  /** Find threads by agent ID */
  findByAgentId(agentId: string, options?: ListOptions): Promise<Thread[]>;

  /** Update a thread */
  update(id: string, data: UpdateThread): Promise<Thread | null>;

  /** Delete a thread */
  delete(id: string): Promise<boolean>;

  /** List all threads with pagination */
  list(options?: ListOptions): Promise<Thread[]>;
}

/**
 * Create a thread repository
 *
 * @example
 * ```typescript
 * import { createDatabase, createThreadRepository } from '@seashorelab/storage';
 *
 * const database = createDatabase({ connectionString: process.env.DATABASE_URL! });
 * const threadRepo = createThreadRepository(database.db);
 *
 * const thread = await threadRepo.create({
 *   agentId: 'my-agent',
 *   userId: 'user-123',
 *   title: 'New Conversation',
 * });
 * ```
 */
export function createThreadRepository(db: DrizzleDB): ThreadRepository {
  return {
    async create(data: NewThread): Promise<Thread> {
      const [thread] = await db
        .insert(threads)
        .values({
          agentId: data.agentId,
          title: data.title ?? null,
          userId: data.userId ?? null,
          metadata: data.metadata ?? null,
        })
        .returning();

      if (thread === undefined) {
        throw new Error('Failed to create thread');
      }

      return mapThread(thread);
    },

    async findById(id: string): Promise<Thread | null> {
      const [thread] = await db.select().from(threads).where(eq(threads.id, id)).limit(1);

      return thread !== undefined ? mapThread(thread) : null;
    },

    async findByUserId(userId: string, options: ListOptions = {}): Promise<Thread[]> {
      const { limit = 50, offset = 0, orderBy = 'createdAt', order = 'desc' } = options;

      const orderColumn = getOrderColumn(orderBy);
      const orderFn = order === 'desc' ? desc : asc;

      const result = await db
        .select()
        .from(threads)
        .where(eq(threads.userId, userId))
        .orderBy(orderFn(orderColumn))
        .limit(limit)
        .offset(offset);

      return result.map(mapThread);
    },

    async findByAgentId(agentId: string, options: ListOptions = {}): Promise<Thread[]> {
      const { limit = 50, offset = 0, orderBy = 'createdAt', order = 'desc' } = options;

      const orderColumn = getOrderColumn(orderBy);
      const orderFn = order === 'desc' ? desc : asc;

      const result = await db
        .select()
        .from(threads)
        .where(eq(threads.agentId, agentId))
        .orderBy(orderFn(orderColumn))
        .limit(limit)
        .offset(offset);

      return result.map(mapThread);
    },

    async update(id: string, data: UpdateThread): Promise<Thread | null> {
      const [thread] = await db
        .update(threads)
        .set({
          ...(data.title !== undefined && { title: data.title }),
          ...(data.metadata !== undefined && { metadata: data.metadata }),
          updatedAt: new Date(),
        })
        .where(eq(threads.id, id))
        .returning();

      return thread !== undefined ? mapThread(thread) : null;
    },

    async delete(id: string): Promise<boolean> {
      const result = await db
        .delete(threads)
        .where(eq(threads.id, id))
        .returning({ id: threads.id });

      return result.length > 0;
    },

    async list(options: ListOptions = {}): Promise<Thread[]> {
      const { limit = 50, offset = 0, orderBy = 'createdAt', order = 'desc' } = options;

      const orderColumn = getOrderColumn(orderBy);
      const orderFn = order === 'desc' ? desc : asc;

      const result = await db
        .select()
        .from(threads)
        .orderBy(orderFn(orderColumn))
        .limit(limit)
        .offset(offset);

      return result.map(mapThread);
    },
  };
}

/**
 * Map database row to Thread type
 */
function mapThread(row: typeof threads.$inferSelect): Thread {
  return {
    id: row.id,
    title: row.title,
    agentId: row.agentId,
    userId: row.userId,
    metadata: row.metadata,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Get order column from string
 */
function getOrderColumn(orderBy: string) {
  switch (orderBy) {
    case 'title':
      return threads.title;
    case 'updatedAt':
      return threads.updatedAt;
    case 'createdAt':
    default:
      return threads.createdAt;
  }
}
