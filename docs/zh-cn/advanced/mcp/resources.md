# 资源访问

MCP 服务器可以暴露资源（文件、文档等）。

```ts
const resources = await client.listResources()
const content = await client.readResource(resources[0].uri)
```

如果服务器支持更改事件，请使用资源订阅。
