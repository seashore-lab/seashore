/**
 * Weather Tool - Returns GenUI data for weather display
 */

import { defineTool } from '@seashore/tool';
import { z } from 'zod';

export const weatherTool = defineTool({
  name: 'get_weather',
  description: 'Get current weather for a location',
  inputSchema: z.object({
    location: z.string().describe('City name (e.g., "Tokyo", "Paris")'),
    unit: z.enum(['celsius', 'fahrenheit']).optional().default('celsius'),
  }),
  execute: async ({ location, unit }) => {
    // Simulate weather data (in production, call a real weather API)
    const mockWeather: Record<
      string,
      { temp: number; condition: string; humidity: number; windSpeed: number; icon: string }
    > = {
      Tokyo: { temp: 22, condition: 'Partly Cloudy', humidity: 65, windSpeed: 12, icon: '⛅' },
      Paris: { temp: 18, condition: 'Rainy', humidity: 80, windSpeed: 15, icon: '🌧️' },
      'New York': { temp: 15, condition: 'Clear', humidity: 55, windSpeed: 8, icon: '☀️' },
      London: { temp: 12, condition: 'Cloudy', humidity: 75, windSpeed: 18, icon: '☁️' },
      Sydney: { temp: 25, condition: 'Sunny', humidity: 60, windSpeed: 10, icon: '☀️' },
    };

    const weather = mockWeather[location] || {
      temp: 20,
      condition: 'Unknown',
      humidity: 50,
      windSpeed: 10,
      icon: '🌍',
    };

    // Return GenUI data with special marker for custom UI rendering
    return {
      __genui: true,
      data: {
        location,
        temperature: unit === 'celsius' ? weather.temp : Math.round(weather.temp * 1.8 + 32),
        condition: weather.condition,
        humidity: weather.humidity,
        windSpeed: weather.windSpeed,
        icon: weather.icon,
        unit,
      },
    };
  },
});
