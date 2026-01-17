/**
 * @seashore/tool - YFinance Tool
 *
 * Preset tools for fetching financial data (stocks, crypto, etc.)
 */

import { z } from 'zod';
import { defineTool } from '../define-tool';

/**
 * Stock quote result
 */
export interface StockQuote {
  readonly symbol: string;
  readonly shortName: string;
  readonly longName: string | null;
  readonly currency: string;
  readonly exchange: string;
  readonly regularMarketPrice: number;
  readonly regularMarketChange: number;
  readonly regularMarketChangePercent: number;
  readonly regularMarketPreviousClose: number;
  readonly regularMarketOpen: number;
  readonly regularMarketDayHigh: number;
  readonly regularMarketDayLow: number;
  readonly regularMarketVolume: number;
  readonly marketCap: number | null;
  readonly fiftyTwoWeekHigh: number;
  readonly fiftyTwoWeekLow: number;
  readonly marketState: string;
}

/**
 * Historical price data point
 */
export interface HistoricalDataPoint {
  readonly date: string;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
  readonly adjClose: number;
}

/**
 * Input schema for stock quote
 */
const stockQuoteInputSchema = z.object({
  symbols: z
    .array(z.string())
    .min(1)
    .max(10)
    .describe('Stock symbols to fetch (e.g., ["AAPL", "GOOGL", "MSFT"])'),
});

/**
 * Input schema for historical data
 */
const historicalDataInputSchema = z.object({
  symbol: z.string().describe('Stock symbol (e.g., "AAPL")'),
  period: z
    .enum(['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max'])
    .optional()
    .describe('Time period for historical data'),
  interval: z
    .enum(['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo'])
    .optional()
    .describe('Data interval'),
});

/**
 * Input schema for stock search
 */
const stockSearchInputSchema = z.object({
  query: z.string().describe('Search query (company name or symbol)'),
  newsCount: z.number().int().min(0).max(10).optional().describe('Number of news items to include'),
});

// Yahoo Finance API endpoints (using publicly accessible endpoints)
const YAHOO_QUOTE_API = 'https://query1.finance.yahoo.com/v7/finance/quote';
const YAHOO_CHART_API = 'https://query1.finance.yahoo.com/v8/finance/chart';
const YAHOO_SEARCH_API = 'https://query1.finance.yahoo.com/v1/finance/search';

/**
 * Create a stock quote tool
 *
 * @example
 * ```typescript
 * import { stockQuoteTool } from '@seashore/tool/presets';
 *
 * const quote = stockQuoteTool();
 * const result = await quote.execute({ symbols: ['AAPL', 'GOOGL'] });
 * ```
 */
