/**
 * Stock Tool - Returns GenUI data for stock display
 */

import { defineTool } from '@seashore/tool';
import { z } from 'zod';

export const stockTool = defineTool({
  name: 'get_stock',
  description: 'Get stock price information',
  inputSchema: z.object({
    symbol: z.string().describe('Stock symbol (e.g., "AAPL", "TSLA", "GOOGL")'),
  }),
  execute: async ({ symbol }) => {
    // Simulate stock data (in production, call a real stock API)
    const mockStocks: Record<
      string,
      {
        price: number;
        change: number;
        changePercent: number;
        high: number;
        low: number;
        volume: number;
      }
    > = {
      AAPL: {
        price: 178.25,
        change: 2.5,
        changePercent: 1.42,
        high: 180.0,
        low: 176.5,
        volume: 58000000,
      },
      TSLA: {
        price: 242.84,
        change: -3.2,
        changePercent: -1.3,
        high: 248.0,
        low: 240.5,
        volume: 112000000,
      },
      GOOGL: {
        price: 141.8,
        change: 1.2,
        changePercent: 0.85,
        high: 142.5,
        low: 140.2,
        volume: 28000000,
      },
      MSFT: {
        price: 378.91,
        change: 4.5,
        changePercent: 1.2,
        high: 381.0,
        low: 376.0,
        volume: 25000000,
      },
    };

    const upperSymbol = symbol.toUpperCase();
    const stock = mockStocks[upperSymbol] || {
      price: 100.0,
      change: 0,
      changePercent: 0,
      high: 102.0,
      low: 98.0,
      volume: 10000000,
    };

    // Return GenUI data with special marker for custom UI rendering
    return {
      __genui: true,
      data: {
        symbol: upperSymbol,
        price: stock.price,
        change: stock.change,
        changePercent: stock.changePercent,
        high: stock.high,
        low: stock.low,
        volume: stock.volume,
      },
    };
  },
});
