/**
 * Example 15 - New Preset Tools Showcase
 *
 * This example demonstrates the usage of the new preset tools:
 * - DuckDuckGo (free web search)
 * - Wikipedia (knowledge lookup)
 * - Calculator (math operations)
 * - GitHub (repository search)
 * - YFinance (stock data)
 * - Arxiv (academic papers)
 * - Newspaper (article extraction)
 * - Exa (AI search, requires API key)
 * - Tavily (AI search, requires API key)
 * - Shell (command execution)
 */

import 'dotenv/config';
import { createAgent } from '@seashore/agent';
import { openaiText } from '@seashore/llm';
import {
  // Free web search (no API key needed)
  duckduckgoSearchTool,
  duckduckgoNewsTool,
  // Wikipedia knowledge lookup
  wikipediaSearchTool,
  wikipediaSummaryTool,
  // Calculator tools
  calculatorTool,
  powerTool,
  factorialTool,
  sqrtTool,
  isPrimeTool,
  expressionTool,
  // GitHub (works without token, rate-limited)
  githubSearchReposTool,
  githubGetRepoTool,
  githubListIssuesTool,
  // Stock and crypto data
  stockQuoteTool,
  stockSearchTool,
  cryptoQuoteTool,
  // Academic paper search
  arxivSearchTool,
  arxivGetPaperTool,
  // Article extraction
  extractArticleTool,
  extractHeadlinesTool,
  // Shell (use with caution)
  restrictedShellTool,
} from '@seashore/tool/presets';

/**
 * Example 1: Calculator Tools
 * Pure TypeScript, no network or API keys needed
 */
async function calculatorExample() {
  console.log('\n=== Calculator Tools ===\n');

  const calc = calculatorTool();
  const power = powerTool();
  const factorial = factorialTool();
  const sqrt = sqrtTool();
  const isPrime = isPrimeTool();
  const expr = expressionTool();

  // Basic arithmetic
  const addition = calc.execute({ a: 100, b: 25, operation: 'add' });
  console.log(`Basic: ${addition.expression}`);

  // Power calculation
  const powerResult = power.execute({ base: 2, exponent: 16 });
  console.log(`Power: ${powerResult.expression}`);

  // Factorial
  const factResult = factorial.execute({ n: 10 });
  console.log(`Factorial: ${factResult.expression}`);

  // Square root
  const sqrtResult = sqrt.execute({ n: 256 });
  console.log(`Square root: ${sqrtResult.expression}`);

  // Prime check
  const primeResult = isPrime.execute({ n: 997 });
  console.log(`Prime check: ${primeResult.expression}`);

  // Expression evaluation
  const exprResult = expr.execute({
    expression: 'sqrt(144) + 2^4 + pi',
  });
  console.log(`Expression: ${exprResult.expression}`);
}

/**
 * Example 2: DuckDuckGo Search
 * Free web search without API key
 */
async function duckduckgoExample() {
  console.log('\n=== DuckDuckGo Search ===\n');

  const search = duckduckgoSearchTool({ maxResults: 3 });
  const news = duckduckgoNewsTool({ maxResults: 3 });

  try {
    const searchResults = await search.execute({
      query: 'seashore typescript agent framework',
    });

    console.log('Web Search Results:');
    searchResults.results.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.title}`);
      console.log(`     URL: ${r.url}`);
    });

    const newsResults = await news.execute({
      query: 'artificial intelligence latest news',
    });

    console.log('\nNews Results:');
    newsResults.results.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.title}`);
      console.log(`     Source: ${r.source} | ${r.date}`);
    });
  } catch (error) {
    console.log('DuckDuckGo example skipped (network issue):', (error as Error).message);
  }
}

/**
 * Example 3: Wikipedia
 * Knowledge base access
 */
