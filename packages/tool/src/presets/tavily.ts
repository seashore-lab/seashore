/**
 * @seashorelab/tool - Tavily Tool
 *
 * Preset tools for AI-powered search using Tavily API
 */

import { z } from 'zod';
import { defineTool } from '../define-tool';

/**
 * Configuration for Tavily tools
 */
export interface TavilyToolConfig {
  /** Tavily API key */
  readonly apiKey: string;
  /** Base URL for Tavily API (optional) */
  readonly baseUrl?: string;
  /** Default search depth */
  readonly searchDepth?: 'basic' | 'advanced';
  /** Default number of results */
  readonly maxResults?: number;
}

/**
 * Tavily search result item
 */
export interface TavilySearchResultItem {
  readonly title: string;
  readonly url: string;
  readonly content: string;
  readonly score: number;
  readonly publishedDate?: string;
}

/**
 * Tavily search result
 */
export interface TavilySearchResult {
  readonly query: string;
  readonly answer?: string;
  readonly results: TavilySearchResultItem[];
  readonly followUpQuestions?: string[];
  readonly images?: string[];
  readonly responseTime: number;
}

/**
 * Input schema for Tavily search
 */
const tavilySearchInputSchema = z.object({
  query: z.string().describe('The search query'),
  searchDepth: z
    .enum(['basic', 'advanced'])
    .optional()
    .describe('Search depth: basic (faster) or advanced (more thorough)'),
  includeAnswer: z
    .boolean()
    .optional()
    .describe('Whether to include an AI-generated answer summary'),
  includeRawContent: z.boolean().optional().describe('Whether to include raw page content'),
  maxResults: z
    .number()
    .int()
    .min(1)
    .max(20)
    .optional()
    .describe('Maximum number of results (1-20)'),
  includeDomains: z.array(z.string()).optional().describe('Domains to include in search'),
  excludeDomains: z.array(z.string()).optional().describe('Domains to exclude from search'),
  topic: z
    .enum(['general', 'news', 'finance'])
    .optional()
    .describe('Topic category to focus the search'),
});

/**
 * Input schema for Tavily extract
 */
const tavilyExtractInputSchema = z.object({
  urls: z.array(z.string().url()).min(1).max(10).describe('URLs to extract content from (max 10)'),
});

/**
 * Input schema for Q&A
 */
const tavilyQnaInputSchema = z.object({
  question: z.string().describe('The question to answer'),
  searchDepth: z
    .enum(['basic', 'advanced'])
    .optional()
    .describe('Search depth for finding the answer'),
  includeDomains: z.array(z.string()).optional().describe('Domains to search for answers'),
  excludeDomains: z.array(z.string()).optional().describe('Domains to exclude from search'),
});

const TAVILY_BASE_URL = 'https://api.tavily.com';

/**
 * Create a Tavily search tool
 *
 * @example
 * ```typescript
 * import { tavilySearchTool } from '@seashorelab/tool/presets';
 *
 * const search = tavilySearchTool({ apiKey: process.env.TAVILY_API_KEY! });
 * const results = await search.execute({
 *   query: 'latest AI research breakthroughs',
 *   includeAnswer: true,
 *   maxResults: 10
 * });
 * ```
 */
export function tavilySearchTool(config: TavilyToolConfig) {
  const baseUrl = config.baseUrl ?? TAVILY_BASE_URL;
  const defaultSearchDepth = config.searchDepth ?? 'basic';
  const defaultMaxResults = config.maxResults ?? 5;

  return defineTool({
    name: 'tavily_search',
    description:
      'Search the web using Tavily AI-powered search. Returns relevant results with optional AI-generated answer.',
    inputSchema: tavilySearchInputSchema,

    async execute({
      query,
      searchDepth = defaultSearchDepth,
      includeAnswer = true,
      includeRawContent = false,
      maxResults = defaultMaxResults,
      includeDomains,
      excludeDomains,
      topic = 'general',
    }) {
      const startTime = Date.now();

      const response = await fetch(`${baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: config.apiKey,
          query,
          search_depth: searchDepth,
          include_answer: includeAnswer,
          include_raw_content: includeRawContent,
          max_results: maxResults,
          include_domains: includeDomains,
          exclude_domains: excludeDomains,
          topic,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Tavily API error: ${response.status} - ${errorText}`);
      }

      interface TavilyApiResult {
        title: string;
        url: string;
        content: string;
        score: number;
        published_date?: string;
      }

      const data = (await response.json()) as {
        answer?: string;
        results: TavilyApiResult[];
        follow_up_questions?: string[];
        images?: string[];
      };

      return {
        query,
        answer: data.answer,
        results: data.results.map(
          (r: TavilyApiResult): TavilySearchResultItem => ({
            title: r.title,
            url: r.url,
            content: r.content,
            score: r.score,
            publishedDate: r.published_date,
          })
        ),
        followUpQuestions: data.follow_up_questions,
        images: data.images,
        responseTime: Date.now() - startTime,
      } as TavilySearchResult;
    },
  });
}

