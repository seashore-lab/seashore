# API Reference: Storage

Package: `@seashore/storage`

## Database

- `createDatabase({ connectionString, ... })`

## Repositories

- `createThreadRepository(db)`
- `createMessageRepository(db)`
- `createTraceRepository(db)`

## Middleware

- `createPersistenceMiddleware({ ... })`

See:

- [advanced/storage.md](../advanced/storage.md)
- [examples/12-storage-persistence.md](../examples/12-storage-persistence.md)