async function wikipediaExample() {
  console.log('\n=== Wikipedia ===\n');

  const search = wikipediaSearchTool();
  const summary = wikipediaSummaryTool();

  try {
    // Search for articles
    const searchResults = await search.execute({
      query: 'large language model',
    });

    console.log('Search Results:');
    searchResults.results.slice(0, 5).forEach((title, i) => {
      console.log(`  ${i + 1}. ${title}`);
    });

    // Get article summary
    const articleSummary = await summary.execute({
      title: 'Large language model',
    });

    console.log(`\nArticle: ${articleSummary.title}`);
    console.log(`Summary: ${articleSummary.summary.slice(0, 300)}...`);
  } catch (error) {
    console.log('Wikipedia example skipped:', (error as Error).message);
  }
}

/**
 * Example 4: GitHub Repository Search
 * Works without token (rate-limited)
 */
async function githubExample() {
  console.log('\n=== GitHub Search ===\n');

  const searchRepos = githubSearchReposTool();
  const getRepo = githubGetRepoTool();

  try {
    // Search for AI agent frameworks
    const searchResults = await searchRepos.execute({
      query: 'agent framework language:typescript stars:>50',
      sort: 'stars',
      perPage: 5,
    });

    console.log('Top TypeScript Agent Frameworks:');
    searchResults.repos.forEach((repo, i) => {
      console.log(`  ${i + 1}. ${repo.fullName}`);
      console.log(`     ⭐ ${repo.stars} | 🍴 ${repo.forks}`);
      console.log(`     ${repo.description?.slice(0, 60) || 'No description'}...`);
    });

    // Get specific repo details
    const repoDetails = await getRepo.execute({
      owner: 'microsoft',
      repo: 'TypeScript',
    });

    console.log(`\nRepository: ${repoDetails.fullName}`);
    console.log(`  Stars: ${repoDetails.stars}`);
    console.log(`  Language: ${repoDetails.language}`);
    console.log(`  Topics: ${repoDetails.topics.join(', ')}`);
  } catch (error) {
    console.log('GitHub example skipped:', (error as Error).message);
  }
}

/**
 * Example 5: Stock and Crypto Quotes
 * Real-time financial data from Yahoo Finance
 */
async function financeExample() {
  console.log('\n=== Stock & Crypto Quotes ===\n');

  const quote = stockQuoteTool();
  const search = stockSearchTool();
  const crypto = cryptoQuoteTool();

  try {
    // Get stock quotes
    const stockQuotes = await quote.execute({
      symbols: ['AAPL', 'MSFT', 'GOOGL'],
    });

    console.log('Stock Quotes:');
    stockQuotes.quotes.forEach((q) => {
      const sign = q.regularMarketChange >= 0 ? '+' : '';
      console.log(
        `  ${q.symbol}: $${q.regularMarketPrice.toFixed(2)} ` +
          `(${sign}${q.regularMarketChangePercent.toFixed(2)}%)`
      );
    });

    // Get crypto quotes
    const cryptoQuotes = await crypto.execute({
      symbols: ['BTC-USD', 'ETH-USD'],
    });

    console.log('\nCrypto Quotes:');
    cryptoQuotes.quotes.forEach((q) => {
      const sign = q.change >= 0 ? '+' : '';
      console.log(
        `  ${q.symbol}: $${q.price.toLocaleString()} ` + `(${sign}${q.changePercent.toFixed(2)}%)`
      );
    });
  } catch (error) {
    console.log('Finance example skipped:', (error as Error).message);
  }
}

/**
 * Example 6: Arxiv Academic Paper Search
 * Search and retrieve academic papers
 */
async function arxivExample() {
  console.log('\n=== Arxiv Paper Search ===\n');

  const search = arxivSearchTool({ maxResults: 3 });
  const getPaper = arxivGetPaperTool();

  try {
    // Search for papers
    const searchResults = await search.execute({
      query: 'retrieval augmented generation',
      categories: ['cs.CL', 'cs.AI'],
    });

    console.log('Recent RAG Papers:');
    searchResults.papers.forEach((paper, i) => {
      console.log(`  ${i + 1}. ${paper.title.slice(0, 70)}...`);
      console.log(`     Authors: ${paper.authors.slice(0, 3).join(', ')}`);
      console.log(`     Category: ${paper.primaryCategory}`);
      console.log(`     PDF: ${paper.pdfUrl}`);
    });

    // Get a specific famous paper (Attention Is All You Need)
    if (searchResults.papers.length > 0) {
      console.log('\nGetting paper details...');
      const paper = await getPaper.execute({ id: '1706.03762' });
      console.log(`Paper: ${paper.title}`);
      console.log(`Abstract: ${paper.summary.slice(0, 200)}...`);
    }
  } catch (error) {
    console.log('Arxiv example skipped:', (error as Error).message);
  }
}