export function stockQuoteTool() {
  return defineTool({
    name: 'stock_quote',
    description:
      'Get real-time stock quotes including price, change, volume, and market cap for one or more symbols.',
    inputSchema: stockQuoteInputSchema,

    async execute({ symbols }) {
      const symbolsStr = symbols.map((s) => s.toUpperCase()).join(',');

      const response = await fetch(`${YAHOO_QUOTE_API}?symbols=${symbolsStr}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SeashoreBot/1.0)',
        },
      });

      if (!response.ok) {
        throw new Error(`Yahoo Finance API error: ${response.status}`);
      }

      interface YahooQuoteResult {
        symbol: string;
        shortName: string;
        longName: string | null;
        currency: string;
        exchange: string;
        regularMarketPrice: number;
        regularMarketChange: number;
        regularMarketChangePercent: number;
        regularMarketPreviousClose: number;
        regularMarketOpen: number;
        regularMarketDayHigh: number;
        regularMarketDayLow: number;
        regularMarketVolume: number;
        marketCap: number | null;
        fiftyTwoWeekHigh: number;
        fiftyTwoWeekLow: number;
        marketState: string;
      }

      const data = (await response.json()) as {
        quoteResponse: {
          result: YahooQuoteResult[];
          error: string | null;
        };
      };

      if (data.quoteResponse.error) {
        throw new Error(`Yahoo Finance API error: ${data.quoteResponse.error}`);
      }

      const quotes: StockQuote[] = data.quoteResponse.result.map((quote: YahooQuoteResult) => ({
        symbol: quote.symbol,
        shortName: quote.shortName,
        longName: quote.longName,
        currency: quote.currency,
        exchange: quote.exchange,
        regularMarketPrice: quote.regularMarketPrice,
        regularMarketChange: quote.regularMarketChange,
        regularMarketChangePercent: quote.regularMarketChangePercent,
        regularMarketPreviousClose: quote.regularMarketPreviousClose,
        regularMarketOpen: quote.regularMarketOpen,
        regularMarketDayHigh: quote.regularMarketDayHigh,
        regularMarketDayLow: quote.regularMarketDayLow,
        regularMarketVolume: quote.regularMarketVolume,
        marketCap: quote.marketCap ?? null,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
        marketState: quote.marketState,
      }));

      return {
        symbols,
        quotes,
        fetchedAt: new Date().toISOString(),
      };
    },
  });
}

/**
 * Create a historical stock data tool
 *
 * @example
 * ```typescript
 * import { stockHistoricalTool } from '@seashore/tool/presets';
 *
 * const historical = stockHistoricalTool();
 * const result = await historical.execute({
 *   symbol: 'AAPL',
 *   period: '1mo',
 *   interval: '1d'
 * });
 * ```
 */
export function stockHistoricalTool() {
  return defineTool({
    name: 'stock_historical',
    description:
      'Get historical stock price data including open, high, low, close, and volume for a given period.',
    inputSchema: historicalDataInputSchema,

    async execute({ symbol, period = '1mo', interval = '1d' }) {
      const upperSymbol = symbol.toUpperCase();

      const params = new URLSearchParams({
        interval,
        range: period,
      });

      const response = await fetch(`${YAHOO_CHART_API}/${upperSymbol}?${params}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SeashoreBot/1.0)',
        },
      });

      if (!response.ok) {
        throw new Error(`Yahoo Finance API error: ${response.status}`);
      }

      interface YahooChartResult {
        meta: {
          currency: string;
          symbol: string;
          exchangeName: string;
        };
        timestamp: number[];
        indicators: {
          quote: {
            open: number[];
            high: number[];
            low: number[];
            close: number[];
            volume: number[];
          }[];
          adjclose?: {
            adjclose: number[];
          }[];
        };
      }

      const data = (await response.json()) as {
        chart: {
          result: YahooChartResult[] | null;
          error: { code: string; description: string } | null;
        };
      };

      if (data.chart.error) {
        throw new Error(`Yahoo Finance API error: ${data.chart.error.description}`);
      }

      if (!data.chart.result || data.chart.result.length === 0) {
        throw new Error(`No data found for symbol: ${symbol}`);
      }

      const result = data.chart.result[0];
      if (!result) {
        throw new Error(`No data found for symbol: ${symbol}`);
      }

      const quote = result.indicators.quote[0];
      if (!quote) {
        throw new Error(`No quote data found for symbol: ${symbol}`);
      }

      const adjclose = result.indicators.adjclose?.[0]?.adjclose;

      const historicalData: HistoricalDataPoint[] = result.timestamp.map(
        (timestamp: number, index: number) => ({
          date: new Date(timestamp * 1000).toISOString().split('T')[0] ?? '',
          open: quote.open[index] ?? 0,
          high: quote.high[index] ?? 0,
          low: quote.low[index] ?? 0,
          close: quote.close[index] ?? 0,
          volume: quote.volume[index] ?? 0,
          adjClose: adjclose?.[index] ?? quote.close[index] ?? 0,
        })
      );

      return {
        symbol: upperSymbol,
        period,
        interval,
        currency: result.meta.currency,
        exchange: result.meta.exchangeName,
        data: historicalData,
      };
    },
  });
}

/**
 * Create a stock search tool
 *
 * @example
 * ```typescript
 * import { stockSearchTool } from '@seashore/tool/presets';
 *
 * const search = stockSearchTool();
 * const result = await search.execute({ query: 'Apple' });
 * ```
 */
