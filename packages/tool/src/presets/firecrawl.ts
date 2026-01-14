/**
 * @seashore/tool - Firecrawl Tool
 *
 * Preset tool for web scraping using Firecrawl API
 */

import { z } from 'zod';
import { defineTool } from '../define-tool';

/**
 * Firecrawl tool configuration
 */
export interface FirecrawlConfig {
  /** Firecrawl API key */
  readonly apiKey: string;

  /** Output formats */
  readonly formats?: readonly ('markdown' | 'html' | 'text')[];

  /** Request timeout in milliseconds */
  readonly timeout?: number;
}

/**
 * Firecrawl result
 */
export interface FirecrawlResult {
  readonly content: string;
  readonly title: string;
  readonly links?: readonly string[];
  readonly metadata: {
    readonly sourceUrl: string;
    readonly statusCode: number;
  };
}

/**
 * Input schema for Firecrawl tool
 */
const firecrawlInputSchema = z.object({
  url: z.string().describe('URL of the webpage to scrape (must be a valid HTTP/HTTPS URL)'),
  includeLinks: z.boolean().optional().describe('Whether to extract links from the page'),
});

/**
 * Create a Firecrawl web scraping tool
 *
 * @example
 * ```typescript
 * import { firecrawlTool } from '@seashore/tool/presets';
 *
 * const scraper = firecrawlTool({
 *   apiKey: process.env.FIRECRAWL_API_KEY!,
 *   formats: ['markdown'],
 * });
 *
 * const result = await scraper.execute({
 *   url: 'https://example.com/article',
 *   includeLinks: true,
 * });
 * ```
 */
export function firecrawlTool(config: FirecrawlConfig) {
  const { apiKey, formats = ['markdown'], timeout = 30000 } = config;

  return defineTool({
    name: 'firecrawl_scrape',
    description:
      'Scrape a webpage and extract its content in markdown format. Useful for reading articles, documentation, or any web page content.',
    inputSchema: firecrawlInputSchema,
    timeout,

    async execute({ url, includeLinks = false }) {
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url,
          formats,
          includeTags: includeLinks ? ['a'] : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Firecrawl API error: ${error}`);
      }

      const data = (await response.json()) as FirecrawlAPIResponse;

      if (!data.success) {
        throw new Error(`Firecrawl scrape failed: ${data.error ?? 'Unknown error'}`);
      }

      return transformResponse(data, url, includeLinks);
    },
  });
}

/**
 * Transform Firecrawl API response to our format
 */
function transformResponse(
  data: FirecrawlAPIResponse,
  sourceUrl: string,
  includeLinks: boolean
): FirecrawlResult {
  const content = data.data?.markdown ?? data.data?.html ?? data.data?.text ?? '';

  // Extract links if requested
  const links = includeLinks ? extractLinks(data.data?.html ?? '') : undefined;

  return {
    content,
    title: data.data?.metadata?.title ?? '',
    links,
    metadata: {
      sourceUrl,
      statusCode: data.data?.metadata?.statusCode ?? 200,
    },
  };
}

/**
 * Extract links from HTML content
 */
function extractLinks(html: string): string[] {
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
  const links: string[] = [];
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    if (href !== undefined && href.startsWith('http')) {
      links.push(href);
    }
  }

  return [...new Set(links)]; // Deduplicate
}

/**
 * Firecrawl API response type
 */
interface FirecrawlAPIResponse {
  success: boolean;
  error?: string;
  data?: {
    markdown?: string;
    html?: string;
    text?: string;
    metadata?: {
      title?: string;
      statusCode?: number;
    };
  };
}
