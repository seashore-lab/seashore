# 环境配置

常见的环境变量：

- `OPENAI_API_KEY`
- `OPENAI_API_BASE_URL`（可选）
- `DATABASE_URL`（storage/vectordb/memory 持久化）

对于生产环境：

- 使用密钥管理器
- 避免记录原始提示词/响应，除非明确需要
