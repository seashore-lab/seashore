/**
 * @seashorelab/tool - Arxiv Tool
 *
 * Preset tools for searching and retrieving academic papers from arXiv
 */

import { z } from 'zod';
import { defineTool } from '../define-tool';

/**
 * Configuration for Arxiv tools
 */
export interface ArxivToolConfig {
  /** Maximum number of results to return (default: 10) */
  readonly maxResults?: number;
  /** Sort by criteria */
  readonly sortBy?: 'relevance' | 'lastUpdatedDate' | 'submittedDate';
  /** Sort order */
  readonly sortOrder?: 'ascending' | 'descending';
}

/**
 * Arxiv paper result
 */
export interface ArxivPaper {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly authors: string[];
  readonly published: string;
  readonly updated: string;
  readonly categories: string[];
  readonly primaryCategory: string;
  readonly pdfUrl: string;
  readonly abstractUrl: string;
  readonly comment?: string;
  readonly journalRef?: string;
  readonly doi?: string;
}

/**
 * Input schema for arxiv search
 */
const arxivSearchInputSchema = z.object({
  query: z.string().describe('Search query for papers'),
  maxResults: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe('Maximum number of results to return'),
  sortBy: z
    .enum(['relevance', 'lastUpdatedDate', 'submittedDate'])
    .optional()
    .describe('Sort criteria'),
  sortOrder: z.enum(['ascending', 'descending']).optional().describe('Sort order'),
  categories: z
    .array(z.string())
    .optional()
    .describe('Filter by arXiv categories (e.g., ["cs.AI", "cs.LG"])'),
});

/**
 * Input schema for getting paper by ID
 */
const arxivGetPaperInputSchema = z.object({
  id: z.string().describe('arXiv paper ID (e.g., "2301.07041" or "cs/0601030")'),
});

/**
 * Input schema for author search
 */
const arxivAuthorSearchInputSchema = z.object({
  author: z.string().describe('Author name to search for'),
  maxResults: z.number().int().min(1).max(100).optional().describe('Maximum number of results'),
});

const ARXIV_API_URL = 'http://export.arxiv.org/api/query';

/**
 * Parse XML response from arXiv API
 */
function parseArxivXml(xml: string): ArxivPaper[] {
  const papers: ArxivPaper[] = [];

  // Extract entries using regex (simple XML parsing without dependencies)
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let entryMatch;

  while ((entryMatch = entryRegex.exec(xml)) !== null) {
    const entry = entryMatch[1] ?? '';

    // Extract fields
    const id = extractTag(entry, 'id')?.replace('http://arxiv.org/abs/', '') ?? '';
    const title = extractTag(entry, 'title')?.replace(/\s+/g, ' ').trim() ?? '';
    const summary = extractTag(entry, 'summary')?.replace(/\s+/g, ' ').trim() ?? '';
    const published = extractTag(entry, 'published') ?? '';
    const updated = extractTag(entry, 'updated') ?? '';
    const comment = extractTag(entry, 'arxiv:comment');
    const journalRef = extractTag(entry, 'arxiv:journal_ref');
    const doi = extractTag(entry, 'arxiv:doi');

    // Extract authors
    const authors: string[] = [];
    const authorRegex = /<author>\s*<name>([^<]+)<\/name>/g;
    let authorMatch;
    while ((authorMatch = authorRegex.exec(entry)) !== null) {
      const authorName = authorMatch[1];
      if (authorName) {
        authors.push(authorName.trim());
      }
    }

    // Extract categories
    const categories: string[] = [];
    const categoryRegex = /<category[^>]*term="([^"]+)"/g;
    let catMatch;
    while ((catMatch = categoryRegex.exec(entry)) !== null) {
      const cat = catMatch[1];
      if (cat) {
        categories.push(cat);
      }
    }

    // Extract primary category
    const primaryCategoryMatch = /<arxiv:primary_category[^>]*term="([^"]+)"/;
    const primaryCategory = entry.match(primaryCategoryMatch)?.[1] ?? categories[0] ?? '';

    // Extract PDF URL
    const pdfLinkMatch = /<link[^>]*title="pdf"[^>]*href="([^"]+)"/;
    const pdfUrl = entry.match(pdfLinkMatch)?.[1] ?? `https://arxiv.org/pdf/${id}.pdf`;

    papers.push({
      id,
      title,
      summary,
      authors,
      published,
      updated,
      categories,
      primaryCategory,
      pdfUrl,
      abstractUrl: `https://arxiv.org/abs/${id}`,
      comment: comment ?? undefined,
      journalRef: journalRef ?? undefined,
      doi: doi ?? undefined,
    });
  }

  return papers;
}

/**
 * Extract content from XML tag
 */
function extractTag(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match?.[1]?.trim() ?? null;
}

/**
 * Build arXiv search query
 */
function buildSearchQuery(query: string, categories?: string[], author?: string): string {
  const parts: string[] = [];

  if (query) {
    // Search in title, abstract, and all fields
    parts.push(`all:${query}`);
  }

  if (author) {
    parts.push(`au:${author}`);
  }

  if (categories && categories.length > 0) {
    const catQuery = categories.map((c) => `cat:${c}`).join('+OR+');
    parts.push(`(${catQuery})`);
  }

  return parts.join('+AND+');
}

/**
 * Create an arXiv paper search tool
 *
 * @example
 * ```typescript
 * import { arxivSearchTool } from '@seashorelab/tool/presets';
 *
 * const search = arxivSearchTool();
 * const results = await search.execute({
 *   query: 'large language models',
 *   maxResults: 10,
 *   categories: ['cs.AI', 'cs.CL']
 * });
 * ```
 */
