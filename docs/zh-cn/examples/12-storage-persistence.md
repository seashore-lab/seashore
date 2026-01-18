# 示例 12：存储持久化

源文件：`examples/src/12-storage-persistence.ts`

## 演示内容

- 使用 testcontainers 启动 Postgres
- 运行存储架构的 SQL 迁移
- 持久化线程和消息
- 自动保存消息的持久化中间件

## 前置要求

- 本地运行 Docker

## 运行方法

```bash
pnpm --filter @seashorelab/examples exec tsx src/12-storage-persistence.ts
```

## 核心概念

- 存储概述：[advanced/storage.md](../advanced/storage.md)
- 数据库设置：[advanced/storage/database.md](../advanced/storage/database.md)
- 线程/消息：[advanced/storage/threads.md](../advanced/storage/threads.md)
