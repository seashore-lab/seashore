/**
 * @seashorelab/tool - Exa Tool
 *
 * Preset tool for AI-powered search using Exa API
 */

import { z } from 'zod';
import { defineTool } from '../define-tool';

/**
 * Configuration for Exa tools
 */
export interface ExaToolConfig {
  /** Exa API key */
  readonly apiKey: string;
  /** Base URL for Exa API */
  readonly baseUrl?: string;
  /** Default number of results */
  readonly numResults?: number;
}

/**
 * Exa search result item
 */
export interface ExaSearchResultItem {
  readonly url: string;
  readonly title: string;
  readonly score?: number;
  readonly publishedDate?: string;
  readonly author?: string;
  readonly text?: string;
  readonly highlights?: string[];
}

/**
 * Exa search result
 */
export interface ExaSearchResult {
  readonly query: string;
  readonly results: ExaSearchResultItem[];
  readonly autopromptString?: string;
}

/**
 * Input schema for Exa search
 */
const exaSearchInputSchema = z.object({
  query: z.string().describe('The search query'),
  numResults: z.number().int().min(1).max(100).optional().describe('Number of results to return'),
  useAutoprompt: z
    .boolean()
    .optional()
    .describe('Whether to use Exa autoprompt to enhance the query'),
  type: z
    .enum(['neural', 'keyword', 'auto'])
    .optional()
    .describe('Search type: neural (semantic), keyword (traditional), or auto'),
  category: z
    .enum([
      'company',
      'research paper',
      'news',
      'linkedin profile',
      'github',
      'tweet',
      'movie',
      'song',
      'personal site',
      'pdf',
    ])
    .optional()
    .describe('Category filter for search results'),
  includeDomains: z.array(z.string()).optional().describe('Domains to include in search'),
  excludeDomains: z.array(z.string()).optional().describe('Domains to exclude from search'),
  startPublishedDate: z
    .string()
    .optional()
    .describe('Filter results published after this date (ISO 8601 format)'),
  endPublishedDate: z
    .string()
    .optional()
    .describe('Filter results published before this date (ISO 8601 format)'),
});

/**
 * Input schema for Exa find similar
 */
const exaFindSimilarInputSchema = z.object({
  url: z.string().url().describe('URL to find similar content for'),
  numResults: z.number().int().min(1).max(100).optional().describe('Number of results to return'),
  includeDomains: z.array(z.string()).optional().describe('Domains to include in search'),
  excludeDomains: z.array(z.string()).optional().describe('Domains to exclude from search'),
  excludeSourceDomain: z
    .boolean()
    .optional()
    .describe('Whether to exclude results from the source domain'),
});

/**
 * Input schema for Exa get contents
 */
const exaGetContentsInputSchema = z.object({
  urls: z.array(z.string().url()).describe('URLs to get contents for'),
  text: z.boolean().optional().describe('Whether to include the full text content of each page'),
  highlights: z.boolean().optional().describe('Whether to include highlighted text snippets'),
  summary: z.boolean().optional().describe('Whether to include an AI-generated summary'),
});

const EXA_BASE_URL = 'https://api.exa.ai';

/**
 * Create an Exa search tool for AI-powered web search
 *
 * @example
 * ```typescript
 * import { exaSearchTool } from '@seashorelab/tool/presets';
 *
 * const search = exaSearchTool({ apiKey: process.env.EXA_API_KEY! });
 * const results = await search.execute({
 *   query: 'latest advances in AI agents',
 *   numResults: 10,
 *   useAutoprompt: true
 * });
 * ```
 */
export function exaSearchTool(config: ExaToolConfig) {
  const baseUrl = config.baseUrl ?? EXA_BASE_URL;
  const defaultNumResults = config.numResults ?? 10;

  return defineTool({
    name: 'exa_search',
    description:
      'Search the web using Exa AI-powered search. Returns high-quality, semantically relevant results.',
    inputSchema: exaSearchInputSchema,

    async execute({
      query,
      numResults = defaultNumResults,
      useAutoprompt = true,
      type = 'auto',
      category,
      includeDomains,
      excludeDomains,
      startPublishedDate,
      endPublishedDate,
    }) {
      const response = await fetch(`${baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
        },
        body: JSON.stringify({
          query,
          numResults,
          useAutoprompt,
          type,
          category,
          includeDomains,
          excludeDomains,
          startPublishedDate,
          endPublishedDate,
          contents: {
            text: true,
            highlights: true,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Exa API error: ${response.status} - ${errorText}`);
      }

      const data = (await response.json()) as {
        results: ExaSearchResultItem[];
        autopromptString?: string;
      };

      return {
        query,
        results: data.results,
        autopromptString: data.autopromptString,
      } as ExaSearchResult;
    },
  });
}

/**
 * Create an Exa find similar tool to find content similar to a given URL
 *
 * @example
 * ```typescript
 * import { exaFindSimilarTool } from '@seashorelab/tool/presets';
 *
 * const findSimilar = exaFindSimilarTool({ apiKey: process.env.EXA_API_KEY! });
 * const results = await findSimilar.execute({
 *   url: 'https://example.com/article',
 *   numResults: 10
 * });
 * ```
 */
export function exaFindSimilarTool(config: ExaToolConfig) {
  const baseUrl = config.baseUrl ?? EXA_BASE_URL;
  const defaultNumResults = config.numResults ?? 10;

  return defineTool({
    name: 'exa_find_similar',
    description:
      'Find web pages similar to a given URL using Exa AI. Great for discovering related content.',
    inputSchema: exaFindSimilarInputSchema,

    async execute({
      url,
      numResults = defaultNumResults,
      includeDomains,
      excludeDomains,
      excludeSourceDomain = true,
    }) {
      const response = await fetch(`${baseUrl}/findSimilar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
        },
        body: JSON.stringify({
          url,
          numResults,
          includeDomains,
          excludeDomains,
          excludeSourceDomain,
          contents: {
            text: true,
            highlights: true,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Exa API error: ${response.status} - ${errorText}`);
      }

      const data = (await response.json()) as {
        results: ExaSearchResultItem[];
      };

      return {
        query: `Similar to: ${url}`,
        results: data.results,
      } as ExaSearchResult;
    },
  });
}

/**
 * Create an Exa get contents tool to extract content from URLs
 *
 * @example
 * ```typescript
 * import { exaGetContentsTool } from '@seashorelab/tool/presets';
 *
 * const getContents = exaGetContentsTool({ apiKey: process.env.EXA_API_KEY! });
 * const results = await getContents.execute({
 *   urls: ['https://example.com/article1', 'https://example.com/article2'],
 *   text: true,
 *   summary: true
 * });
 * ```
 */
export function exaGetContentsTool(config: ExaToolConfig) {
  const baseUrl = config.baseUrl ?? EXA_BASE_URL;

  return defineTool({
    name: 'exa_get_contents',
    description:
      'Get the contents of web pages using Exa. Can extract text, highlights, and summaries.',
    inputSchema: exaGetContentsInputSchema,

    async execute({ urls, text = true, highlights = true, summary = false }) {
      const response = await fetch(`${baseUrl}/contents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
        },
        body: JSON.stringify({
          urls,
          text,
          highlights,
          summary,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Exa API error: ${response.status} - ${errorText}`);
      }

      const data = (await response.json()) as {
        results: ExaSearchResultItem[];
      };

      return {
        query: `Contents of ${urls.length} URL(s)`,
        results: data.results,
      } as ExaSearchResult;
    },
  });
}
