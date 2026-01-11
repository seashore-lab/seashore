/**
 * Example 11 - Tool Presets with Approval
 *
 * This example demonstrates how to use preset tools (Serper search and Firecrawl scraping)
 * combined with approval workflow for sensitive operations.
 */

import 'dotenv/config';
import { createAgent } from '@seashore/agent';
import { openaiText } from '@seashore/llm';
import {
  serperTool,
  firecrawlTool,
  withApproval,
  createMemoryApprovalHandler,
} from '@seashore/tool';

async function main() {
  console.log('[Example 11: Tool Presets with Approval]\n');

  // Create approval handler
  const approvalHandler = createMemoryApprovalHandler();

  // Configure Serper search tool (no approval needed for read-only operations)
  const searchTool = serperTool({
    apiKey: process.env.SERPER_API_KEY || '',
    country: 'us',
    locale: 'en',
    numResults: 5,
  });

  // Configure Firecrawl scraping tool with approval requirement
  // Web scraping can consume resources and should be approved
  const baseScrapeToolInstance = firecrawlTool({
    apiKey: process.env.FIRECRAWL_API_KEY || '',
    formats: ['markdown'],
  });

  const scrapeTool = withApproval(baseScrapeToolInstance, {
    reason: 'Web scraping requires approval to prevent resource abuse',
    riskLevel: 'medium',
    handler: approvalHandler,
    timeout: 30000,
  });

  // Auto-approve scraping requests after a delay (simulating user review)
  const autoApproveTimer = setInterval(() => {
    const pending = Array.from(approvalHandler.pendingRequests.values());
    for (const request of pending) {
      if (request.toolName === 'firecrawl_scrape') {
        console.log(`\n   🔍 Approval Request:`);
        console.log(`      Tool: ${request.toolName}`);
        console.log(`      Risk: ${request.riskLevel}`);
        console.log(`      URL: ${JSON.stringify(request.input)}`);
        console.log(`   ✅ Auto-approved by system\n`);
        approvalHandler.approve(request.id, 'auto-system');
      }
    }
  }, 500);

  console.log('--- Research Assistant with Search and Scraping ---\n');

  // Create an agent with both tools
  const agent = createAgent({
    name: 'research-assistant',
    model: openaiText('gpt-5.1', {
      baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY || '',
    }),
    systemPrompt:
      'You are a research assistant that can search the web and scrape content. ' +
      'First search for information, then if needed, scrape relevant pages for detailed content. ' +
      'Always explain what you are doing.',
    tools: [searchTool, scrapeTool],
  });

  const query =
    'Find recent articles about TypeScript 5.0 and summarize the key features from the top result';
  console.log(`📝 User: ${query}\n`);
  console.log('🤖 Agent:');

  try {
    for await (const chunk of agent.stream(query)) {
      if (chunk.type === 'content' && chunk.delta) {
        process.stdout.write(chunk.delta);
      } else if (chunk.type === 'tool-call-start' && chunk.toolCall) {
        console.log(`\n\n[🔧 Calling tool: ${chunk.toolCall.name}]`);
        if (chunk.toolCall.name === 'serper_search') {
          console.log(`   Query: ${JSON.stringify(chunk.toolCall.arguments)}`);
        }
      } else if (chunk.type === 'tool-result' && chunk.toolCall && chunk.toolResult) {
        if (chunk.toolCall.name === 'serper_search') {
          const result = chunk.toolResult.data as { organic?: Array<{ title: string }> };
          if (result.organic) {
            console.log(`   ✓ Found ${result.organic.length} search results`);
          }
        } else if (chunk.toolCall.name === 'firecrawl_scrape') {
          console.log(`   ✓ Page scraped successfully`);
        }
        console.log();
      }
    }
  } finally {
    clearInterval(autoApproveTimer);
  }

  console.log('\n\n--- Summary ---\n');
  console.log('✨ This example demonstrated:');
  console.log('   1. Using Serper for web search (no approval needed)');
  console.log('   2. Using Firecrawl for web scraping (with approval)');
  console.log('   3. Combining both tools in a research workflow');
  console.log('   4. Automatic approval workflow for demonstration\n');
}

main().catch(console.error);
