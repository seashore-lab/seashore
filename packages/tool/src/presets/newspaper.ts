/**
 * @seashorelab/tool - Newspaper Tool
 *
 * Preset tools for extracting and parsing web articles
 */

import { z } from 'zod';
import { defineTool } from '../define-tool';

/**
 * Extracted article result
 */
export interface ExtractedArticle {
  readonly url: string;
  readonly title: string;
  readonly authors: string[];
  readonly publishDate: string | null;
  readonly text: string;
  readonly summary: string | null;
  readonly topImage: string | null;
  readonly images: string[];
  readonly keywords: string[];
  readonly metadata: {
    readonly siteName: string | null;
    readonly description: string | null;
    readonly language: string | null;
  };
}

/**
 * Input schema for article extraction
 */
const extractArticleInputSchema = z.object({
  url: z.string().url().describe('URL of the article to extract'),
  includeImages: z.boolean().optional().describe('Whether to extract images (default: true)'),
  includeFullText: z
    .boolean()
    .optional()
    .describe('Whether to include full article text (default: true)'),
});

/**
 * Input schema for batch extraction
 */
const batchExtractInputSchema = z.object({
  urls: z.array(z.string().url()).min(1).max(10).describe('URLs of articles to extract (max 10)'),
  includeImages: z.boolean().optional().describe('Whether to extract images'),
  includeFullText: z.boolean().optional().describe('Whether to include full article text'),
});

/**
 * Extract text content from HTML
 */
function extractTextFromHtml(html: string): string {
  // Remove scripts and styles
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, '');

  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&apos;/g, "'");

  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Extract article content from HTML using heuristics
 */
function extractArticle(html: string, url: string): ExtractedArticle {
  // Extract title
  const titleMatch =
    html.match(/<title[^>]*>([^<]+)<\/title>/i) ||
    html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i) ||
    html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const title = titleMatch?.[1]?.trim() ?? '';

  // Extract description/summary
  const descMatch =
    html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i) ||
    html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i);
  const summary = descMatch?.[1]?.trim() ?? null;

  // Extract publish date
  const dateMatch =
    html.match(/<meta[^>]*property="article:published_time"[^>]*content="([^"]+)"/i) ||
    html.match(/<time[^>]*datetime="([^"]+)"/i) ||
    html.match(/<meta[^>]*name="date"[^>]*content="([^"]+)"/i);
  const publishDate = dateMatch?.[1]?.trim() ?? null;

  // Extract authors
  const authors: string[] = [];
  const authorMatches = html.matchAll(/<meta[^>]*name="author"[^>]*content="([^"]+)"/gi);
  for (const match of authorMatches) {
    const authorName = match[1];
    if (authorName) {
      authors.push(authorName.trim());
    }
  }

  // Try to find author in JSON-LD
  const jsonLdMatch = html.match(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i
  );
  if (jsonLdMatch && authors.length === 0) {
    try {
      const jsonContent = jsonLdMatch[1] ?? '{}';
      const jsonLd = JSON.parse(jsonContent) as {
        author?: string | { name?: string } | Array<string | { name?: string }>;
      };
      if (jsonLd.author) {
        if (typeof jsonLd.author === 'string') {
          authors.push(jsonLd.author);
        } else if (
          typeof jsonLd.author === 'object' &&
          'name' in jsonLd.author &&
          jsonLd.author.name
        ) {
          authors.push(jsonLd.author.name);
        } else if (Array.isArray(jsonLd.author)) {
          for (const a of jsonLd.author) {
            if (typeof a === 'string') authors.push(a);
            else if (a && typeof a === 'object' && 'name' in a && a.name) authors.push(a.name);
          }
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  // Extract site name
  const siteNameMatch = html.match(/<meta[^>]*property="og:site_name"[^>]*content="([^"]+)"/i);
  const siteName = siteNameMatch?.[1]?.trim() ?? null;

  // Extract language
  const langMatch =
    html.match(/<html[^>]*lang="([^"]+)"/i) ||
    html.match(/<meta[^>]*http-equiv="content-language"[^>]*content="([^"]+)"/i);
  const language = langMatch?.[1]?.trim().split('-')[0] ?? null;

  // Extract top image
  const topImageMatch =
    html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) ||
    html.match(/<meta[^>]*name="twitter:image"[^>]*content="([^"]+)"/i);
  const topImage = topImageMatch?.[1]?.trim() ?? null;

  // Extract all images
  const images: string[] = [];
  const imgMatches = html.matchAll(/<img[^>]*src="([^"]+)"/gi);
  for (const match of imgMatches) {
    const imgSrc = match[1]?.trim();
    if (imgSrc && !imgSrc.startsWith('data:') && !images.includes(imgSrc)) {
      images.push(imgSrc);
    }
  }

  // Extract keywords
  const keywords: string[] = [];
  const keywordsMatch = html.match(/<meta[^>]*name="keywords"[^>]*content="([^"]+)"/i);
  if (keywordsMatch?.[1]) {
    keywords.push(...keywordsMatch[1].split(',').map((k) => k.trim()));
  }

  // Extract article text - try to find main content area
  let text = '';

  // Try to find article body using common selectors
  const articlePatterns = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*post[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i,
  ];

  for (const pattern of articlePatterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      text = extractTextFromHtml(match[1]);
      if (text.length > 200) {
        break;
      }
    }
  }

  // Fallback to body content
  if (text.length < 200) {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch?.[1]) {
      text = extractTextFromHtml(bodyMatch[1]);
    }
  }

  return {
    url,
    title,
    authors,
    publishDate,
    text,
    summary,
    topImage,
    images: images.slice(0, 10), // Limit to first 10 images
    keywords,
    metadata: {
      siteName,
      description: summary,
      language,
    },
  };
}

