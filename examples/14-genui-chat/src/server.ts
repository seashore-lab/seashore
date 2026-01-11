/**
 * Backend API server for GenUI Chat Demo
 */

import { createAgent } from '@seashore/agent';
import { openaiText } from '@seashore/llm';
import { weatherTool } from './tools/weather';
import { stockTool } from './tools/stock';
import { createServer } from 'node:http';

// Create agent with tools
const agent = createAgent({
  name: 'genui-assistant',
  model: openaiText('gpt-4o', {
    baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY || '',
  }),
  systemPrompt:
    'You are a helpful assistant that can provide weather and stock information. ' +
    'When users ask about weather or stocks, use the appropriate tools. ' +
    'Be concise and friendly in your responses.',
  tools: [weatherTool, stockTool],
});

const PORT = 3001;

const server = createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/api/chat' && req.method === 'POST') {
    try {
      // Parse request body
      let body = '';
      for await (const chunk of req) {
        body += chunk;
      }

      const { message } = JSON.parse(body);

      if (!message || typeof message !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid message' }));
        return;
      }

      // Set headers for streaming
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      });

      // Stream agent responses
      for await (const chunk of agent.stream(message)) {
        const data = JSON.stringify(chunk) + '\n';
        res.write(data);
      }

      res.end();
    } catch (error) {
      console.error('Chat API error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
