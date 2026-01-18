/**
 * @seashorelab/tool - Preset Tools
 *
 * Re-export all preset tools
 */

// Existing tools
export { serperTool, type SerperConfig, type SerperResult } from './serper';
export { firecrawlTool, type FirecrawlConfig, type FirecrawlResult } from './firecrawl';

// DuckDuckGo tools - Web search without API key
export {
  duckduckgoSearchTool,
  duckduckgoNewsTool,
  type DuckDuckGoConfig,
  type DuckDuckGoSearchResult,
  type DuckDuckGoNewsResult,
} from './duckduckgo';

// Wikipedia tools - Knowledge base access
export {
  wikipediaSearchTool,
  wikipediaSummaryTool,
  type WikipediaConfig,
  type WikipediaSearchResult,
  type WikipediaArticle,
} from './wikipedia';

// Exa tools - AI-powered search
export {
  exaSearchTool,
  exaFindSimilarTool,
  exaGetContentsTool,
  type ExaToolConfig,
  type ExaSearchResult,
  type ExaSearchResultItem,
} from './exa';

// GitHub tools - Repository and code search
export {
  githubSearchReposTool,
  githubGetRepoTool,
  githubListIssuesTool,
  githubListPullRequestsTool,
  githubGetFileContentTool,
  githubSearchCodeTool,
  type GitHubToolConfig,
  type GitHubRepo,
  type GitHubIssue,
  type GitHubPullRequest,
} from './github';

// Shell tools - Command execution
export {
  shellTool,
  restrictedShellTool,
  runScriptTool,
  type ShellToolConfig,
  type ShellResult,
} from './shell';

// YFinance tools - Stock and financial data
export {
  stockQuoteTool,
  stockHistoricalTool,
  stockSearchTool,
  cryptoQuoteTool,
  type StockQuote,
  type HistoricalDataPoint,
} from './yfinance';

// Arxiv tools - Academic paper search
export {
  arxivSearchTool,
  arxivGetPaperTool,
  arxivAuthorSearchTool,
  arxivRecentPapersTool,
  type ArxivToolConfig,
  type ArxivPaper,
} from './arxiv';

// Newspaper tools - Article extraction
export {
  extractArticleTool,
  batchExtractArticlesTool,
  extractHeadlinesTool,
  type ExtractedArticle,
} from './newspaper';

// Tavily tools - AI-powered search with answers
export {
  tavilySearchTool,
  tavilyExtractTool,
  tavilyQnaTool,
  tavilyNewsTool,
  type TavilyToolConfig,
  type TavilySearchResult,
  type TavilySearchResultItem,
} from './tavily';
