# 示例 10：部署 API 服务器

源文件：`examples/src/10-deploy-api-server.ts`

## 演示内容

- 使用 `@seashorelab/deploy` 将 Seashore agent 封装在 HTTP 端点后面
- 使用 `@hono/node-server` 启动 Hono 服务器
- 内置 CORS 和速率限制

## 运行方法

```bash
pnpm --filter @seashorelab/examples exec tsx src/10-deploy-api-server.ts
```

## 试用

该示例打印端点并包含示例 `curl` 命令。

## 核心概念

- 部署概述：[production/deployment.md](../production/deployment.md)
- API 服务器：[production/deployment/api-server.md](../production/deployment/api-server.md)
