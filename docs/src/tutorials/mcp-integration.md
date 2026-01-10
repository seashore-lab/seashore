# MCP Integration Tutorial

This tutorial demonstrates how to integrate Model Context Protocol (MCP) servers with your Seashore agents. MCP enables agents to interact with external systems and tools through a standardized protocol, greatly expanding their capabilities.

## What You'll Learn

- How to create an MCP client connection
- Creating tool bridges from MCP servers
- Converting MCP tools to Seashore tools
- Building agents with MCP capabilities
- Managing MCP connection lifecycle

## Prerequisites

Before starting this tutorial, make sure you have:

- Node.js 18+ installed
- pnpm installed
- An OpenAI API key (supports Responses API):
  ```bash
  export OPENAI_API_KEY=your_api_key_here
  ```

**Important**: MCP tools feature in Seashore for OpenAI models requires Responses API to work. Traditional chat completions API might result in HTTP 400 errors.

## Step 1: Import Required Packages

```typescript
import 'dotenv/config';
import { createMCPClient, createMCPToolBridge } from '@seashore/mcp';
import { createAgent } from '@seashore/agent';
import { openaiText } from '@seashore/llm';
import { defineTool } from '@seashore/tool';
import path from 'path';
import { fileURLToPath } from 'url';
```

## Step 2: Set Up Filesystem Path

Define the directory path that the MCP server can access:

```typescript
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const allowedPath = path.resolve(__dirname, '../../');
console.log(`Allowed access path: ${allowedPath}`);
```

## Step 3: Connect to MCP Server

Create a client connection to the MCP filesystem server:

```typescript
const client = await createMCPClient({
  transport: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', allowedPath],
});
```

**MCP Client Configuration:**

| Parameter | Description | Example |
|-----------|-------------|---------|
| `transport` | Communication method | 'stdio' |
| `command` | Command to start server | 'npx' |
| `args` | Arguments for the command | ['-y', '@modelcontextprotocol/server-filesystem', path] |

## Step 4: Create Tool Bridge

Create a bridge that converts MCP tools to Seashore tools:

```typescript
const bridge = await createMCPToolBridge({
  client,
  rename: (name) => `fs_${name}`, // Optional: Add prefix to avoid conflicts
});

const toolConfigs = bridge.getTools();
console.log(`Available tools (${toolConfigs.length}):`);
toolConfigs.forEach((tool) => {
  console.log(`   - ${tool.name}`);
});
```

## Step 5: Convert and Create Tools

Convert MCP tool configs to actual Seashore tools:

```typescript
const tools = toolConfigs.map((config) => defineTool(config));
```

**Common MCP Filesystem Tools:**

| Tool Name | Description |
|-----------|-------------|
| `fs_read_file` | Read file contents |
| `fs_write_file` | Write content to file |
| `fs_list_directory` | List directory contents |
| `fs_create_directory` | Create new directory |
| `fs_move_file` | Move or rename files |
| `fs_search_files` | Search for files |
| `fs_get_file_info` | Get file metadata |

## Step 6: Create Agent with MCP Tools

Create an agent that uses the MCP tools:

```typescript
const agent = createAgent({
  name: 'filesystem-agent',
  model: openaiText('gpt-5.1', {
    baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY || '',
  }),
  systemPrompt: `You are a helpful assistant with access to a filesystem.
You can use the provided tools to interact with the file system.
Please operate the file system based on the user's requests.`,
  tools,
});
```

## Step 7: Test File Operations

Query the agent to perform file operations:

```typescript
const queries = [
  'Please list the files and folders in the current directory',
  'Read the contents of package.json and tell me the project name and version',
];

for (const query of queries) {
  console.log(`User: ${query}`);
  const result = await agent.run(query);
  console.log(`Agent: ${result.content}\n`);

  if (result.toolCalls.length > 0) {
    console.log('Tool Calls:');
    result.toolCalls.forEach((call) => {
      console.log(`   - ${call.name}: ${call.result.success ? 'OK' : 'Failed'}`);
    });
  }
}
```

## Step 8: Close the Connection

Always close the MCP connection when done:

```typescript
await client.close();
console.log('MCP connection closed');
```

## Running the Example

```bash
cd D:\Projects\seashore\examples
pnpm run 06-basic-mcp
```

**Expected Output:**

```
[Example 06: MCP Filesystem]

Allowed access path: D:\Projects\seashore

