# Docker 部署

对于容器部署：

- 构建工作区 (`pnpm build`)
- 运行 API 服务器入口点
- 通过环境变量传递密钥

如果您使用 Postgres/pgvector 部署，请在启动期间运行数据库迁移（或作为单独的作业）。
