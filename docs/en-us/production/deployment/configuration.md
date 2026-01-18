# Environment Configuration

Common environment variables:

- `OPENAI_API_KEY`
- `OPENAI_API_BASE_URL` (optional)
- `DATABASE_URL` (storage/vectordb/memory persistence)

For production:

- use secret managers
- avoid logging raw prompts/responses unless explicitly required
