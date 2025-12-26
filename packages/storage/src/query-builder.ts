/**
 * @seashore/storage - Query Builder Utilities
 *
 * Fluent query builder for common patterns
 */

import { eq, and, or, desc, asc, gt, gte, lt, lte, isNull, isNotNull, sql } from 'drizzle-orm';
import type { DrizzleDB } from './database';
import type { ListOptions, PaginationOptions } from './types';
import { threads } from './schema/threads';
import { messages } from './schema/messages';
import { traces } from './schema/traces';

/**
 * Date range filter
 */
export interface DateRangeFilter {
  readonly from?: Date;
  readonly to?: Date;
}

/**
 * Thread query options
 */
export interface ThreadQueryOptions extends ListOptions {
  readonly agentId?: string;
  readonly userId?: string;
  readonly createdAt?: DateRangeFilter;
  readonly updatedAt?: DateRangeFilter;
  readonly search?: string;
}

/**
 * Message query options
 */
export interface MessageQueryOptions extends ListOptions {
  readonly threadId?: string;
  readonly role?: 'user' | 'assistant' | 'system' | 'tool';
  readonly hasToolCalls?: boolean;
  readonly createdAt?: DateRangeFilter;
  readonly search?: string;
}

/**
 * Trace query options
 */
export interface TraceQueryOptions extends ListOptions {
  readonly threadId?: string;
  readonly type?: 'agent' | 'tool' | 'llm' | 'retriever' | 'embedding' | 'chain';
  readonly hasError?: boolean;
  readonly parentId?: string | null;
  readonly startedAt?: DateRangeFilter;
  readonly minDurationMs?: number;
  readonly maxDurationMs?: number;
}

/**
 * Thread query builder
 */
export class ThreadQueryBuilder {
  private db: DrizzleDB;
  private conditions: ReturnType<typeof eq>[] = [];
  private options: ListOptions = {};

  constructor(db: DrizzleDB) {
    this.db = db;
  }

  /**
   * Filter by agent ID
   */
  byAgent(agentId: string): this {
    this.conditions.push(eq(threads.agentId, agentId));
    return this;
  }

  /**
   * Filter by user ID
   */
  byUser(userId: string): this {
    this.conditions.push(eq(threads.userId, userId));
    return this;
  }

  /**
   * Filter by creation date range
   */
  createdBetween(from?: Date, to?: Date): this {
    if (from) {
      this.conditions.push(gte(threads.createdAt, from));
    }
    if (to) {
      this.conditions.push(lte(threads.createdAt, to));
    }
    return this;
  }

  /**
   * Filter by updated date range
   */
  updatedBetween(from?: Date, to?: Date): this {
    if (from) {
      this.conditions.push(gte(threads.updatedAt, from));
    }
    if (to) {
      this.conditions.push(lte(threads.updatedAt, to));
    }
    return this;
  }

  /**
   * Full-text search on title
   */
  search(query: string): this {
    // Simple ILIKE search
    this.conditions.push(sql`${threads.title} ILIKE ${`%${query}%`}`);
    return this;
  }

  /**
   * Set pagination
   */
  paginate(limit: number, offset: number = 0): this {
    this.options.limit = limit;
    this.options.offset = offset;
    return this;
  }

  /**
   * Set ordering
   */
  orderBy(column: 'createdAt' | 'updatedAt' | 'title', order: 'asc' | 'desc' = 'desc'): this {
    this.options.orderBy = column;
    this.options.order = order;
    return this;
  }

  /**
   * Execute query
   */
  async execute() {
    const { limit = 50, offset = 0, orderBy = 'createdAt', order = 'desc' } = this.options;

    const orderColumn =
      orderBy === 'title'
        ? threads.title
        : orderBy === 'updatedAt'
          ? threads.updatedAt
          : threads.createdAt;
    const orderFn = order === 'desc' ? desc : asc;

    let query = this.db.select().from(threads);

    if (this.conditions.length > 0) {
      query = query.where(and(...this.conditions)) as typeof query;
    }

    return query.orderBy(orderFn(orderColumn)).limit(limit).offset(offset);
  }