export function arxivSearchTool(config: ArxivToolConfig = {}) {
  const defaultMaxResults = config.maxResults ?? 10;
  const defaultSortBy = config.sortBy ?? 'relevance';
  const defaultSortOrder = config.sortOrder ?? 'descending';

  return defineTool({
    name: 'arxiv_search',
    description:
      'Search for academic papers on arXiv. Returns titles, abstracts, authors, and PDF links.',
    inputSchema: arxivSearchInputSchema,

    async execute({
      query,
      maxResults = defaultMaxResults,
      sortBy = defaultSortBy,
      sortOrder = defaultSortOrder,
      categories,
    }) {
      const searchQuery = buildSearchQuery(query, categories);

      const params = new URLSearchParams({
        search_query: searchQuery,
        start: '0',
        max_results: String(maxResults),
        sortBy: sortBy,
        sortOrder: sortOrder,
      });

      const response = await fetch(`${ARXIV_API_URL}?${params}`, {
        headers: {
          'User-Agent': 'Seashore/1.0 (https://github.com/seashore)',
        },
      });

      if (!response.ok) {
        throw new Error(`arXiv API error: ${response.status}`);
      }

      const xml = await response.text();
      const papers = parseArxivXml(xml);

      return {
        query,
        totalResults: papers.length,
        papers,
      };
    },
  });
}

/**
 * Create a tool to get a specific arXiv paper by ID
 *
 * @example
 * ```typescript
 * import { arxivGetPaperTool } from '@seashorelab/tool/presets';
 *
 * const getPaper = arxivGetPaperTool();
 * const paper = await getPaper.execute({ id: '2301.07041' });
 * ```
 */
export function arxivGetPaperTool() {
  return defineTool({
    name: 'arxiv_get_paper',
    description: 'Get detailed information about a specific arXiv paper by its ID.',
    inputSchema: arxivGetPaperInputSchema,

    async execute({ id }) {
      // Normalize ID (remove any arxiv prefix)
      const normalizedId = id.replace(/^arxiv:/i, '').trim();

      const params = new URLSearchParams({
        id_list: normalizedId,
      });

      const response = await fetch(`${ARXIV_API_URL}?${params}`, {
        headers: {
          'User-Agent': 'Seashore/1.0 (https://github.com/seashore)',
        },
      });

      if (!response.ok) {
        throw new Error(`arXiv API error: ${response.status}`);
      }

      const xml = await response.text();
      const papers = parseArxivXml(xml);

      if (papers.length === 0) {
        throw new Error(`Paper not found: ${id}`);
      }

      return papers[0];
    },
  });
}

/**
 * Create an arXiv author search tool
 *
 * @example
 * ```typescript
 * import { arxivAuthorSearchTool } from '@seashorelab/tool/presets';
 *
 * const search = arxivAuthorSearchTool();
 * const results = await search.execute({
 *   author: 'Yann LeCun',
 *   maxResults: 10
 * });
 * ```
 */
export function arxivAuthorSearchTool(config: ArxivToolConfig = {}) {
  const defaultMaxResults = config.maxResults ?? 10;

  return defineTool({
    name: 'arxiv_author_search',
    description: 'Search for papers by a specific author on arXiv.',
    inputSchema: arxivAuthorSearchInputSchema,

    async execute({ author, maxResults = defaultMaxResults }) {
      const searchQuery = `au:${author.replace(/\s+/g, '+')}`;

      const params = new URLSearchParams({
        search_query: searchQuery,
        start: '0',
        max_results: String(maxResults),
        sortBy: 'submittedDate',
        sortOrder: 'descending',
      });

      const response = await fetch(`${ARXIV_API_URL}?${params}`, {
        headers: {
          'User-Agent': 'Seashore/1.0 (https://github.com/seashore)',
        },
      });

      if (!response.ok) {
        throw new Error(`arXiv API error: ${response.status}`);
      }

      const xml = await response.text();
      const papers = parseArxivXml(xml);

      return {
        author,
        totalResults: papers.length,
        papers,
      };
    },
  });
}

/**
 * Create a tool to get recent papers from specific arXiv categories
 *
 * @example
 * ```typescript
 * import { arxivRecentPapersTool } from '@seashorelab/tool/presets';
 *
 * const recent = arxivRecentPapersTool();
 * const results = await recent.execute({
 *   categories: ['cs.AI', 'cs.LG'],
 *   maxResults: 20
 * });
 * ```
 */
export function arxivRecentPapersTool(config: ArxivToolConfig = {}) {
  const defaultMaxResults = config.maxResults ?? 10;

  const inputSchema = z.object({
    categories: z
      .array(z.string())
      .min(1)
      .describe('arXiv categories to fetch (e.g., ["cs.AI", "cs.LG", "stat.ML"])'),
    maxResults: z.number().int().min(1).max(100).optional().describe('Maximum number of results'),
  });

  return defineTool({
    name: 'arxiv_recent_papers',
    description: 'Get recent papers from specific arXiv categories.',
    inputSchema,

    async execute({ categories, maxResults = defaultMaxResults }) {
      const catQuery = categories.map((c) => `cat:${c}`).join('+OR+');

      const params = new URLSearchParams({
        search_query: catQuery,
        start: '0',
        max_results: String(maxResults),
        sortBy: 'submittedDate',
        sortOrder: 'descending',
      });

      const response = await fetch(`${ARXIV_API_URL}?${params}`, {
        headers: {
          'User-Agent': 'Seashore/1.0 (https://github.com/seashore)',
        },
      });

      if (!response.ok) {
        throw new Error(`arXiv API error: ${response.status}`);
      }

      const xml = await response.text();
      const papers = parseArxivXml(xml);

      return {
        categories,
        totalResults: papers.length,
        papers,
      };
    },
  });
}
