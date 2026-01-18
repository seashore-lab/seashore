# 示例 13：向量数据库混合搜索

源文件：`examples/src/13-vectordb-hybrid-search.ts`

## 演示内容

- 启动支持 pgvector 的 Postgres 容器
- 创建具有 HNSW 索引的集合
- 添加带有嵌入的文档
- 运行混合搜索（向量 + 全文搜索与 RRF）

## 前置要求

- 本地运行 Docker

## 运行方法

```bash
pnpm --filter @seashore/examples exec tsx src/13-vectordb-hybrid-search.ts
```

## 核心概念

- 向量数据库概述：[advanced/vectordb.md](../advanced/vectordb.md)
- 混合搜索：[advanced/vectordb/hybrid-search.md](../advanced/vectordb/hybrid-search.md)
