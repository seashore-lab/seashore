/**
 * @seashore/storage - Trace Repository
 *
 * Repository for trace CRUD operations (observability)
 */

import { eq, desc, asc, and, isNull } from 'drizzle-orm';
import type { DrizzleDB } from '../database.js';
import { traces } from '../schema/traces.js';
import type { Trace, NewTrace, UpdateTrace, ListOptions, TraceType, TokenUsage } from '../types.js';

/**
 * Trace repository interface
 */
export interface TraceRepository {
  /** Create a new trace */
  create(data: NewTrace): Promise<Trace>;

  /** Find trace by ID */
  findById(id: string): Promise<Trace | null>;

  /** Find traces by thread ID */
  findByThreadId(threadId: string, options?: ListOptions): Promise<Trace[]>;

  /** Find child traces by parent ID */
  findByParentId(parentId: string, options?: ListOptions): Promise<Trace[]>;

  /** Find root traces (no parent) */
  findRootTraces(options?: ListOptions): Promise<Trace[]>;

  /** Update a trace */
  update(id: string, data: UpdateTrace): Promise<Trace | null>;

  /** Delete a trace */
  delete(id: string): Promise<boolean>;
}

/**
 * Create a trace repository
 *
 * @example
 * ```typescript
 * import { createDatabase, createTraceRepository } from '@seashore/storage';
 *
 * const database = createDatabase({ connectionString: process.env.DATABASE_URL! });
 * const traceRepo = createTraceRepository(database.db);
 *
 * // Start a trace
 * const trace = await traceRepo.create({
 *   name: 'agent_run',
 *   type: 'agent',
 *   threadId: 'thread-123',
 * });
 *
 * // Complete the trace
 * await traceRepo.update(trace.id, {
 *   output: { result: 'success' },
 *   durationMs: 1500,
 *   endedAt: new Date(),
 * });
 * ```
 */
export function createTraceRepository(db: DrizzleDB): TraceRepository {
  return {
    async create(data: NewTrace): Promise<Trace> {
      const [trace] = await db
        .insert(traces)
        .values({
          threadId: data.threadId ?? null,
          parentId: data.parentId ?? null,
          name: data.name,
          type: data.type,
          input: data.input ?? null,
          startedAt: data.startedAt ?? new Date(),
        })
        .returning();

      return mapTrace(trace);
    },

    async findById(id: string): Promise<Trace | null> {
      const [trace] = await db.select().from(traces).where(eq(traces.id, id)).limit(1);

      return trace !== undefined ? mapTrace(trace) : null;
    },

    async findByThreadId(threadId: string, options: ListOptions = {}): Promise<Trace[]> {
      const { limit = 100, offset = 0, order = 'desc' } = options;

      const orderFn = order === 'desc' ? desc : asc;

      const result = await db
        .select()
        .from(traces)
        .where(eq(traces.threadId, threadId))
        .orderBy(orderFn(traces.startedAt))
        .limit(limit)
        .offset(offset);

      return result.map(mapTrace);
    },

    async findByParentId(parentId: string, options: ListOptions = {}): Promise<Trace[]> {
      const { limit = 100, offset = 0, order = 'asc' } = options;

      const orderFn = order === 'desc' ? desc : asc;

      const result = await db
        .select()
        .from(traces)
        .where(eq(traces.parentId, parentId))
        .orderBy(orderFn(traces.startedAt))
        .limit(limit)
        .offset(offset);

      return result.map(mapTrace);
    },

    async findRootTraces(options: ListOptions = {}): Promise<Trace[]> {
      const { limit = 50, offset = 0, order = 'desc' } = options;

      const orderFn = order === 'desc' ? desc : asc;

      const result = await db
        .select()
        .from(traces)
        .where(isNull(traces.parentId))
        .orderBy(orderFn(traces.startedAt))
        .limit(limit)
        .offset(offset);

      return result.map(mapTrace);
    },

    async update(id: string, data: UpdateTrace): Promise<Trace | null> {
      const [trace] = await db
        .update(traces)
        .set({
          ...(data.output !== undefined && { output: data.output }),
          ...(data.error !== undefined && { error: data.error }),
          ...(data.tokenUsage !== undefined && { tokenUsage: data.tokenUsage }),
          ...(data.durationMs !== undefined && { durationMs: data.durationMs }),
          ...(data.endedAt !== undefined && { endedAt: data.endedAt }),
        })
        .where(eq(traces.id, id))
        .returning();

      return trace !== undefined ? mapTrace(trace) : null;
    },

    async delete(id: string): Promise<boolean> {
      const result = await db.delete(traces).where(eq(traces.id, id)).returning({ id: traces.id });

      return result.length > 0;
    },
  };
}

/**
 * Map database row to Trace type
 */
function mapTrace(row: typeof traces.$inferSelect): Trace {
  return {
    id: row.id,
    threadId: row.threadId,
    parentId: row.parentId,
    name: row.name,
    type: row.type as TraceType,
    input: row.input,
    output: row.output,
    error: row.error,
    tokenUsage: row.tokenUsage as TokenUsage | null,
    durationMs: row.durationMs,
    startedAt: row.startedAt,
    endedAt: row.endedAt,
  };
}
