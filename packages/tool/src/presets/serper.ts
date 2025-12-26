/**
 * @seashore/tool - Serper Search Tool
 *
 * Preset tool for web search using Serper API
 */

import { z } from 'zod';
import { defineTool } from '../define-tool.js';

/**
 * Serper tool configuration
 */
export interface SerperConfig {
  /** Serper API key */
  readonly apiKey: string;

  /** Search region (e.g., 'cn', 'us') */
  readonly country?: string;

  /** Search language (e.g., 'zh-cn', 'en') */
  readonly locale?: string;

  /** Number of results to return */
  readonly numResults?: number;
}

/**
 * Serper search result
 */
export interface SerperResult {
  readonly organic: readonly OrganicResult[];
  readonly knowledgeGraph?: KnowledgeGraph;
  readonly relatedSearches?: readonly string[];
}

/**
 * Organic search result
 */
export interface OrganicResult {
  readonly title: string;
  readonly link: string;
  readonly snippet: string;
  readonly position: number;
}

/**
 * Knowledge graph result
 */
export interface KnowledgeGraph {
  readonly title: string;
  readonly description?: string;
  readonly type?: string;
}

/**
 * Input schema for Serper tool
 */
const serperInputSchema = z.object({
  query: z.string().describe('Search query'),
  type: z
    .enum(['search', 'news', 'images'])
    .optional()
    .describe('Search type (default: search)'),
});

/**
 * Create a Serper search tool
 *
 * @example
 * ```typescript
 * import { serperTool } from '@seashore/tool/presets';
 *
 * const search = serperTool({
 *   apiKey: process.env.SERPER_API_KEY!,
 *   country: 'cn',
 *   locale: 'zh-cn',
 * });
 *
 * const result = await search.execute({ query: '最新 AI 新闻' });
 * ```
 */
export function serperTool(config: SerperConfig) {
  const { apiKey, country, locale, numResults = 10 } = config;

  return defineTool({
    name: 'serper_search',
    description:
      'Search the web using Serper API. Returns organic search results, knowledge graph, and related searches.',
    inputSchema: serperInputSchema,

    async execute({ query, type = 'search' }) {
      const endpoint = getEndpoint(type);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey,
        },
        body: JSON.stringify({
          q: query,
          gl: country,
          hl: locale,
          num: numResults,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Serper API error: ${error}`);
      }

      const data = (await response.json()) as SerperAPIResponse;

      return transformResponse(data);
    },
  });
}

/**
 * Get API endpoint based on search type
 */
function getEndpoint(type: 'search' | 'news' | 'images'): string {
  const base = 'https://google.serper.dev';
  switch (type) {
    case 'news':
      return `${base}/news`;
    case 'images':
      return `${base}/images`;
    default:
      return `${base}/search`;
  }
}

/**
 * Transform Serper API response to our format
 */
function transformResponse(data: SerperAPIResponse): SerperResult {
  return {
    organic:
      data.organic?.map((item, index) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet ?? '',
        position: index + 1,
      })) ?? [],
    knowledgeGraph: data.knowledgeGraph
      ? {
          title: data.knowledgeGraph.title,
          description: data.knowledgeGraph.description,
          type: data.knowledgeGraph.type,
        }
      : undefined,
    relatedSearches: data.relatedSearches?.map((s) => s.query),
  };
}

/**
 * Serper API response type
 */
interface SerperAPIResponse {
  organic?: Array<{
    title: string;
    link: string;
    snippet?: string;
  }>;
  knowledgeGraph?: {
    title: string;
    description?: string;
    type?: string;
  };
  relatedSearches?: Array<{
    query: string;
  }>;
}
