# 示例 04：基础 RAG

源文件：`examples/src/04-basic-rag.ts`

## 演示内容

- 从字符串加载 markdown 知识库
- 使用支持 markdown 的分割器将其分块
- 通过 `@seashore/llm` 嵌入为块生成向量
- 使用向量相似性进行内存检索

## 运行方法

```bash
pnpm --filter @seashore/examples exec tsx src/04-basic-rag.ts
```

## 核心概念

- RAG 概述：[advanced/rag.md](../advanced/rag.md)
- 加载器：[advanced/rag/loaders.md](../advanced/rag/loaders.md)
- 分割器：[advanced/rag/splitters.md](../advanced/rag/splitters.md)
- 检索器：[advanced/rag/retrievers.md](../advanced/rag/retrievers.md)
