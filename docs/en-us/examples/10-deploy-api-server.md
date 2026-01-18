# Example 10: Deploy API Server

Source: `examples/src/10-deploy-api-server.ts`

## What it demonstrates

- Wrapping a Seashore agent behind HTTP endpoints using `@seashorelab/deploy`
- Starting a Hono server using `@hono/node-server`
- Built-in CORS and rate limiting

## How to run

```bash
pnpm --filter @seashorelab/examples exec tsx src/10-deploy-api-server.ts
```

## Try it

The example prints endpoints and includes sample `curl` commands.

## Key concepts

- Deployment overview: [production/deployment.md](../production/deployment.md)
- API server: [production/deployment/api-server.md](../production/deployment/api-server.md)
