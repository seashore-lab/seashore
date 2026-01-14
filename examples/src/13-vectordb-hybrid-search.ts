/**
 * Example 13 - Vector Database with Hybrid Search
 *
 * This example demonstrates how to use Seashore's vector database for semantic search.
 * It automatically spins up a PostgreSQL container with pgvector extension.
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { createVectorStore, createCollection, hybridSearch } from '@seashore/vectordb';
import { openaiEmbed, generateBatchEmbeddings } from '@seashore/llm';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Sample knowledge base documents
const knowledgeDocuments = [
  {
    content:
      'Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. It focuses on the development of computer programs that can access data and use it to learn for themselves.',
    metadata: { topic: 'AI/ML', category: 'Introduction', difficulty: 'beginner' },
  },
  {
    content:
      'Neural networks are computing systems inspired by biological neural networks that constitute animal brains. They consist of interconnected nodes (neurons) organized in layers. Deep learning uses neural networks with many layers to learn hierarchical representations of data.',
    metadata: { topic: 'AI/ML', category: 'Architecture', difficulty: 'intermediate' },
  },
  {
    content:
      'Natural Language Processing (NLP) is a branch of AI that helps computers understand, interpret, and manipulate human language. NLP draws from many disciplines, including computer science and computational linguistics.',
    metadata: { topic: 'NLP', category: 'Introduction', difficulty: 'beginner' },
  },
  {
    content:
      'Transformers are a type of neural network architecture that revolutionized NLP. They use self-attention mechanisms to process sequential data in parallel, making them highly efficient. GPT and BERT are famous transformer-based models.',
    metadata: { topic: 'NLP', category: 'Architecture', difficulty: 'advanced' },
  },
  {
    content:
      'Retrieval-Augmented Generation (RAG) combines information retrieval with text generation. It retrieves relevant documents from a knowledge base and uses them to generate contextually accurate responses, reducing hallucinations in language models.',
    metadata: { topic: 'AI/ML', category: 'Techniques', difficulty: 'intermediate' },
  },
  {
    content:
      'Vector databases store data as high-dimensional vectors and enable similarity search. They use specialized indexing techniques like HNSW (Hierarchical Navigable Small World) to efficiently find similar vectors in large datasets.',
    metadata: { topic: 'Databases', category: 'Vector Search', difficulty: 'intermediate' },
  },
];

async function main() {
  console.log('[Example 13: Vector Database with Hybrid Search]\n');

  let container;
  let client: ReturnType<typeof postgres> | null = null;
  let db: PostgresJsDatabase | null = null;

  try {
    console.log('--- Step 1: Start PostgreSQL Container with pgvector ---\n');

    console.log('   🐳 Starting PostgreSQL container with pgvector extension...');
    console.log('   This may take a moment on first run (downloading image)\n');

    // Start PostgreSQL container with pgvector (same as test setup)
    container = await new PostgreSqlContainer('pgvector/pgvector:pg16')
      .withDatabase('seashore_demo')
      .withUsername('demo')
      .withPassword('demo')
      .start();

    const connectionString = container.getConnectionUri();
    console.log('   ✅ PostgreSQL container started');
    console.log(`   📍 Connection: ${connectionString.replace(/\/\/.*@/, '//***@')}\n`);

    console.log('--- Step 2: Initialize Database Schema ---\n');

    // Create postgres client and Drizzle instance
    client = postgres(connectionString, { max: 10 });
    db = drizzle(client) as PostgresJsDatabase;

    // Check connection
    await client`SELECT 1`;
    console.log('   ✅ Database connection healthy\n');

    // Run storage migrations first
    console.log('   📦 Running storage migrations...');
    const storageMigrationPath = resolve(
      __dirname,
      '../../packages/storage/drizzle/0000_initial.sql'
    );
    const storageMigrationSql = readFileSync(storageMigrationPath, 'utf-8');

    await client.unsafe(storageMigrationSql);

    console.log('   ✅ Storage schema created\n');

    // Run vectordb migrations
    console.log('   📦 Running vectordb migrations...');
    const vectorMigrationPath = resolve(
      __dirname,
      '../../packages/vectordb/drizzle/0000_initial.sql'
    );
    const vectorMigrationSql = readFileSync(vectorMigrationPath, 'utf-8');

    await client.unsafe(vectorMigrationSql);

    console.log('   ✅ Vector database schema created\n');

    console.log('--- Step 3: Setup Vector Store and Collection ---\n');

    // Create embedding function
    const embeddingFunction = async (texts: readonly string[]): Promise<number[][]> => {
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

    // Create collection with HNSW indexing
    const collection = await createCollection(db, {
      name: 'ai_knowledge',
      description: 'AI and ML knowledge base',
      dimensions: 1536,
      distanceMetric: 'cosine',
      hnswConfig: {
        m: 16, // Number of bi-directional links per node
        efConstruction: 64, // Size of dynamic candidate list for construction
      },
    });

    console.log('   ✅ Collection created:');
    console.log(`      Name: ${collection.name}`);
    console.log(`      Dimensions: ${collection.dimensions}`);
    console.log(`      Distance Metric: ${collection.distanceMetric}`);
    console.log(`      HNSW M: ${collection.hnswM}`);
    console.log(`      HNSW efConstruction: ${collection.hnswEfConstruction}\n`);

    // Create vector store
    const vectorStore = await createVectorStore({
      db,
      collectionName: 'ai_knowledge',
      embeddings: embeddingFunction,
      createIfNotExists: false,
    });

    console.log('   ✅ Vector store ready\n');

    console.log('--- Step 4: Add Documents with Embeddings ---\n');

    console.log('   📝 Generating embeddings and adding documents...');

    const texts = knowledgeDocuments.map((doc) => doc.content);
    const embeddings = await embeddingFunction(texts);

    for (let i = 0; i < knowledgeDocuments.length; i++) {
      await vectorStore.addDocuments([
        {
          content: knowledgeDocuments[i].content,
          embedding: embeddings[i],
          metadata: knowledgeDocuments[i].metadata,
        },
      ]);
    }

    console.log(`   ✅ Added ${knowledgeDocuments.length} documents to vector store\n`);

    console.log('--- Step 5: Hybrid Search (Vector + Full-Text with RRF) ---\n');

    const queries = [
      'How do language models reduce hallucinations?',
      'Explain transformer architecture for NLP',
      'What are vector databases used for?',
    ];

    for (const query of queries) {
      console.log(`🔍 Query: "${query}"\n`);

      // Generate embedding for the query
      const [queryEmbedding] = await embeddingFunction([query]);

      // Perform hybrid search combining vector similarity and full-text search
      const results = await hybridSearch(db, collection, query, queryEmbedding!, {
        limit: 3,
        vectorWeight: 0.7, // 70% weight to vector similarity, 30% to text match
        rrfK: 60, // Reciprocal Rank Fusion constant
        minScore: 0,
      });

      console.log(`   📊 Found ${results.documents.length} results:`);
      console.log(`   (Hybrid: Vector Similarity + Full-Text Search)\n`);

      results.documents.forEach(
        (
          doc: {
            document: { content: string; metadata?: Record<string, unknown> | null };
            score: number;
          },
          idx: number
        ) => {
          const preview = doc.document.content.substring(0, 80);
          console.log(`   ${idx + 1}. RRF Score: ${(doc.score * 100).toFixed(1)}%`);
          console.log(`      Topic: ${doc.document.metadata?.topic || 'Unknown'}`);
          console.log(`      Category: ${doc.document.metadata?.category || 'Unknown'}`);
          console.log(`      Preview: "${preview}..."`);
          console.log();
        }
      );
    }

    console.log('--- Step 6: Collection Statistics ---\n');

    const stats = await vectorStore.getStats();
    console.log('   📈 Collection Statistics:');
    console.log(`      Collection name: ${collection.name}`);
    console.log(`      Total documents: ${stats.documentCount}`);
    console.log(`      Embedded documents: ${stats.embeddedCount}`);
    console.log(`      Dimensions: ${collection.dimensions}`);
    console.log(`      Distance metric: ${collection.distanceMetric}`);
    console.log(`      Storage size: ${(stats.storageBytes / 1024 / 1024).toFixed(2)} MB\n`);
  } finally {
    console.log('--- Cleanup ---\n');

    // Close database connection
    if (client) {
      await client.end();
      console.log('   ✅ Database connection closed');
    }

    // Stop container
    if (container) {
      await container.stop();
      console.log('   ✅ PostgreSQL container stopped\n');
    }
  }
}

main().catch(console.error);

// [Example 13: Vector Database with Hybrid Search]

// --- Step 1: Start PostgreSQL Container with pgvector ---

//    🐳 Starting PostgreSQL container with pgvector extension...
//    This may take a moment on first run (downloading image)

//    ✅ PostgreSQL container started
//    📍 Connection: postgres://***@localhost:32779/seashore_demo

// --- Step 2: Initialize Database Schema ---

//    ✅ Database connection healthy

//    📦 Running storage migrations...
//    ✅ Storage schema created

//    📦 Running vectordb migrations...
// {
//   severity_local: 'NOTICE',
//   severity: 'NOTICE',
//   code: '42710',
//   message: 'extension "uuid-ossp" already exists, skipping',
//   file: 'extension.c',
//   line: '1887',
//   routine: 'CreateExtension'
// }
// {
//   severity_local: 'NOTICE',
//   severity: 'NOTICE',
//   code: '00000',
//   message: 'trigger "documents_search_vector_trigger" for relation "documents" does not exist, skipping',
//   file: 'dropcmds.c',
//   line: '528',
//   routine: 'does_not_exist_skipping'
// }
// {
//   severity_local: 'NOTICE',
//   severity: 'NOTICE',
//   code: '00000',
//   message: 'trigger "update_collection_count_trigger" for relation "documents" does not exist, skipping',
//   file: 'dropcmds.c',
//   line: '528',
//   routine: 'does_not_exist_skipping'
// }
//    ✅ Vector database schema created

// --- Step 3: Setup Vector Store and Collection ---

//    ✅ Collection created:
//       Name: ai_knowledge
//       Dimensions: 1536
//       Distance Metric: cosine
//       HNSW M: 16
//       HNSW efConstruction: 64

//    ✅ Vector store ready

// --- Step 4: Add Documents with Embeddings ---

//    📝 Generating embeddings and adding documents...
//    ✅ Added 6 documents to vector store

// --- Step 5: Hybrid Search (Vector + Full-Text with RRF) ---

// 🔍 Query: "How do language models reduce hallucinations?"

//    📊 Found 3 results:
//    (Hybrid: Vector Similarity + Full-Text Search)

//    1. RRF Score: 0.2%
//       Topic: AI/ML
//       Category: Techniques
//       Preview: "Retrieval-Augmented Generation (RAG) combines information retrieval with text ge..."

//    2. RRF Score: 0.1%
//       Topic: NLP
//       Category: Architecture
//       Preview: "Transformers are a type of neural network architecture that revolutionized NLP. ..."

//    3. RRF Score: 0.1%
//       Topic: NLP
//       Category: Introduction
//       Preview: "Natural Language Processing (NLP) is a branch of AI that helps computers underst..."

// 🔍 Query: "Explain transformer architecture for NLP"

//    📊 Found 3 results:
//    (Hybrid: Vector Similarity + Full-Text Search)

//    1. RRF Score: 0.1%
//       Topic: NLP
//       Category: Architecture
//       Preview: "Transformers are a type of neural network architecture that revolutionized NLP. ..."

//    2. RRF Score: 0.1%
//       Topic: NLP
//       Category: Introduction
//       Preview: "Natural Language Processing (NLP) is a branch of AI that helps computers underst..."

//    3. RRF Score: 0.1%
//       Topic: AI/ML
//       Category: Architecture
//       Preview: "Neural networks are computing systems inspired by biological neural networks tha..."

// 🔍 Query: "What are vector databases used for?"

//    📊 Found 3 results:
//    (Hybrid: Vector Similarity + Full-Text Search)

//    1. RRF Score: 0.2%
//       Topic: Databases
//       Category: Vector Search
//       Preview: "Vector databases store data as high-dimensional vectors and enable similarity se..."

//    2. RRF Score: 0.1%
//       Topic: AI/ML
//       Category: Techniques
//       Preview: "Retrieval-Augmented Generation (RAG) combines information retrieval with text ge..."

//    3. RRF Score: 0.1%
//       Topic: AI/ML
//       Category: Architecture
//       Preview: "Neural networks are computing systems inspired by biological neural networks tha..."

// --- Step 6: Collection Statistics ---

//    📈 Collection Statistics:
//       Collection name: ai_knowledge
//       Total documents: 6
//       Embedded documents: 6
//       Dimensions: 1536
//       Distance metric: cosine
//       Storage size: 0.22 MB

// --- Cleanup ---

//    ✅ Database connection closed
//    ✅ PostgreSQL container stopped
