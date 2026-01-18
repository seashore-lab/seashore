# 文档加载器

文档加载器将"某些东西"（文件路径、字符串、URL、glob）转换为一个或多个 `LoadedDocument` 对象。

Seashore 通过 `@seashorelab/rag` 提供了几个内置加载器。

## 常见模式

- **单源**加载器：加载一个文件/URL/字符串。
- **多源**加载器：一次调用中加载多个项目。
- **批处理/glob**加载器：使用过滤加载目录树。

大多数加载器返回一个数组，即使它的长度通常为 1。

## 从字符串加载 Markdown（示例 04）

```ts
import { createMarkdownStringLoader } from '@seashorelab/rag'

const loader = createMarkdownStringLoader(`# Title\n\nSome content...`)
const docs = await loader.load()
```

将此用于单元测试、演示或存储在数据库中的内容。

## 加载纯文本

```ts
import { createStringLoader } from '@seashorelab/rag'

const loader = createStringLoader('hello world', {
  source: 'manual-input',
  metadata: { category: 'demo' },
})

const docs = await loader.load()
```

## 从文件加载 Markdown

```ts
import { createMarkdownLoader } from '@seashorelab/rag'

const loader = createMarkdownLoader({
  extractFrontmatter: true,
  removeCodeBlocks: false,
  extractHeadings: true,
})

const docs = await loader.load('./README.md')
```

## 加载多个源

```ts
import { createMultiMarkdownLoader } from '@seashorelab/rag'

const loader = createMultiMarkdownLoader({ extractHeadings: true })
const docs = await loader.load([
  './docs/intro.md',
  './docs/faq.md',
])
```

## 按 glob 加载（目录）

```ts
import { createGlobLoader } from '@seashorelab/rag'

const loader = createGlobLoader({
  cwd: process.cwd(),
  glob: '**/*.md',
  ignore: ['**/node_modules/**', '**/dist/**'],
})

const docs = await loader.load()
```

## 加载 PDF

```ts
import { createPDFLoader } from '@seashorelab/rag'

const loader = createPDFLoader({ splitPages: true })
const docs = await loader.load('./whitepaper.pdf')
```

## 加载网页

```ts
import { createWebLoader } from '@seashorelab/rag'

const loader = createWebLoader({
  selector: 'article',
  removeSelectors: ['nav', 'footer'],
  timeout: 10000,
  // 可选：如果您配置了 Firecrawl
  // firecrawlApiKey: process.env.FIRECRAWL_API_KEY,
})

const docs = await loader.load('https://example.com/blog-post')
```

## 实用技巧

- 尽早标准化元数据（源 URL、标题、标签）。这使得过滤和跟踪更容易。
- 如果在生产环境中使用 Web 加载器，请积极缓存并设置严格的超时。
- 对于 Markdown 源，优先使用 Markdown 分割；它倾向于保持标题/部分完整。