Connecting to MCP server...
MCP server connected

Available tools (14):
   - fs_read_file
   - fs_read_text_file
   - fs_write_file
   - fs_list_directory
   - fs_create_directory
   - fs_move_file
   - fs_search_files
   - fs_get_file_info
   ...

--- File Operations Test ---

User: Please list the files and folders in the current directory
Agent: Here's what's in the current directory:

Files:
  - .env
  - package.json
  - README.md

Folders:
  - node_modules
  - src

Tool Calls:
   - fs_list_directory: OK

User: Read the contents of package.json and tell me the project name and version
Agent: The project name is @seashore/examples and the version is 0.1.0.
```

## Source Code

The complete source code for this example is available at:
[`examples/src/06-basic-mcp.ts`](https://github.com/seahorse/seashore/blob/main/examples/src/06-basic-mcp.ts)

## Key Concepts

### MCP Architecture

```
Agent ←→ Seashore Tools ←→ MCP Tool Bridge ←→ MCP Server ←→ External System
```

### Transport Types

| Transport | Description | Use Case |
|-----------|-------------|----------|
| `stdio` | Standard input/output | Local processes |
| `sse` | Server-Sent Events | HTTP connections |
| `websocket` | WebSocket protocol | Real-time communication |

### Tool Naming

Use the `rename` function to avoid conflicts:

```typescript
const bridge = await createMCPToolBridge({
  client,
  rename: (name) => {
    // Add prefix
    return `mcp_${name}`;

    // Or conditionally rename
    // return name === 'read' ? 'fs_read' : name;
  },
});
```

## Extensions

### Connect to Multiple MCP Servers

Connect to multiple servers for different capabilities:

```typescript
// Filesystem server
const fsClient = await createMCPClient({
  transport: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', allowedPath],
});

// Database server
const dbClient = await createMCPClient({
  transport: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-postgres', connectionString],
});

// Create bridges for both
const fsBridge = await createMCPToolBridge({ client: fsClient });
const dbBridge = await createMCPToolBridge({ client: dbClient });

// Combine all tools
const allTools = [
  ...fsBridge.getTools().map(defineTool),
  ...dbBridge.getTools().map(defineTool),
];
```

### Custom MCP Server Integration

Connect to your own MCP server:

```typescript
const customClient = await createMCPClient({
  transport: 'stdio',
  command: 'node',
  args: ['./my-mcp-server.js'],
  env: {
    API_KEY: process.env.MY_API_KEY,
  },
});
```

### Error Handling for MCP

Add proper error handling:

```typescript
try {
  const client = await createMCPClient({
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', allowedPath],
  });

  const bridge = await createMCPToolBridge({ client });
  // ... use tools

} catch (error) {
  if (error instanceof Error) {
    console.error('MCP connection failed:', error.message);
    // Fallback behavior
  }
} finally {
  await client?.close();
}
```

### MCP with Streaming

Use MCP tools with streaming responses:

```typescript
for await (const chunk of agent.stream(userQuery)) {
  if (chunk.type === 'tool-call-start') {
    console.log(`[MCP Tool: ${chunk.toolCall.name}]`);
  } else if (chunk.type === 'content' && chunk.delta) {
    process.stdout.write(chunk.delta);
  }
}
```

## Available MCP Servers

Here are some popular MCP servers you can use:

| Server | Description | Installation |
|--------|-------------|--------------|
| `@modelcontextprotocol/server-filesystem` | Filesystem access | Built-in |
| `@modelcontextprotocol/server-postgres` | PostgreSQL database | `npm install -g` |
| `@modelcontextprotocol/server-brave-search` | Web search | `npm install -g` |
| `@modelcontextprotocol/server-github` | GitHub integration | `npm install -g` |
| `@modelcontextprotocol/server-puppeteer` | Web automation | `npm install -g` |

## Best Practices

1. **Limit access paths** - Only expose necessary directories
2. **Use tool prefixes** - Avoid naming conflicts with `rename`
3. **Close connections** - Always close MCP clients when done
4. **Handle errors** - MCP servers may fail to start
5. **Validate permissions** - Ensure the agent has appropriate access

## Next Steps

- Learn about **security guardrails** for safe tool usage in the [Security Tutorial](./security-guardrails.md)
- Explore **agent deployment** in the [Deployment Tutorial](./deployment.md)
- Add **observability** to track tool usage in the [Observability Tutorial](./observability.md)
