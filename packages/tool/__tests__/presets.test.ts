/**
 * @seashorelab/tool - Preset Tools Tests
 *
 * Tests for preset tools (serper, firecrawl)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { serperTool } from '../src/presets/serper';
import { firecrawlTool } from '../src/presets/firecrawl';

describe('Preset Tools', () => {
  // Mock fetch properly with hoisting
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    // Set up the mock before each test
    vi.stubGlobal('fetch', mockFetch);
  });

  describe('serperTool', () => {
    const tool = serperTool({ apiKey: 'test-api-key' });

    it('should have correct metadata', () => {
      expect(tool.name).toBe('serper_search');
      expect(tool.description).toContain('search');
      expect(tool.jsonSchema).toBeDefined();
    });

    it('should validate input correctly', () => {
      expect(tool.validate({ query: 'test query' })).toBe(true);
      expect(tool.validate({ query: 'test', num: 5 })).toBe(true);
      expect(tool.validate({ query: 'test', type: 'news' })).toBe(true);

      expect(tool.validate({})).toBe(false);
      // Note: Zod string() accepts empty strings by default
      expect(tool.validate({ query: 123 })).toBe(false);
    });

    it('should execute search successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          organic: [
            {
              title: 'Test Result',
              link: 'https://example.com',
              snippet: 'This is a test result',
            },
          ],
          searchParameters: {
            q: 'test query',
          },
        }),
      });

      const result = await tool.execute({ query: 'test query' });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      // Serper tool returns organic array, not results
      expect(result.data?.organic).toHaveLength(1);
      expect(result.data?.organic?.[0]?.title).toBe('Test Result');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://google.serper.dev/search',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-API-KEY': 'test-api-key',
          }),
        })
      );
    });

    it('should handle search types', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          news: [
            {
              title: 'News Article',
              link: 'https://news.com/article',
              snippet: 'Breaking news',
              date: '2024-01-01',
            },
          ],
        }),
      });

      const result = await tool.execute({ query: 'latest news', type: 'news' });

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('https://google.serper.dev/news', expect.any(Object));
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Unauthorized',
      });

      const result = await tool.execute({ query: 'test' });

      expect(result.success).toBe(false);
      // Error message contains the API response text
      expect(result.error).toContain('Unauthorized');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await tool.execute({ query: 'test' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('firecrawlTool', () => {
    const tool = firecrawlTool({ apiKey: 'test-api-key' });

    it('should have correct metadata', () => {
      expect(tool.name).toBe('firecrawl_scrape');
      expect(tool.description.toLowerCase()).toContain('scrape');
      expect(tool.jsonSchema).toBeDefined();
    });

    it('should validate input correctly', () => {
      expect(tool.validate({ url: 'https://example.com' })).toBe(true);
      expect(tool.validate({ url: 'https://example.com', formats: ['markdown'] })).toBe(true);

      expect(tool.validate({})).toBe(false);
    });

    it('should execute scrape successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            markdown: '# Test Page\n\nThis is test content.',
            metadata: {
              title: 'Test Page',
              description: 'A test page',
              url: 'https://example.com',
            },
          },
        }),
      });

      const result = await tool.execute({ url: 'https://example.com' });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      // Firecrawl tool returns content property, not markdown
      expect(result.data?.content).toContain('Test Page');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.firecrawl.dev/v1/scrape',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
          }),
        })
      );
    });

    it('should handle format options in config', async () => {
      // Formats are set in tool config, not execute params
      const customTool = firecrawlTool({
        apiKey: 'test-api-key',
        formats: ['markdown', 'html'],
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            html: '<h1>Test</h1>',
            markdown: '# Test',
            metadata: { title: 'Test' },
          },
        }),
      });

      const result = await customTool.execute({ url: 'https://example.com' });

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"formats":["markdown","html"]'),
        })
      );
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: async () => 'Rate limit exceeded',
      });

      const result = await tool.execute({ url: 'https://example.com' });

      expect(result.success).toBe(false);
      // Error message contains the API response text
      expect(result.error).toContain('Rate limit exceeded');
    });

    it('should handle scrape failures', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Page not found',
        }),
      });

      const result = await tool.execute({ url: 'https://example.com/404' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Page not found');
    });

    it('should handle includeLinks option', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            markdown: 'content with [link](https://example.com)',
            html: '<a href="https://example.com">link</a>',
            metadata: { title: 'Test' },
          },
        }),
      });

      const result = await tool.execute({
        url: 'https://example.com',
        includeLinks: true,
      });

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"includeTags":["a"]'),
        })
      );
    });
  });

  describe('Tool Schema Integration', () => {
    it('should have valid JSON schemas for LLM function calling', () => {
      const serper = serperTool({ apiKey: 'key' });
      const firecrawl = firecrawlTool({ apiKey: 'key' });

      // Serper schema
      expect(serper.jsonSchema.type).toBe('object');
      expect(serper.jsonSchema.properties).toHaveProperty('query');
      expect(serper.jsonSchema.required).toContain('query');

      // Firecrawl schema
      expect(firecrawl.jsonSchema.type).toBe('object');
      expect(firecrawl.jsonSchema.properties).toHaveProperty('url');
      expect(firecrawl.jsonSchema.required).toContain('url');
    });

    it('should parse valid inputs without throwing', () => {
      const serper = serperTool({ apiKey: 'key' });
      const firecrawl = firecrawlTool({ apiKey: 'key' });

      expect(() => serper.parse({ query: 'test' })).not.toThrow();
      expect(() => firecrawl.parse({ url: 'https://example.com' })).not.toThrow();
    });

    it('should throw on invalid inputs', () => {
      const serper = serperTool({ apiKey: 'key' });

      expect(() => serper.parse({})).toThrow();
    });
  });
});
