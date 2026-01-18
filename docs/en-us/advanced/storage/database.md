# Database Setup

Storage is built around PostgreSQL and Drizzle.

## Create a database connection

```ts
import { createDatabase } from '@seashorelab/storage'

const db = createDatabase({
  connectionString: process.env.DATABASE_URL,
  maxConnections: 10,
  ssl: process.env.NODE_ENV === 'production',
})

await db.healthCheck()
```

## Migrations

The repo includes Drizzle config under the storage package. Typical commands:

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

In development you may also use `push`.
