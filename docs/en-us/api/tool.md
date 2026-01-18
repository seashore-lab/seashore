# API Reference: Tool

Package: `@seashore/tool`

## Defining tools

- `defineTool({ name, description, inputSchema, execute })`

Tools are described using a Zod input schema; Seashore converts this into a tool schema the model can call.

See:

- [core/tools/defining.md](../core/tools/defining.md)
- [examples/02-agent-tools-stream.md](../examples/02-agent-tools-stream.md)

## Preset tools

The tool package ships preset tools:

- Serper search, Firecrawl scraping
- DuckDuckGo, Wikipedia, GitHub, finance, arXiv, article extraction
- restricted shell

See:

- [core/tools/presets.md](../core/tools/presets.md)
- [examples/11-tool-presets.md](../examples/11-tool-presets.md)
- [examples/15-new-preset-tools.md](../examples/15-new-preset-tools.md)

## Approval

- `withApproval(tool, options)`
- `createMemoryApprovalHandler()`

See: [core/tools/approval.md](../core/tools/approval.md)