/**
 * Create a Tavily extract tool for getting content from URLs
 *
 * @example
 * ```typescript
 * import { tavilyExtractTool } from '@seashorelab/tool/presets';
 *
 * const extract = tavilyExtractTool({ apiKey: process.env.TAVILY_API_KEY! });
 * const content = await extract.execute({
 *   urls: ['https://example.com/article']
 * });
 * ```
 */
export function tavilyExtractTool(config: TavilyToolConfig) {
  const baseUrl = config.baseUrl ?? TAVILY_BASE_URL;

  return defineTool({
    name: 'tavily_extract',
    description: 'Extract and parse content from one or more URLs using Tavily.',
    inputSchema: tavilyExtractInputSchema,

    async execute({ urls }) {
      const response = await fetch(`${baseUrl}/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: config.apiKey,
          urls,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Tavily API error: ${response.status} - ${errorText}`);
      }

      interface TavilyExtractResult {
        url: string;
        raw_content: string;
      }

      const data = (await response.json()) as {
        results: TavilyExtractResult[];
        failed_results?: { url: string; error: string }[];
      };

      return {
        successCount: data.results.length,
        failedCount: data.failed_results?.length ?? 0,
        results: data.results.map((r: TavilyExtractResult) => ({
          url: r.url,
          content: r.raw_content,
        })),
        failed: data.failed_results,
      };
    },
  });
}

/**
 * Create a Tavily Q&A tool for direct question answering
 *
 * @example
 * ```typescript
 * import { tavilyQnaTool } from '@seashorelab/tool/presets';
 *
 * const qna = tavilyQnaTool({ apiKey: process.env.TAVILY_API_KEY! });
 * const result = await qna.execute({
 *   question: 'What is the capital of France?'
 * });
 * console.log(result.answer);
 * ```
 */
export function tavilyQnaTool(config: TavilyToolConfig) {
  const baseUrl = config.baseUrl ?? TAVILY_BASE_URL;

  return defineTool({
    name: 'tavily_qna',
    description:
      'Get a direct answer to a question using Tavily AI search. Best for factual questions.',
    inputSchema: tavilyQnaInputSchema,

    async execute({ question, searchDepth = 'advanced', includeDomains, excludeDomains }) {
      const startTime = Date.now();

      const response = await fetch(`${baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: config.apiKey,
          query: question,
          search_depth: searchDepth,
          include_answer: true,
          include_raw_content: false,
          max_results: 5,
          include_domains: includeDomains,
          exclude_domains: excludeDomains,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Tavily API error: ${response.status} - ${errorText}`);
      }

      interface TavilyApiResult {
        title: string;
        url: string;
        content: string;
      }

      const data = (await response.json()) as {
        answer: string;
        results: TavilyApiResult[];
        follow_up_questions?: string[];
      };

      return {
        question,
        answer: data.answer,
        sources: data.results.slice(0, 3).map((r: TavilyApiResult) => ({
          title: r.title,
          url: r.url,
          snippet: r.content.slice(0, 200),
        })),
        followUpQuestions: data.follow_up_questions,
        responseTime: Date.now() - startTime,
      };
    },
  });
}

/**
 * Create a Tavily news search tool
 *
 * @example
 * ```typescript
 * import { tavilyNewsTool } from '@seashorelab/tool/presets';
 *
 * const news = tavilyNewsTool({ apiKey: process.env.TAVILY_API_KEY! });
 * const results = await news.execute({
 *   query: 'artificial intelligence',
 *   maxResults: 10
 * });
 * ```
 */
export function tavilyNewsTool(config: TavilyToolConfig) {
  const baseUrl = config.baseUrl ?? TAVILY_BASE_URL;
  const defaultMaxResults = config.maxResults ?? 10;

  const inputSchema = z.object({
    query: z.string().describe('News search query'),
    maxResults: z.number().int().min(1).max(20).optional().describe('Maximum number of results'),
    days: z
      .number()
      .int()
      .min(1)
      .max(30)
      .optional()
      .describe('Number of days to search back (default: 7)'),
  });

  return defineTool({
    name: 'tavily_news',
    description: 'Search for recent news articles using Tavily. Optimized for news content.',
    inputSchema,

    async execute({ query, maxResults = defaultMaxResults, days = 7 }) {
      const startTime = Date.now();

      const response = await fetch(`${baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: config.apiKey,
          query,
          search_depth: 'advanced',
          include_answer: false,
          max_results: maxResults,
          topic: 'news',
          days,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Tavily API error: ${response.status} - ${errorText}`);
      }

      interface TavilyNewsResult {
        title: string;
        url: string;
        content: string;
        score: number;
        published_date?: string;
      }

      const data = (await response.json()) as {
        results: TavilyNewsResult[];
      };

      return {
        query,
        resultCount: data.results.length,
        articles: data.results.map((r: TavilyNewsResult) => ({
          title: r.title,
          url: r.url,
          content: r.content,
          score: r.score,
          publishedDate: r.published_date,
        })),
        responseTime: Date.now() - startTime,
      };
    },
  });
}
