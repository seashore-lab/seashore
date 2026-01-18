# Docker Deployment

For container deployment:

- build the workspace (`pnpm build`)
- run the API server entrypoint
- pass secrets via environment variables

If you deploy with Postgres/pgvector, run DB migrations during startup (or as a separate job).
