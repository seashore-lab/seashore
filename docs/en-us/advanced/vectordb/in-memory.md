# “In-Memory” Vector Store (Development Patterns)

`@seashorelab/vectordb` is designed for PostgreSQL + pgvector, not a pure in-memory implementation.

However, during development you can get “in-memory-like” behavior by:

- using a disposable local Postgres container
- using testcontainers in tests
- creating/dropping collections per run

If you want a truly in-memory option for demos, use the RAG module’s `createInMemoryRetriever` instead.
