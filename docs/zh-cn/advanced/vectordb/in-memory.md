# "内存中"向量存储（开发模式）

`@seashore/vectordb` 专为 PostgreSQL + pgvector 设计，而不是纯内存实现。

但是，在开发期间，您可以通过以下方式获得"类似内存"的行为：

- 使用一次性本地 Postgres 容器
- 在测试中使用 testcontainers
- 每次运行创建/删除集合

如果您想要真正的内存选项用于演示，请改用 RAG 模块的 `createInMemoryRetriever`。