  /**
   * Count matching records
   */
  async count(): Promise<number> {
    let query = this.db.select({ count: sql<number>`count(*)` }).from(threads);

    if (this.conditions.length > 0) {
      query = query.where(and(...this.conditions)) as typeof query;
    }

    const [result] = await query;
    return result?.count ?? 0;
  }
}

/**
 * Message query builder
 */
export class MessageQueryBuilder {
  private db: DrizzleDB;
  private conditions: ReturnType<typeof eq>[] = [];
  private options: ListOptions = {};

  constructor(db: DrizzleDB) {
    this.db = db;
  }

  /**
   * Filter by thread ID
   */
  inThread(threadId: string): this {
    this.conditions.push(eq(messages.threadId, threadId));
    return this;
  }

  /**
   * Filter by role
   */
  byRole(role: 'user' | 'assistant' | 'system' | 'tool'): this {
    this.conditions.push(eq(messages.role, role));
    return this;
  }

  /**
   * Filter messages with tool calls
   */
  hasToolCalls(has: boolean = true): this {
    if (has) {
      this.conditions.push(isNotNull(messages.toolCalls));
    } else {
      this.conditions.push(isNull(messages.toolCalls));
    }
    return this;
  }

  /**
   * Filter by creation date range
   */
  createdBetween(from?: Date, to?: Date): this {
    if (from) {
      this.conditions.push(gte(messages.createdAt, from));
    }
    if (to) {
      this.conditions.push(lte(messages.createdAt, to));
    }
    return this;
  }

  /**
   * Full-text search on content
   */
  search(query: string): this {
    this.conditions.push(sql`${messages.content} ILIKE ${`%${query}%`}`);
    return this;
  }

  /**
   * Set pagination
   */
  paginate(limit: number, offset: number = 0): this {
    this.options.limit = limit;
    this.options.offset = offset;
    return this;
  }

  /**
   * Set ordering
   */
  orderBy(order: 'asc' | 'desc' = 'asc'): this {
    this.options.order = order;
    return this;
  }

  /**
   * Execute query
   */
  async execute() {
    const { limit = 50, offset = 0, order = 'asc' } = this.options;
    const orderFn = order === 'desc' ? desc : asc;

    let query = this.db.select().from(messages);

    if (this.conditions.length > 0) {
      query = query.where(and(...this.conditions)) as typeof query;
    }

    return query.orderBy(orderFn(messages.createdAt)).limit(limit).offset(offset);
  }

  /**
   * Count matching records
   */
  async count(): Promise<number> {
    let query = this.db.select({ count: sql<number>`count(*)` }).from(messages);

    if (this.conditions.length > 0) {
      query = query.where(and(...this.conditions)) as typeof query;
    }

    const [result] = await query;
    return result?.count ?? 0;
  }
}

/**
 * Trace query builder
 */
export class TraceQueryBuilder {
  private db: DrizzleDB;
  private conditions: ReturnType<typeof eq>[] = [];
  private options: ListOptions = {};

  constructor(db: DrizzleDB) {
    this.db = db;
  }

  /**
   * Filter by thread ID
   */
  inThread(threadId: string): this {
    this.conditions.push(eq(traces.threadId, threadId));
    return this;
  }

  /**
   * Filter by type
   */
  byType(type: 'agent' | 'tool' | 'llm' | 'retriever' | 'embedding' | 'chain'): this {
    this.conditions.push(eq(traces.type, type));
    return this;
  }

  /**
   * Filter traces with errors
   */
  hasError(has: boolean = true): this {
    if (has) {
      this.conditions.push(isNotNull(traces.error));
    } else {
      this.conditions.push(isNull(traces.error));
    }
    return this;
  }

  /**
   * Filter root traces (no parent)
   */
  rootOnly(): this {
    this.conditions.push(isNull(traces.parentId));
    return this;
  }

  /**
   * Filter by parent ID
   */
  childrenOf(parentId: string): this {
    this.conditions.push(eq(traces.parentId, parentId));
    return this;
  }

  /**
   * Filter by started date range
   */
  startedBetween(from?: Date, to?: Date): this {
    if (from) {
      this.conditions.push(gte(traces.startedAt, from));
    }
    if (to) {
      this.conditions.push(lte(traces.startedAt, to));
    }
    return this;
  }

