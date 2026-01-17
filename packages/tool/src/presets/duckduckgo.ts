/**
 * @seashore/tool - DuckDuckGo Search Tool
 *
 * Preset tool for web search and news using DuckDuckGo (ddgs library)
 */

import { z } from 'zod';
import { defineTool } from '../define-tool';

/**
 * DuckDuckGo tool configuration
 */
export interface DuckDuckGoConfig {
  /** Maximum number of results to return */
  readonly maxResults?: number;

  /** Region for search results (e.g., 'wt-wt', 'us-en', 'uk-en', 'cn-zh') */
  readonly region?: string;

  /** Safe search level ('on', 'moderate', 'off') */
  readonly safeSearch?: 'on' | 'moderate' | 'off';

  /** Request timeout in milliseconds */
  readonly timeout?: number;
}

/**
 * DuckDuckGo search result
 */
export interface DuckDuckGoSearchResult {
  readonly title: string;
  readonly link: string;
  readonly snippet: string;
}

/**
 * DuckDuckGo news result
 */
export interface DuckDuckGoNewsResult {
  readonly title: string;
  readonly link: string;
  readonly snippet: string;
  readonly source: string;
  readonly date: string;
}

/**
 * Input schema for DuckDuckGo search tool
 */
const searchInputSchema = z.object({
  query: z.string().describe('Search query'),
  maxResults: z.number().optional().describe('Maximum number of results to return (default: 5)'),
});

/**
 * Input schema for DuckDuckGo news tool
 */
const newsInputSchema = z.object({
  query: z.string().describe('News search query'),
  maxResults: z.number().optional().describe('Maximum number of results to return (default: 5)'),
});

/**
 * Create a DuckDuckGo search tool
 *
 * @example
 * ```typescript
 * import { duckduckgoSearchTool } from '@seashore/tool/presets';
 *
 * const search = duckduckgoSearchTool({
 *   maxResults: 10,
 *   region: 'us-en',
 * });
 *
 * const result = await search.execute({ query: 'latest AI news' });
 * ```
 */
export function duckduckgoSearchTool(config: DuckDuckGoConfig = {}) {
  const { maxResults = 5, region = 'wt-wt', safeSearch = 'moderate', timeout = 10000 } = config;

  return defineTool({
    name: 'duckduckgo_search',
    description:
      'Search the web using DuckDuckGo. Returns organic search results with titles, links, and snippets. Useful for finding current information about any topic.',
    inputSchema: searchInputSchema,
    timeout,

    async execute({ query, maxResults: requestedResults }) {
      const numResults = requestedResults ?? maxResults;

      // DuckDuckGo HTML API endpoint
      const params = new URLSearchParams({
        q: query,
        kl: region,
        kp: safeSearch === 'on' ? '1' : safeSearch === 'off' ? '-2' : '-1',
      });

      const response = await fetch(`https://html.duckduckgo.com/html/?${params.toString()}`, {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`DuckDuckGo search failed: ${response.statusText}`);
      }

      const html = await response.text();
      const results = parseSearchResults(html, numResults);

      return {
        query,
        results,
        resultCount: results.length,
      };
    },
  });
}

/**
 * Create a DuckDuckGo news search tool
 *
 * @example
 * ```typescript
 * import { duckduckgoNewsTool } from '@seashore/tool/presets';
 *
 * const news = duckduckgoNewsTool({
 *   maxResults: 10,
 * });
 *
 * const result = await news.execute({ query: 'artificial intelligence' });
 * ```
 */
export function duckduckgoNewsTool(config: DuckDuckGoConfig = {}) {
  const { maxResults = 5, region = 'wt-wt', safeSearch = 'moderate', timeout = 10000 } = config;

  return defineTool({
    name: 'duckduckgo_news',
    description:
      'Search for news articles using DuckDuckGo. Returns recent news with titles, links, snippets, and sources. Useful for finding current news and events.',
    inputSchema: newsInputSchema,
    timeout,

    async execute({ query, maxResults: requestedResults }) {
      const numResults = requestedResults ?? maxResults;

      // DuckDuckGo news search with news type parameter
      const params = new URLSearchParams({
        q: query,
        kl: region,
        kp: safeSearch === 'on' ? '1' : safeSearch === 'off' ? '-2' : '-1',
        iar: 'news', // news type
        df: 'w', // past week
      });

      const response = await fetch(`https://html.duckduckgo.com/html/?${params.toString()}`, {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`DuckDuckGo news search failed: ${response.statusText}`);
      }

      const html = await response.text();
      const results = parseNewsResults(html, numResults);

      return {
        query,
        results,
        resultCount: results.length,
      };
    },
  });
}

/**
 * Parse search results from DuckDuckGo HTML response
 */
function parseSearchResults(html: string, maxResults: number): DuckDuckGoSearchResult[] {
  const results: DuckDuckGoSearchResult[] = [];

  // Match result entries from DuckDuckGo HTML
  const resultRegex =
    /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/a>/gi;

  let match;
  while ((match = resultRegex.exec(html)) !== null && results.length < maxResults) {
    const link = decodeURIComponent(match[1]?.replace('/l/?uddg=', '').split('&')[0] ?? '');
    const title = match[2]?.trim() ?? '';
    const snippet = (match[3] ?? '').replace(/<[^>]*>/g, '').trim();

    if (link && title) {
      results.push({ title, link, snippet });
    }
  }

  // Fallback: try simpler regex if no results
  if (results.length === 0) {
    const simpleRegex = /<a[^>]*class="[^"]*result[^"]*"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi;
    while ((match = simpleRegex.exec(html)) !== null && results.length < maxResults) {
      const link = match[1] ?? '';
      const title = match[2]?.trim() ?? '';
      if (link.startsWith('http') && title) {
        results.push({ title, link, snippet: '' });
      }
    }
  }

  return results;
}

/**
 * Parse news results from DuckDuckGo HTML response
 */
function parseNewsResults(html: string, maxResults: number): DuckDuckGoNewsResult[] {
  const results: DuckDuckGoNewsResult[] = [];

  // Match result entries (same format as search, with additional source parsing)
  const resultRegex =
    /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/a>/gi;

  let match;
  while ((match = resultRegex.exec(html)) !== null && results.length < maxResults) {
    const link = decodeURIComponent(match[1]?.replace('/l/?uddg=', '').split('&')[0] ?? '');
    const title = match[2]?.trim() ?? '';
    const snippet = (match[3] ?? '').replace(/<[^>]*>/g, '').trim();

    if (link && title) {
      // Extract source from URL
      const source = extractDomain(link);
      results.push({
        title,
        link,
        snippet,
        source,
        date: '', // DuckDuckGo HTML doesn't always include dates
      });
    }
  }

  return results;
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return '';
  }
}
