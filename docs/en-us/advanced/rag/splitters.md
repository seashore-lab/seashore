# Text Splitters

Splitters turn a `LoadedDocument` into many `DocumentChunk` entries that are easier to embed and retrieve.

## Why splitting matters

- Retrieval quality depends heavily on chunk size and overlap.
- Too large: poor recall and high context cost.
- Too small: poor precision and broken semantics.

## Markdown splitter (recommended for markdown)

This is the splitter used in the RAG example.

```ts
import { createMarkdownSplitter } from '@seashore/rag'

const splitter = createMarkdownSplitter({
  chunkSize: 200,
  chunkOverlap: 20,
  includeHeader: true,
})

const chunks = await splitter.split(doc)
```

## Recursive splitter (general purpose)

Try multiple separators in order:

```ts
import { createRecursiveSplitter } from '@seashore/rag'

const splitter = createRecursiveSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ['\n\n', '\n', ' ', ''],
})
```

## Character splitter

```ts
import { createCharacterSplitter } from '@seashore/rag'

const splitter = createCharacterSplitter({
  chunkSize: 1000,
  chunkOverlap: 100,
  separator: '\n\n',
})
```

## Token splitter

Token splitters help keep chunk size aligned with model tokenization.

```ts
import { createTokenSplitter } from '@seashore/rag'

const splitter = createTokenSplitter({
  chunkSize: 400,
  chunkOverlap: 40,
})
```

## Header splitter

Useful when you want one chunk per header section:

```ts
import { createHeaderSplitter } from '@seashore/rag'

const splitter = createHeaderSplitter({
  maxDepth: 3,
  includeHeaderPath: true,
})
```

## Tuning guidance

- Start with `chunkSize` 500–1200 characters for general docs, 150–300 for dense knowledge.
- Use `chunkOverlap` ~10–20% of `chunkSize`.
- If you see headings duplicated too aggressively, set `includeHeader` to `false` or reduce overlap.
