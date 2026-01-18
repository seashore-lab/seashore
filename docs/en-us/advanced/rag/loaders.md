# Document Loaders

Document loaders turn “something” (a file path, a string, a URL, a glob) into one or more `LoadedDocument` objects.

Seashore provides several built-in loaders via `@seashore/rag`.

## Common patterns

- **Single source** loaders: load one file/URL/string.
- **Multi source** loaders: load multiple items in one call.
- **Batch / glob** loaders: load a directory tree with filtering.

Most loaders return an array, even if it’s usually length 1.

## Loading markdown from a string (Example 04)

```ts
import { createMarkdownStringLoader } from '@seashore/rag'

const loader = createMarkdownStringLoader(`# Title\n\nSome content...`)
const docs = await loader.load()
```

Use this for unit tests, demos, or content stored in a database.

## Loading plain text

```ts
import { createStringLoader } from '@seashore/rag'

const loader = createStringLoader('hello world', {
  source: 'manual-input',
  metadata: { category: 'demo' },
})

const docs = await loader.load()
```

## Loading markdown from files

```ts
import { createMarkdownLoader } from '@seashore/rag'

const loader = createMarkdownLoader({
  extractFrontmatter: true,
  removeCodeBlocks: false,
  extractHeadings: true,
})

const docs = await loader.load('./README.md')
```

## Loading multiple sources

```ts
import { createMultiMarkdownLoader } from '@seashore/rag'

const loader = createMultiMarkdownLoader({ extractHeadings: true })
const docs = await loader.load([
  './docs/intro.md',
  './docs/faq.md',
])
```

## Loading by glob (directories)

```ts
import { createGlobLoader } from '@seashore/rag'

const loader = createGlobLoader({
  cwd: process.cwd(),
  glob: '**/*.md',
  ignore: ['**/node_modules/**', '**/dist/**'],
})

const docs = await loader.load()
```

## Loading PDFs

```ts
import { createPDFLoader } from '@seashore/rag'

const loader = createPDFLoader({ splitPages: true })
const docs = await loader.load('./whitepaper.pdf')
```

## Loading web pages

```ts
import { createWebLoader } from '@seashore/rag'

const loader = createWebLoader({
  selector: 'article',
  removeSelectors: ['nav', 'footer'],
  timeout: 10000,
  // Optional: if you have Firecrawl configured
  // firecrawlApiKey: process.env.FIRECRAWL_API_KEY,
})

const docs = await loader.load('https://example.com/blog-post')
```

## Practical tips

- Normalize metadata early (source URLs, titles, tags). It makes filtering and tracing much easier.
- If you use web loaders in production, cache aggressively and set strict timeouts.
- Prefer markdown splitting for markdown sources; it tends to keep headings/sections intact.