export function stockSearchTool() {
  return defineTool({
    name: 'stock_search',
    description: 'Search for stocks, ETFs, and other securities by name or symbol.',
    inputSchema: stockSearchInputSchema,

    async execute({ query, newsCount = 0 }) {
      const params = new URLSearchParams({
        q: query,
        newsCount: String(newsCount),
        quotesCount: '10',
      });

      const response = await fetch(`${YAHOO_SEARCH_API}?${params}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SeashoreBot/1.0)',
        },
      });

      if (!response.ok) {
        throw new Error(`Yahoo Finance API error: ${response.status}`);
      }

      interface YahooSearchQuote {
        symbol: string;
        shortname: string;
        longname: string | null;
        quoteType: string;
        exchange: string;
        industry?: string;
        sector?: string;
      }

      interface YahooSearchNews {
        uuid: string;
        title: string;
        publisher: string;
        link: string;
        providerPublishTime: number;
      }

      const data = (await response.json()) as {
        quotes: YahooSearchQuote[];
        news?: YahooSearchNews[];
      };

      return {
        query,
        results: data.quotes.map((quote: YahooSearchQuote) => ({
          symbol: quote.symbol,
          shortName: quote.shortname,
          longName: quote.longname,
          type: quote.quoteType,
          exchange: quote.exchange,
          industry: quote.industry,
          sector: quote.sector,
        })),
        news: data.news?.map((item: YahooSearchNews) => ({
          title: item.title,
          publisher: item.publisher,
          link: item.link,
          publishedAt: new Date(item.providerPublishTime * 1000).toISOString(),
        })),
      };
    },
  });
}

/**
 * Create a cryptocurrency quote tool
 *
 * @example
 * ```typescript
 * import { cryptoQuoteTool } from '@seashore/tool/presets';
 *
 * const crypto = cryptoQuoteTool();
 * const result = await crypto.execute({ symbols: ['BTC-USD', 'ETH-USD'] });
 * ```
 */
export function cryptoQuoteTool() {
  return defineTool({
    name: 'crypto_quote',
    description: 'Get real-time cryptocurrency quotes. Use format like "BTC-USD", "ETH-USD", etc.',
    inputSchema: stockQuoteInputSchema,

    async execute({ symbols }) {
      // Crypto symbols on Yahoo Finance use format like BTC-USD
      const symbolsStr = symbols.map((s) => s.toUpperCase()).join(',');

      const response = await fetch(`${YAHOO_QUOTE_API}?symbols=${symbolsStr}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SeashoreBot/1.0)',
        },
      });

      if (!response.ok) {
        throw new Error(`Yahoo Finance API error: ${response.status}`);
      }

      interface YahooCryptoResult {
        symbol: string;
        shortName: string;
        regularMarketPrice: number;
        regularMarketChange: number;
        regularMarketChangePercent: number;
        regularMarketVolume: number;
        marketCap: number | null;
        circulatingSupply: number | null;
        regularMarketDayHigh: number;
        regularMarketDayLow: number;
        fiftyTwoWeekHigh: number;
        fiftyTwoWeekLow: number;
      }

      const data = (await response.json()) as {
        quoteResponse: {
          result: YahooCryptoResult[];
          error: string | null;
        };
      };

      if (data.quoteResponse.error) {
        throw new Error(`Yahoo Finance API error: ${data.quoteResponse.error}`);
      }

      return {
        symbols,
        quotes: data.quoteResponse.result.map((quote: YahooCryptoResult) => ({
          symbol: quote.symbol,
          name: quote.shortName,
          price: quote.regularMarketPrice,
          change: quote.regularMarketChange,
          changePercent: quote.regularMarketChangePercent,
          volume: quote.regularMarketVolume,
          marketCap: quote.marketCap,
          circulatingSupply: quote.circulatingSupply,
          dayHigh: quote.regularMarketDayHigh,
          dayLow: quote.regularMarketDayLow,
          weekHigh52: quote.fiftyTwoWeekHigh,
          weekLow52: quote.fiftyTwoWeekLow,
        })),
        fetchedAt: new Date().toISOString(),
      };
    },
  });
}
