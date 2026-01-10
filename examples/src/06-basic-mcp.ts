/**
 * Example 06 - MCP Filesystem
 *
 * This example demonstrates how to create an agent that interacts with the local filesystem
 * using the Model Context Protocol (MCP) filesystem server.
 *
 * It should be mentioned that MCP tools feature in Seashore for OpenAI models requires
 * Responses API to work. Traditional chat completions API might result in a HTTP 400 error.
 */

import 'dotenv/config';
import { createMCPClient, createMCPToolBridge } from '@seashore/mcp';
import { createAgent } from '@seashore/agent';
import { openaiText } from '@seashore/llm';
import { defineTool } from '@seashore/tool';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('[Example 06: MCP Filesystem]\n');

  // Get the root path for MCP server
  const allowedPath = path.resolve(__dirname, '../../');
  console.log(`📂 Allowed access path: ${allowedPath}\n`);

  try {
    // 1. Connect to MCP filesystem server
    console.log('🔌 Connecting to MCP server...');
    const client = await createMCPClient({
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', allowedPath],
    });

    console.log('✅ MCP server connected\n');

    // 2. Create tool bridge and get tools
    const bridge = await createMCPToolBridge({
      client,
      rename: (name) => `fs_${name}`, // Optional: Append a prefix to avoid name conflicts
    });

    const toolConfigs = bridge.getTools();
    console.log(`🛠️ Available tools (${toolConfigs.length}):`);
    toolConfigs.forEach((tool) => {
      console.log(`   - ${tool.name}`);
    });
    // Convert MCP tool configs to actual tools
    const tools = toolConfigs.map((config) => defineTool(config));

    // 3. Create agent with the MCP filesystem tools
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

    // 4. Test file operations
    console.log('\n--- File Operations Test ---\n');

    const queries = [
      'Please list the files and folders in the current directory',
      'Read the contents of package.json and tell me the project name and version',
    ];

    for (const query of queries) {
      console.log(`📝 User: ${query}`);
      const result = await agent.run(query);
      console.log(`🤖 Agent: ${result.content}\n`);

      if (result.toolCalls.length > 0) {
        console.log('   📋 Tool Calls:');
        result.toolCalls.forEach((call) => {
          console.log(`      - ${call.name}: ${call.result.success ? '✅' : '❌'}`);
        });
        console.log();
      }
    }

    // 5. Close the MCP client connection
    await client.close();
    console.log('🔌 MCP connection closed');
  } catch (error) {
    console.error('❌ MCP connection failed:', error);
  }
}

main().catch(console.error);

// [Example 06: MCP Filesystem]

// 📂 Allowed access path: D:\Projects\seashore

// 🔌 Connecting to MCP server...
// [MCP stderr]: Secure MCP Filesystem Server running on stdio

// ✅ MCP server connected

// 🛠️ Available tools (14):
//    - fs_read_file
//    - fs_read_text_file
//    - fs_read_media_file
//    - fs_read_multiple_files
//    - fs_write_file
//    - fs_edit_file
//    - fs_create_directory
//    - fs_list_directory
//    - fs_list_directory_with_sizes
//    - fs_directory_tree
//    - fs_move_file
//    - fs_search_files
//    - fs_get_file_info
//    - fs_list_allowed_directories

// --- File Operations Test ---

// 📝 User: Please list the files and folders in the current directory
// 🤖 Agent: Here’s what’s in the current directory:

// - Files:
//   - `.env`
//   - `.env.example`
//   - `package.json`
//   - `README.md`
//   - `tsconfig.json`

// - Folders:
//   - `node_modules`
//   - `src`

//    📋 Tool Calls:
//       - fs_list_directory: ✅

// 📝 User: Read the contents of package.json and tell me the project name and version
// 🤖 Agent: The project name is `@seashore/examples` and the version is `0.1.0`.

//    📋 Tool Calls:
//       - fs_read_text_file: ❌
//       - fs_read_text_file: ✅
