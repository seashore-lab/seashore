# API 参考：存储

包：`@seashorelab/storage`

## 数据库

- `createDatabase({ connectionString, ... })`

## 仓储

- `createThreadRepository(db)`
- `createMessageRepository(db)`
- `createTraceRepository(db)`

## 中间件

- `createPersistenceMiddleware({ ... })`

参见：

- [advanced/storage.md](../advanced/storage.md)
- [examples/12-storage-persistence.md](../examples/12-storage-persistence.md)
