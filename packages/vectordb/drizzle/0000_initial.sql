-- Migration: 0000_initial
-- Create vector database tables for Seashore Agent Framework

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Collections table - stores vector collection metadata
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  dimensions INTEGER NOT NULL,
  distance_metric TEXT NOT NULL DEFAULT 'cosine' CHECK (distance_metric IN ('cosine', 'euclidean', 'inner_product')),
  hnsw_m INTEGER NOT NULL DEFAULT 16,
  hnsw_ef_construction INTEGER NOT NULL DEFAULT 64,
  document_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_collections_name ON collections(name);
CREATE INDEX IF NOT EXISTS idx_collections_created ON collections(created_at);

-- Documents table - stores vector documents with embeddings
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536),
  search_vector tsvector,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_collection ON documents(collection_id);
CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(created_at);

-- HNSW index for vector similarity search (cosine distance)
CREATE INDEX IF NOT EXISTS idx_documents_embedding 
  ON documents 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_documents_search 
  ON documents 
  USING gin (search_vector);

-- Trigger function to update search_vector on insert/update
CREATE OR REPLACE FUNCTION documents_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update search_vector
DROP TRIGGER IF EXISTS documents_search_vector_trigger ON documents;
CREATE TRIGGER documents_search_vector_trigger
  BEFORE INSERT OR UPDATE OF content ON documents
  FOR EACH ROW
  EXECUTE FUNCTION documents_search_vector_update();

-- Trigger function to update collection document count
CREATE OR REPLACE FUNCTION update_collection_document_count() RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE collections 
    SET document_count = document_count + 1,
        updated_at = NOW()
    WHERE id = NEW.collection_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE collections 
    SET document_count = document_count - 1,
        updated_at = NOW()
    WHERE id = OLD.collection_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update collection document count
DROP TRIGGER IF EXISTS update_collection_count_trigger ON documents;
CREATE TRIGGER update_collection_count_trigger
  AFTER INSERT OR DELETE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_document_count();