/**
 * Example 7: Article Extraction
 * Extract content from web articles
 */
async function newspaperExample() {
  console.log('\n=== Article Extraction ===\n');

  const extract = extractArticleTool();
  const headlines = extractHeadlinesTool();

  try {
    // Extract article content
    const article = await extract.execute({
      url: 'https://en.wikipedia.org/wiki/TypeScript',
      includeFullText: false,
      includeImages: false,
    });

    console.log(`Extracted: ${article.title}`);
    console.log(`Authors: ${article.authors.join(', ') || 'N/A'}`);
    console.log(`Preview: ${article.text.slice(0, 200)}...`);
  } catch (error) {
    console.log('Newspaper example skipped:', (error as Error).message);
  }
}

/**
 * Example 8: Restricted Shell
 * Execute commands safely with restrictions
 */
async function shellExample() {
  console.log('\n=== Restricted Shell ===\n');

  // Create a shell that only allows safe commands
  const shell = restrictedShellTool({
    allowedCommands: ['echo', 'date', 'node'],
    timeout: 5000,
  });

  try {
    const result = await shell.execute({
      command: 'echo "Hello from Seashore tools!"',
    });

    console.log(`Command: ${result.command}`);
    console.log(`Output: ${result.stdout}`);
    console.log(`Exit code: ${result.exitCode}`);
    console.log(`Time: ${result.executionTime}ms`);

    // Show Node.js version
    const nodeVersion = await shell.execute({
      command: 'node --version',
    });
    console.log(`\nNode.js version: ${nodeVersion.stdout}`);
  } catch (error) {
    console.log('Shell example error:', (error as Error).message);
  }
}

/**
 * Example 9: Create an Agent with Multiple Preset Tools
 */
async function agentExample() {
  console.log('\n=== Agent with Preset Tools ===\n');

  if (!process.env.OPENAI_API_KEY) {
    console.log('Skipping agent example (OPENAI_API_KEY not set)');
    return;
  }

  const agent = createAgent({
    llm: openaiText({ model: 'gpt-4o-mini' }),
    tools: [
      calculatorTool(),
      powerTool(),
      expressionTool(),
      wikipediaSummaryTool(),
      stockQuoteTool(),
      arxivSearchTool({ maxResults: 3 }),
    ],
    systemPrompt: `You are a helpful research assistant with access to:
- Calculator for math operations
- Wikipedia for general knowledge
- Stock quotes for financial data
- Arxiv for academic papers

Use tools to provide accurate, up-to-date information.`,
  });

  try {
    const response = await agent.chat({
      messages: [
        {
          role: 'user',
          content: 'What is 2^20, and can you tell me about machine learning from Wikipedia?',
        },
      ],
    });

    console.log('Agent Response:');
    console.log(response.content);
  } catch (error) {
    console.log('Agent example error:', (error as Error).message);
  }
}

/**
 * Main function - run all examples
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║       Seashore Preset Tools - Complete Examples        ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  // Calculator works offline - always run
  await calculatorExample();

  // Network-dependent examples
  console.log('\n--- Network-dependent examples ---');
  console.log('(These may fail if network is unavailable)\n');

  await duckduckgoExample();
  await wikipediaExample();
  await githubExample();
  await financeExample();
  await arxivExample();
  await newspaperExample();
  await shellExample();

  // Agent example (requires OpenAI API key)
  await agentExample();

  console.log('\n✅ Examples completed!');
}

main().catch(console.error);
