# RAG Pipeline Tutorial

This tutorial shows you how to build a Retrieval-Augmented Generation (RAG) pipeline using Seashore's RAG utilities. RAG combines the power of LLMs with your own knowledge base to produce more accurate, contextually relevant responses.

## What You'll Learn

- How to load documents using document loaders
- Splitting documents into chunks with text splitters
- Creating embeddings with OpenAI's embedding model
- Building an in-memory vector retriever
- Retrieving relevant documents for query answering

## Prerequisites

Before starting this tutorial, make sure you have:

- Node.js 18+ installed
- pnpm installed
- An OpenAI API key:
  ```bash
  export OPENAI_API_KEY=your_api_key_here
  ```

## Step 1: Import Required Packages

```typescript
import 'dotenv/config';
import {
  createMarkdownStringLoader,
  createMarkdownSplitter,
  createInMemoryRetriever,
  type DocumentChunk,
} from '@seashore/rag';
import { openaiEmbed, generateBatchEmbeddings } from '@seashore/llm';
```

## Step 2: Prepare Your Knowledge Base

Create or load your knowledge content:

```typescript
const knowledgeContent = `
# Photoelectric Effect

The photoelectric effect is the emission of electrons or other free carriers when light shines on a material.
Electrons emitted in this manner can be called photoelectrons.
The phenomenon is commonly observed in metals and is the basis for photoemissive devices.

# Compton Scattering

Compton scattering is the inelastic scattering of a photon by a charged particle, usually an electron.
It results in a decrease in energy (increase in wavelength) of the photon, called the Compton effect.
This effect demonstrates that light cannot be explained purely as a wave phenomenon.

# Beer-Lambert Law

The Beer-Lambert law relates the absorption of light to the properties of the material through which the light is traveling.
It states that there is a logarithmic dependence between the transmission of light through a substance and the product of the absorption coefficient of the substance, the path length, and the concentration of absorbing species.
`;
```

## Step 3: Load Documents

Use the markdown loader to parse your content:

```typescript
const loader = createMarkdownStringLoader(knowledgeContent);
const loadedDocs = await loader.load();
console.log(`Loaded ${loadedDocs.length} documents`);
```

**Document loaders available:**

| Loader | Description | Use Case |
|--------|-------------|----------|
| `createMarkdownStringLoader` | Load from markdown string | In-memory markdown content |
| `createFileLoader` | Load from files | Reading local files |
| `createDirectoryLoader` | Load from directory | Batch file loading |

## Step 4: Split Documents into Chunks

Split documents into manageable chunks for better retrieval:

```typescript
const splitter = createMarkdownSplitter({
  chunkSize: 200,
  chunkOverlap: 20,
  includeHeader: true,
});

const chunks: DocumentChunk[] = [];
for (const doc of loadedDocs) {
  const docChunks = await splitter.split(doc);
  chunks.push(...docChunks);
}
console.log(`Split into ${chunks.length} chunks`);
```

**Splitter Parameters:**

| Parameter | Description | Recommended Value |
|-----------|-------------|-------------------|
| `chunkSize` | Maximum characters per chunk | 200-500 |
| `chunkOverlap` | Overlapping characters between chunks | 10-20% of chunkSize |
| `includeHeader` | Include markdown headers in chunks | true for semantic context |

## Step 5: Create Embedding Function

Define how to generate embeddings for your chunks:

```typescript
const embeddingFn = async (texts: readonly string[]): Promise<number[][]> => {
  const embedder = openaiEmbed('text-embedding-3-small', 1536, {
    baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY || '',
  });
  const result = await generateBatchEmbeddings({
    adapter: embedder,
    input: texts,
  });
  return result.embeddings as number[][];
};
```

**Embedding Models:**

| Model | Dimensions | Cost | Speed |
|-------|------------|------|-------|
| `text-embedding-3-small` | 1536 | Low | Fast |
| `text-embedding-3-large` | 3072 | Medium | Medium |
| `text-embedding-ada-002` | 1536 | Low | Fast |

## Step 6: Create and Populate the Retriever

Create an in-memory retriever and add your chunks:

```typescript
const retriever = createInMemoryRetriever(embeddingFn);
await retriever.addDocuments(chunks);
console.log('Documents added to retriever');
```

## Step 7: Query the Retriever

Retrieve relevant chunks for a given query:

```typescript
const question = 'What is the Photoelectric Effect?';
const retrieved = await retriever.retrieve(question, {
  k: 3,                    // Number of results to return
  searchType: 'vector',    // Use vector similarity search
});

console.log(`Retrieved ${retrieved.length} relevant chunks`);
console.log(`Most relevant: "${retrieved[0].content.slice(0, 80)}..."`);
console.log(`Similarity: ${(retrieved[0].score * 100).toFixed(1)}%`);
```

