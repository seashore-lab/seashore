# @seashorelab/rag

This package provides Retrieval-Augmented Generation (RAG) capabilities for Seashore agents. RAG enhances LLM responses by retrieving relevant context from a knowledge base before generating answers.

## Loaders

Load documents from various sources:

```ts
import {
  createMarkdownStringLoader,
  createTextLoader,
  createPDFLoader,
  createWebLoader,
} from '@seashorelab/rag';

// Load from markdown string
const markdownLoader = createMarkdownStringLoader(markdownContent);
const docs = await markdownLoader.load();

// Load from text file
const textLoader = createTextLoader('path/to/document.txt');
const docs = await textLoader.load();

// Load from PDF
const pdfLoader = createPDFLoader('path/to/document.pdf');
const docs = await pdfLoader.load();

// Load from web page
const webLoader = createWebLoader('https://example.com/article');
const docs = await webLoader.load();
```

## Splitters

Split documents into chunks for better retrieval:

```ts
import {
  createRecursiveSplitter,
  createMarkdownSplitter,
  createCodeSplitter,
} from '@seashorelab/rag';

// Recursive character splitter (general purpose)
const recursiveSplitter = createRecursiveSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ['\n\n', '\n', '. ', ' '],
});

const chunks = await recursiveSplitter.split(document);

// Markdown-aware splitter
const markdownSplitter = createMarkdownSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
  includeHeader: true, // Include markdown headers in chunks
});

const chunks = await markdownSplitter.split(markdownDoc);

// Code splitter (language-aware)
const codeSplitter = createCodeSplitter({
  language: 'typescript',
  chunkSize: 300,
  chunkOverlap: 30,
});

const chunks = await codeSplitter.split(codeDoc);
```

## Retrievers

Create retrievers for finding relevant documents:

```ts
import {
  createInMemoryRetriever,
  createVectorRetriever,
} from '@seashorelab/rag';
import { openaiEmbed, generateBatchEmbeddings } from '@seashorelab/llm';

// In-memory retriever (for small datasets)
const embeddingFn = async (texts: string[]) => {
  const embedder = openaiEmbed('text-embedding-3-small', 1536, {
    apiKey: process.env.OPENAI_API_KEY,
  });
  const result = await generateBatchEmbeddings({
    adapter: embedder,
    input: texts,
  });
  return result.embeddings;
};

const inMemoryRetriever = createInMemoryRetriever(embeddingFn);
await inMemoryRetriever.addDocuments(chunks);

// Retrieve relevant documents
const results = await inMemoryRetriever.retrieve('What is RAG?', {
  k: 3, // Number of results
  searchType: 'vector', // 'vector' | 'text' | 'hybrid'
});

// Vector DB retriever (for production)
import { createVectorStore } from '@seashorelab/vectordb';

const vectorStore = await createVectorStore({
  db,
  collectionName: 'docs',
  embeddings: embeddingFn,
});

const vectorRetriever = createVectorRetriever({
  store: vectorStore,
  k: 5,
  searchType: 'hybrid',
  vectorWeight: 0.7,
});
```

## RAG Pipeline

Combine retriever with LLM for complete RAG:

```ts
import { createRAG } from '@seashorelab/rag';
import { openaiText } from '@seashorelab/llm';

const rag = createRAG({
  retriever: inMemoryRetriever,
  model: openaiText('gpt-4o', {
    apiKey: process.env.OPENAI_API_KEY,
  }),
  systemPrompt: 'You are a helpful assistant. Answer using the provided context.',
  maxContextTokens: 3000,
  k: 3,
  includeSources: true,
  contextFormat: 'markdown', // 'text' | 'xml' | 'markdown'
});

// Query with RAG
const result = await rag.query('Explain the photoelectric effect');

console.log(result.answer);
console.log('Sources:', result.sources);
```

## Custom Templates

Use custom prompt templates for RAG:

```ts
import { createRAG, createTemplate } from '@seashorelab/rag';

const template = createTemplate(`
You are a research assistant. Use the following context to answer:

Context:
{{#each chunks}}
[{{@index}}] {{this}}
{{/each}}

Question: {{question}}

Answer:
`);

const rag = createRAG({
  retriever,
  model,
  template,
});

const result = await rag.query('What is machine learning?');
```

## Hybrid Search

Combine vector and keyword search:

```ts
const retriever = createHybridRetriever({
  vectorRetriever: vectorRetriever,
  keywordRetriever: textRetriever,
  vectorWeight: 0.7, // 70% vector, 30% keyword
  rrfK: 60, // Reciprocal Rank Fusion constant
});

const results = await retriever.retrieve('neural network architecture', {
  k: 5,
});
```

## Document Metadata

Use metadata for better filtering:

```ts
// Add documents with metadata
await retriever.addDocuments([
  {
    content: '...',
    metadata: {
      source: 'textbook',
      chapter: '1',
      difficulty: 'beginner',
    },
  },
]);

// Filter by metadata during retrieval
const results = await retriever.retrieve('introduction to AI', {
  k: 3,
  filter: {
    difficulty: 'beginner',
  },
});
```

## Streaming RAG

Stream RAG responses token by token:

```ts
const rag = createRAG({
  retriever,
  model,
  stream: true,
});

for await (const chunk of rag.streamStream('Explain quantum computing')) {
  if (chunk.type === 'token') {
    process.stdout.write(chunk.token);
  } else if (chunk.type === 'source') {
    console.log('\nSource:', chunk.source);
  }
}
```

## Multi-Query RAG

Generate multiple queries for better retrieval:

```ts
import { createMultiQueryRetriever } from '@seashorelab/rag';

const multiQueryRetriever = createMultiQueryRetriever({
  baseRetriever: vectorRetriever,
  queryGenerator: openaiText('gpt-4o'),
  queries: 3, // Generate 3 alternative queries
});

const results = await multiQueryRetriever.retrieve(
  'How do transformers work in NLP?'
);
```

## Reranking

Rerank retrieved documents for better relevance:

```ts
import { createRerankingRetriever } from '@seashorelab/rag';

const rerankingRetriever = createRerankingRetriever({
  baseRetriever: vectorRetriever,
  reranker: async (query, documents) => {
    // Custom reranking logic
    return documents.sort((a, b) => b.score - a.score);
  },
  topK: 5, // Return top 5 after reranking
});
```

## Evaluation

Evaluate RAG system performance:

```ts
import { evaluateRAG } from '@seashorelab/rag';

const metrics = await evaluateRAG({
  retriever,
  model,
  testCases: [
    {
      question: 'What is the photoelectric effect?',
      expectedAnswer: 'Emission of electrons when light hits material',
    },
  ],
});

console.log('Precision:', metrics.precision);
console.log('Recall:', metrics.recall);
console.log('F1 Score:', metrics.f1);
```
