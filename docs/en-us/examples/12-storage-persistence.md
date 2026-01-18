# Example 12: Storage Persistence

Source: `examples/src/12-storage-persistence.ts`

## What it demonstrates

- Spinning up Postgres with testcontainers
- Running SQL migrations for storage schema
- Persisting threads and messages
- A persistence middleware that auto-saves messages

## Prerequisites

- Docker running locally

## How to run

```bash
pnpm --filter @seashorelab/examples exec tsx src/12-storage-persistence.ts
```

## Key concepts

- Storage overview: [advanced/storage.md](../advanced/storage.md)
- Database setup: [advanced/storage/database.md](../advanced/storage/database.md)
- Threads/messages: [advanced/storage/threads.md](../advanced/storage/threads.md)
