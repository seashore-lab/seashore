# @seashorelab/mcp

This package provides Model Context Protocol (MCP) client support for Seashore agents. MCP enables agents to interact with external tools and services through a standardized protocol.

## Creating an MCP Client

Connect to an MCP server:

```ts
import { createMCPClient } from '@seashorelab/mcp';

const client = await createMCPClient({
  transport: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/files'],
});

// List available tools
const tools = await client.listTools();
console.log('Available tools:', tools.map(t => t.name));

// Close connection when done
await client.close();
```

## Transport Types

MCP supports multiple transport protocols:

### Stdio Transport

```ts
const client = await createMCPClient({
  transport: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '/allowed/path'],
});
```

### SSE Transport

```ts
const client = await createMCPClient({
  transport: 'sse',
  url: 'https://mcp-server.example.com/sse',
});
```

### WebSocket Transport

```ts
const client = await createMCPClient({
  transport: 'websocket',
  url: 'wss://mcp-server.example.com/ws',
});
```

## MCP Tool Bridge

Convert MCP tools to Seashore tools:

```ts
import { createMCPToolBridge } from '@seashorelab/mcp';
import { defineTool } from '@seashorelab/tool';

const bridge = await createMCPToolBridge({
  client,
  rename: (name) => `mcp_${name}`, // Optional: prefix tool names
});

// Get tool configs
const toolConfigs = bridge.getTools();

// Convert to Seashore tools
const tools = toolConfigs.map(config => defineTool(config));

// Use with agent
import { createAgent } from '@seashorelab/agent';

const agent = createAgent({
  name: 'filesystem-agent',
  model: openaiText('gpt-4o'),
  tools,
});
```

## Calling MCP Tools

Execute MCP tools directly:

```ts
// Call a tool through the client
const result = await client.callTool('read_file', {
  path: '/allowed/path/file.txt',
});

console.log(result.content);
```

## Resource Access

Access MCP resources:

```ts
// List available resources
const resources = await client.listResources();
console.log('Resources:', resources);

// Read a resource
const resource = await client.readResource('file:///allowed/path/doc.txt');
console.log('Resource content:', resource.contents);
```

## Prompts

Use MCP prompts:

```ts
// List available prompts
const prompts = await client.listPrompts();

// Get a prompt
const prompt = await client.getPrompt('summarize', {
  filePath: '/path/to/file.txt',
});

console.log('Prompt:', prompt.messages);
```

## Tool Renaming

Customize tool names to avoid conflicts:

```ts
const bridge = await createMCPToolBridge({
  client,
  rename: (name) => {
    // Add prefix based on tool name
    if (name.includes('file')) return `fs_${name}`;
    if (name.includes('search')) return `search_${name}`;
    return name;
  },
});
```

## Error Handling

Handle MCP errors gracefully:

```ts
import { MCPError, MCPConnectionError } from '@seashorelab/mcp';

try {
  const client = await createMCPClient({
    transport: 'stdio',
    command: 'invalid-command',
  });
} catch (error) {
  if (error instanceof MCPConnectionError) {
    console.error('Failed to connect to MCP server:', error.message);
  }
}

try {
  const result = await client.callTool('invalid_tool', {});
} catch (error) {
  if (error instanceof MCPError) {
    console.error('MCP tool error:', error.code, error.message);
  }
}
```

## Filesystem Server Example

Complete example using the filesystem server:

```ts
import { createMCPClient, createMCPToolBridge } from '@seashorelab/mcp';
import { defineTool } from '@seashorelab/tool';
import { createAgent } from '@seashorelab/agent';
import { openaiText } from '@seashorelab/llm';
import path from 'path';

const allowedPath = path.resolve(process.cwd());

// Connect to filesystem server
const client = await createMCPClient({
  transport: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', allowedPath],
});

// Create tool bridge
const bridge = await createMCPToolBridge({
  client,
  rename: (name) => `fs_${name}`,
});

// Convert to Seashore tools
const tools = bridge.getTools().map(config => defineTool(config));

// Create agent
const agent = createAgent({
  name: 'filesystem-agent',
  model: openaiText('gpt-4o'),
  tools,
  systemPrompt: 'You are a helpful assistant with filesystem access.',
});

// Use the agent
const result = await agent.run('List all files in the current directory');
console.log(result.content);

// Clean up
await client.close();
```

## Multi-Server Support

Connect to multiple MCP servers:

```ts
import { createMCPClient, createMCPToolBridge } from '@seashorelab/mcp';

// Connect to multiple servers
const fsClient = await createMCPClient({
  transport: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '/path'],
});

const searchClient = await createMCPClient({
  transport: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-brave-search'],
});

// Create bridges for each
const fsBridge = await createMCPToolBridge({ client: fsClient });
const searchBridge = await createMCPToolBridge({ client: searchClient });

// Combine all tools
const allTools = [
  ...fsBridge.getTools().map(defineTool),
  ...searchBridge.getTools().map(defineTool),
];

// Use with agent
const agent = createAgent({
  name: 'multi-tool-agent',
  model: openaiText('gpt-4o'),
  tools: allTools,
});
```

## Tool Filtering

Filter which tools to expose:

```ts
const bridge = await createMCPToolBridge({
  client,
  filter: (tool) => {
    // Only allow read-only tools
    return tool.name.includes('read') || tool.name.includes('list');
  },
});

const readOnlyTools = bridge.getTools();
```

## Lifecycle Management

Manage MCP client lifecycle:

```ts
// Initialize client
const client = await createMCPClient(config);

// Check if connected
if (client.isConnected()) {
  console.log('Client is connected');
}

// Get client info
const info = await client.getServerInfo();
console.log('Server:', info.name);
console.log('Version:', info.version);

// Close when done
await client.close();
```

## Integration with Storage

Persist MCP tool usage:

```ts
import { createPersistenceMiddleware } from '@seashorelab/storage';

const middleware = createPersistenceMiddleware({
  db: database.db,
  autoCreateThread: true,
});

// Log tool calls
for await (const chunk of agent.stream(query)) {
  if (chunk.type === 'tool-call-start') {
    await middleware.persistMessage({
      type: 'tool_call',
      threadId,
      toolName: chunk.toolCall.name,
      arguments: chunk.toolCall.arguments,
    });
  }
}
```
