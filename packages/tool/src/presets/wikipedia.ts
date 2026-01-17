/**
 * @seashore/tool - Wikipedia Tool
 *
 * Preset tool for searching Wikipedia and retrieving article summaries
 */

import { z } from 'zod';
import { defineTool } from '../define-tool';

/**
 * Wikipedia tool configuration
 */
export interface WikipediaConfig {
  /** Language code for Wikipedia (e.g., 'en', 'zh', 'ja') */
  readonly language?: string;

  /** Request timeout in milliseconds */
  readonly timeout?: number;
}

/**
 * Wikipedia search result
 */
export interface WikipediaSearchResult {
  readonly title: string;
  readonly pageId: number;
  readonly snippet: string;
}

/**
 * Wikipedia article result
 */
export interface WikipediaArticle {
  readonly title: string;
  readonly pageId: number;
  readonly extract: string;
  readonly url: string;
}

/**
 * Input schema for Wikipedia search tool
 */
const searchInputSchema = z.object({
  query: z.string().describe('Search query for Wikipedia'),
  limit: z.number().optional().describe('Maximum number of search results (default: 5)'),
});

/**
 * Input schema for Wikipedia summary tool
 */
const summaryInputSchema = z.object({
  title: z.string().describe('Wikipedia article title'),
  sentences: z.number().optional().describe('Number of sentences for the summary (default: 5)'),
});

/**
 * Create a Wikipedia search tool
 *
 * @example
 * ```typescript
 * import { wikipediaSearchTool } from '@seashore/tool/presets';
 *
 * const search = wikipediaSearchTool({ language: 'en' });
 * const result = await search.execute({ query: 'artificial intelligence' });
 * ```
 */
export function wikipediaSearchTool(config: WikipediaConfig = {}) {
  const { language = 'en', timeout = 10000 } = config;

  return defineTool({
    name: 'wikipedia_search',
    description:
      'Search Wikipedia for articles matching a query. Returns a list of matching article titles and snippets.',
    inputSchema: searchInputSchema,
    timeout,

    async execute({ query, limit = 5 }) {
      const params = new URLSearchParams({
        action: 'query',
        list: 'search',
        srsearch: query,
        srlimit: String(limit),
        format: 'json',
        origin: '*',
      });

      const response = await fetch(
        `https://${language}.wikipedia.org/w/api.php?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Wikipedia search failed: ${response.statusText}`);
      }

      const data = (await response.json()) as WikipediaAPISearchResponse;

      const results: WikipediaSearchResult[] =
        data.query?.search?.map((item) => ({
          title: item.title,
          pageId: item.pageid,
          snippet: item.snippet.replace(/<[^>]*>/g, ''), // Remove HTML tags
        })) ?? [];

      return {
        query,
        results,
        resultCount: results.length,
      };
    },
  });
}

/**
 * Create a Wikipedia summary tool
 *
 * @example
 * ```typescript
 * import { wikipediaSummaryTool } from '@seashore/tool/presets';
 *
 * const summary = wikipediaSummaryTool({ language: 'en' });
 * const result = await summary.execute({ title: 'Artificial intelligence' });
 * ```
 */
export function wikipediaSummaryTool(config: WikipediaConfig = {}) {
  const { language = 'en', timeout = 10000 } = config;

  return defineTool({
    name: 'wikipedia_summary',
    description:
      'Get a summary of a Wikipedia article by title. Returns the article extract and URL. Use this to get detailed information about a specific topic.',
    inputSchema: summaryInputSchema,
    timeout,

    async execute({ title, sentences = 5 }) {
      const params = new URLSearchParams({
        action: 'query',
        titles: title,
        prop: 'extracts|info',
        exintro: 'true',
        explaintext: 'true',
        exsentences: String(sentences),
        inprop: 'url',
        format: 'json',
        origin: '*',
      });

      const response = await fetch(
        `https://${language}.wikipedia.org/w/api.php?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Wikipedia summary failed: ${response.statusText}`);
      }

      const data = (await response.json()) as WikipediaAPISummaryResponse;

      const pages = data.query?.pages ?? {};
      const pageIds = Object.keys(pages);

      if (pageIds.length === 0 || pageIds[0] === '-1') {
        throw new Error(`Wikipedia article not found: ${title}`);
      }

      const firstPageId = pageIds[0];
      if (firstPageId === undefined) {
        throw new Error(`Wikipedia article not found: ${title}`);
      }

      const page = pages[firstPageId];
      if (page === undefined) {
        throw new Error(`Wikipedia article not found: ${title}`);
      }

      const article: WikipediaArticle = {
        title: page.title,
        pageId: page.pageid,
        extract: page.extract ?? '',
        url: page.fullurl ?? `https://${language}.wikipedia.org/wiki/${encodeURIComponent(title)}`,
      };

      return article;
    },
  });
}

/**
 * Wikipedia API search response type
 */
interface WikipediaAPISearchResponse {
  query?: {
    search?: Array<{
      title: string;
      pageid: number;
      snippet: string;
    }>;
  };
}

/**
 * Wikipedia API summary response type
 */
interface WikipediaAPISummaryResponse {
  query?: {
    pages?: Record<
      string,
      {
        pageid: number;
        title: string;
        extract?: string;
        fullurl?: string;
      }
    >;
  };
}