**Retrieval Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `k` | Number of chunks to retrieve | 4 |
| `searchType` | 'vector' or 'hybrid' | 'vector' |
| `filter` | Metadata filter predicate | none |

## Running the Example

```bash
cd D:\Projects\seashore\examples
pnpm run 04-basic-rag
```

**Expected Output:**

```
[Example 04: RAG Knowledge Base]

Step 1: Load documents
   Loaded 1 documents

Step 2: Split documents
   Split into 6 chunks

Split preview:
   1. "# Photoelectric Effect..."
   2. "# Photoelectric Effect  The photoelectric effect is the emi..."
   3. "# Compton Scattering..."

Step 3: Create embeddings

Step 4: Create in-memory retriever
   Documents added to retriever

--- Test retrieval ---

Question: What is the Photoelectric Effect?
Retrieved 4 relevant chunks
   Most relevant: "# Photoelectric Effect  The photoelectric effect is the emi..."
   Similarity: 72.9%

Question: How's Beer-Lambert law related to Photonelectric Effect and Compton scattering?
Retrieved 4 relevant chunks
   Most relevant: "# Beer-Lambert Law  The Beer-Lambert law relates the absorpt..."
   Similarity: 69.3%
```

## Source Code

The complete source code for this example is available at:
[`examples/src/04-basic-rag.ts`](https://github.com/seahorse/seashore/blob/main/examples/src/04-basic-rag.ts)

## Key Concepts

### RAG Pipeline Components

```
Documents → Loading → Splitting → Embedding → Storage → Retrieval → Generation
```

1. **Loading**: Read documents from various sources
2. **Splitting**: Break documents into chunks
3. **Embedding**: Convert chunks to vector representations
4. **Storage**: Store vectors for similarity search
5. **Retrieval**: Find relevant chunks for queries
6. **Generation**: Use retrieved context in LLM responses

### Chunking Strategy

Proper chunking is crucial for RAG performance:

```typescript
// Good: Semantically meaningful chunks
const chunks = splitter.split(doc);

// The chunkSize and chunkOverlap affect:
// - Retrieval precision (smaller chunks = more precise)
// - Context preservation (larger chunks = more context)
// - Embedding cost (more chunks = higher cost)
```

### Similarity Scores

Retrieval results include similarity scores (0-1):

- **> 0.8**: Highly relevant
- **0.6-0.8**: Moderately relevant
- **< 0.6**: Less relevant

## Extensions

### Build a RAG Agent

Combine RAG with an agent for question answering:

```typescript
import { createAgent } from '@seashore/agent';

const ragAgent = createAgent({
  name: 'qa-agent',
  model: openaiText('gpt-5.1', { apiKey: '...' }),
  systemPrompt: `You are a helpful assistant. Answer questions using the provided context.`,
  tools: [
    defineTool({
      name: 'search_knowledge',
      description: 'Search the knowledge base',
      inputSchema: z.object({
        query: z.string(),
      }),
      execute: async ({ query }) => {
        const results = await retriever.retrieve(query, { k: 3 });
        return {
          context: results.map(r => r.content).join('\n\n'),
          sources: results.map(r => r.metadata?.source || 'unknown'),
        };
      },
    }),
  ],
});
```

### Hybrid Search

Combine vector and keyword search:

```typescript
const retrieved = await retriever.retrieve(query, {
  k: 5,
  searchType: 'hybrid',
  alpha: 0.7,  // 0 = keyword-only, 1 = vector-only
});
```

### Metadata Filtering

Filter results by metadata:

```typescript
// Add metadata when splitting
const chunks = await splitter.split(doc, {
  metadata: { category: 'physics', author: 'Einstein' }
});

// Filter during retrieval
const retrieved = await retriever.retrieve(query, {
  k: 5,
  filter: (chunk) => chunk.metadata?.category === 'physics',
});
```

### Persistent Vector Store

Use a persistent vector database instead of in-memory:

```typescript
import { createVectorDBRetriever } from '@seashore/vectordb';
import { createVectorCollection } from '@seashore/vectordb';

const collection = await createVectorCollection({
  name: 'knowledge_base',
  dimension: 1536,
});

const retriever = createVectorDBRetriever({
  collection,
  embeddingFn,
});
```

## Best Practices

1. **Clean your data** - Remove formatting, normalize text before chunking
2. **Tune chunk size** - Balance context preservation with retrieval precision
3. **Use metadata** - Add source information for citation
4. **Monitor similarity scores** - Set thresholds for relevance filtering
5. **Update regularly** - Re-index when knowledge base changes

## Next Steps

- Add **memory systems** for conversation context in the [Memory Tutorial](./memory-systems.md)
- Learn about **agent deployment** in the [Deployment Tutorial](./deployment.md)
- Explore **evaluation** to measure RAG quality in the [Evaluation Tutorial](./evaluation.md)
