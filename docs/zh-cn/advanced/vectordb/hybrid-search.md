# 混合搜索

混合搜索结合了：

- 向量相似度（语义）
- 全文/前缀匹配（词法）

这改善了以下内容的召回率：

- 命名实体
- 缩略词
- 精确短语

## 使用混合搜索

```ts
import { hybridSearch } from '@seashorelab/vectordb'

const results = await hybridSearch({
  store: vectorStore,
  query: 'kubernetes autoscaling',
  collection: 'knowledge-base',
  topK: 10,
  vectorWeight: 0.7,
  textWeight: 0.3,
})
```

请参阅混合搜索示例以获取完整的可运行设置。