  /**
   * Filter by duration
   */
  durationBetween(minMs?: number, maxMs?: number): this {
    if (minMs !== undefined) {
      this.conditions.push(gte(traces.durationMs, minMs));
    }
    if (maxMs !== undefined) {
      this.conditions.push(lte(traces.durationMs, maxMs));
    }
    return this;
  }

  /**
   * Set pagination
   */
  paginate(limit: number, offset: number = 0): this {
    this.options.limit = limit;
    this.options.offset = offset;
    return this;
  }

  /**
   * Set ordering
   */
  orderBy(order: 'asc' | 'desc' = 'desc'): this {
    this.options.order = order;
    return this;
  }

  /**
   * Execute query
   */
  async execute() {
    const { limit = 50, offset = 0, order = 'desc' } = this.options;
    const orderFn = order === 'desc' ? desc : asc;

    let query = this.db.select().from(traces);

    if (this.conditions.length > 0) {
      query = query.where(and(...this.conditions)) as typeof query;
    }

    return query.orderBy(orderFn(traces.startedAt)).limit(limit).offset(offset);
  }

  /**
   * Count matching records
   */
  async count(): Promise<number> {
    let query = this.db.select({ count: sql<number>`count(*)` }).from(traces);

    if (this.conditions.length > 0) {
      query = query.where(and(...this.conditions)) as typeof query;
    }

    const [result] = await query;
    return result?.count ?? 0;
  }
}

/**
 * Create query builders
 */
export function createQueryBuilders(db: DrizzleDB) {
  return {
    threads: () => new ThreadQueryBuilder(db),
    messages: () => new MessageQueryBuilder(db),
    traces: () => new TraceQueryBuilder(db),
  };
}

/**
 * Query threads with options
 */
export async function queryThreads(db: DrizzleDB, options: ThreadQueryOptions) {
  const builder = new ThreadQueryBuilder(db);

  if (options.agentId) builder.byAgent(options.agentId);
  if (options.userId) builder.byUser(options.userId);
  if (options.createdAt) builder.createdBetween(options.createdAt.from, options.createdAt.to);
  if (options.updatedAt) builder.updatedBetween(options.updatedAt.from, options.updatedAt.to);
  if (options.search) builder.search(options.search);
  if (options.limit || options.offset) builder.paginate(options.limit ?? 50, options.offset ?? 0);
  if (options.orderBy)
    builder.orderBy(options.orderBy as 'createdAt' | 'updatedAt' | 'title', options.order);

  return builder.execute();
}

/**
 * Query messages with options
 */
export async function queryMessages(db: DrizzleDB, options: MessageQueryOptions) {
  const builder = new MessageQueryBuilder(db);

  if (options.threadId) builder.inThread(options.threadId);
  if (options.role) builder.byRole(options.role);
  if (options.hasToolCalls !== undefined) builder.hasToolCalls(options.hasToolCalls);
  if (options.createdAt) builder.createdBetween(options.createdAt.from, options.createdAt.to);
  if (options.search) builder.search(options.search);
  if (options.limit || options.offset) builder.paginate(options.limit ?? 50, options.offset ?? 0);
  if (options.order) builder.orderBy(options.order);

  return builder.execute();
}

/**
 * Query traces with options
 */
export async function queryTraces(db: DrizzleDB, options: TraceQueryOptions) {
  const builder = new TraceQueryBuilder(db);

  if (options.threadId) builder.inThread(options.threadId);
  if (options.type) builder.byType(options.type);
  if (options.hasError !== undefined) builder.hasError(options.hasError);
  if (options.parentId === null) builder.rootOnly();
  else if (options.parentId) builder.childrenOf(options.parentId);
  if (options.startedAt) builder.startedBetween(options.startedAt.from, options.startedAt.to);
  if (options.minDurationMs || options.maxDurationMs)
    builder.durationBetween(options.minDurationMs, options.maxDurationMs);
  if (options.limit || options.offset) builder.paginate(options.limit ?? 50, options.offset ?? 0);
  if (options.order) builder.orderBy(options.order);

  return builder.execute();
}
