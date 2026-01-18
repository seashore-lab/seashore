# Resource Access

MCP servers can expose resources (files, docs, etc.).

```ts
const resources = await client.listResources()
const content = await client.readResource(resources[0].uri)
```

Use resource subscriptions if the server supports change events.
