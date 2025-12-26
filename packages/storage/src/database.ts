/**
 * @seashore/storage - Database Connection
 *
 * PostgreSQL database connection with Drizzle ORM
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import type { Database, DatabaseConfig } from './types';
import * as schema from './schema/index';

/**
 * Drizzle database instance type
 */
export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Create a database connection
 *
 * @example
 * ```typescript
 * import { createDatabase } from '@seashore/storage';
 *
 * const database = createDatabase({
 *   connectionString: process.env.DATABASE_URL!,
 *   maxConnections: 10,
 *   ssl: true,
 * });
 *
 * // Check health
 * const isHealthy = await database.healthCheck();
 *
 * // Get Drizzle instance for custom queries
 * const db = database.db;
 *
 * // Close when done
 * await database.close();
 * ```
 */
export function createDatabase(config: DatabaseConfig): Database & { db: DrizzleDB } {
  const { connectionString, maxConnections = 10, ssl = false } = config;

  // Create postgres.js connection
  const client = postgres(connectionString, {
    max: maxConnections,
    ssl: ssl ? 'require' : false,
  });

  // Create Drizzle instance with schema
  const db = drizzle(client, { schema });

  return {
    db,

    async healthCheck(): Promise<boolean> {
      try {
        await client`SELECT 1`;
        return true;
      } catch {
        return false;
      }
    },

    async close(): Promise<void> {
      await client.end();
    },
  };
}

/**
 * Re-export Drizzle utilities commonly used in queries
 */
export { sql, eq, and, or, desc, asc, gt, gte, lt, lte, isNull, isNotNull } from 'drizzle-orm';
