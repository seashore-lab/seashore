/**
 * @seashore/vectordb
 *
 * Vector database utilities for pgvector
 * HNSW indexing, hybrid search (vector + full-text)
 */

// Types
export type {
  EmbeddingVector,
  Collection,
  CollectionConfig,
  Document,
  NewDocument,
  DocumentUpdate,
  ScoredDocument,
  VectorSearchOptions,
  TextSearchOptions,
  HybridSearchOptions,
  SearchResult,
  VectorStore,
  VectorStoreStats,
  EmbeddingFunction,
  VectorStoreOptions,
  DistanceMetric,
} from './types';

// Schema (for migrations/setup)
export * as schema from './schema/index';
export { collections } from './schema/collections';
export {
  documents,
  vector,
  tsvector,
  generateSearchVector,
  generateSearchQuery,
  generateWebSearchQuery,
} from './schema/documents';

// Store
export {
  createVectorStore,
  createCollection,
  getCollection,
  deleteCollection,
  listCollections,
  VectorStoreError,
  CollectionNotFoundError,
} from './store';

// Search functions (for advanced usage)
export {
  vectorSearch,
  batchVectorSearch,
  textSearch,
  prefixTextSearch,
  getSearchSuggestions,
  hybridSearch,
  hybridSearchLinear,
} from './search/index';
