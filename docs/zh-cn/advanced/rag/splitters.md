# 文本分割器

分割器将 `LoadedDocument` 转换为许多更容易嵌入和检索的 `DocumentChunk` 条目。

## 分割很重要

- 检索质量很大程度上取决于块大小和重叠。
- 太大：召回率差，上下文成本高。
- 太小：精度差，语义破坏。

## Markdown 分割器（推荐用于 Markdown）

这是 RAG 示例中使用的分割器。

```ts
import { createMarkdownSplitter } from '@seashore/rag'

const splitter = createMarkdownSplitter({
  chunkSize: 200,
  chunkOverlap: 20,
  includeHeader: true,
})

const chunks = await splitter.split(doc)
```

## 递归分割器（通用）

按顺序尝试多个分隔符：

```ts
import { createRecursiveSplitter } from '@seashore/rag'

const splitter = createRecursiveSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ['\n\n', '\n', ' ', ''],
})
```

## 字符分割器

```ts
import { createCharacterSplitter } from '@seashore/rag'

const splitter = createCharacterSplitter({
  chunkSize: 1000,
  chunkOverlap: 100,
  separator: '\n\n',
})
```

## Token 分割器

Token 分割器有助于保持块大小与模型 tokenization 对齐。

```ts
import { createTokenSplitter } from '@seashore/rag'

const splitter = createTokenSplitter({
  chunkSize: 400,
  chunkOverlap: 40,
})
```

## 标题分割器

当您希望每个标题部分一个块时很有用：

```ts
import { createHeaderSplitter } from '@seashore/rag'

const splitter = createHeaderSplitter({
  maxDepth: 3,
  includeHeaderPath: true,
})
```

## 调优指导

- 对于一般文档，从 `chunkSize` 500–1200 个字符开始，对于密集知识，使用 150–300。
- 使用 `chunkOverlap` 约为 `chunkSize` 的 10–20%。
- 如果您看到标题过于重复地重复，请将 `includeHeader` 设置为 `false` 或减少重叠。