/**
 * Create an article extraction tool
 *
 * @example
 * ```typescript
 * import { extractArticleTool } from '@seashorelab/tool/presets';
 *
 * const extract = extractArticleTool();
 * const article = await extract.execute({
 *   url: 'https://example.com/article'
 * });
 * console.log(article.title, article.text);
 * ```
 */
export function extractArticleTool() {
  return defineTool({
    name: 'extract_article',
    description:
      'Extract article content from a web page including title, text, authors, images, and metadata.',
    inputSchema: extractArticleInputSchema,

    async execute({ url, includeImages = true, includeFullText = true }) {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch article: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();
      const article = extractArticle(html, url);

      return {
        ...article,
        images: includeImages ? article.images : [],
        text: includeFullText ? article.text : article.text.slice(0, 500) + '...',
      };
    },
  });
}

/**
 * Create a batch article extraction tool
 *
 * @example
 * ```typescript
 * import { batchExtractArticlesTool } from '@seashorelab/tool/presets';
 *
 * const batchExtract = batchExtractArticlesTool();
 * const articles = await batchExtract.execute({
 *   urls: ['https://example.com/article1', 'https://example.com/article2']
 * });
 * ```
 */
export function batchExtractArticlesTool() {
  return defineTool({
    name: 'batch_extract_articles',
    description: 'Extract article content from multiple web pages at once (max 10 URLs).',
    inputSchema: batchExtractInputSchema,

    async execute({ urls, includeImages = true, includeFullText = true }) {
      const results = await Promise.allSettled(
        urls.map(async (url) => {
          const response = await fetch(url, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
          }

          const html = await response.text();
          const article = extractArticle(html, url);

          return {
            ...article,
            images: includeImages ? article.images : [],
            text: includeFullText ? article.text : article.text.slice(0, 500) + '...',
          };
        })
      );

      const articles: ExtractedArticle[] = [];
      const errors: { url: string; error: string }[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          articles.push(result.value);
        } else {
          errors.push({
            url: urls[index] ?? 'unknown',
            error: result.reason?.message ?? 'Unknown error',
          });
        }
      });

      return {
        totalRequested: urls.length,
        successCount: articles.length,
        errorCount: errors.length,
        articles,
        errors,
      };
    },
  });
}

/**
 * Create a tool to extract just headlines from a news site
 *
 * @example
 * ```typescript
 * import { extractHeadlinesTool } from '@seashorelab/tool/presets';
 *
 * const headlines = extractHeadlinesTool();
 * const result = await headlines.execute({
 *   url: 'https://news.ycombinator.com'
 * });
 * ```
 */
export function extractHeadlinesTool() {
  const inputSchema = z.object({
    url: z.string().url().describe('URL of the news site to extract headlines from'),
    maxHeadlines: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe('Maximum number of headlines to extract (default: 20)'),
  });

  return defineTool({
    name: 'extract_headlines',
    description: 'Extract headlines and links from a news website or article listing page.',
    inputSchema,

    async execute({ url, maxHeadlines = 20 }) {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();

      // Extract all links with their text
      const headlines: { title: string; link: string }[] = [];
      const linkRegex = /<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
      let match;

      while ((match = linkRegex.exec(html)) !== null && headlines.length < maxHeadlines) {
        const href = match[1]?.trim();
        const text = match[2]?.trim();

        if (!href || !text) continue;

        // Filter out navigation links, short text, etc.
        if (
          text.length > 15 &&
          text.length < 200 &&
          !href.includes('#') &&
          !text.toLowerCase().includes('click here') &&
          !text.toLowerCase().includes('read more') &&
          !text.toLowerCase().includes('sign up') &&
          !text.toLowerCase().includes('log in')
        ) {
          // Resolve relative URLs
          let absoluteUrl = href;
          if (href.startsWith('/')) {
            const urlObj = new URL(url);
            absoluteUrl = `${urlObj.origin}${href}`;
          } else if (!href.startsWith('http')) {
            absoluteUrl = new URL(href, url).toString();
          }

          headlines.push({
            title: text,
            link: absoluteUrl,
          });
        }
      }

      return {
        url,
        headlineCount: headlines.length,
        headlines,
      };
    },
  });
}
