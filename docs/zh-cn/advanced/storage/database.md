# 数据库设置

存储围绕 PostgreSQL 和 Drizzle 构建。

## 创建数据库连接

```ts
import { createDatabase } from '@seashore/storage'

const db = createDatabase({
  connectionString: process.env.DATABASE_URL,
  maxConnections: 10,
  ssl: process.env.NODE_ENV === 'production',
})

await db.healthCheck()
```

## 迁移

存储库包括 Drizzle 配置。典型命令：

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

在开发中，您也可以使用 `push`。
