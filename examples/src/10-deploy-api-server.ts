/**
 * Example 10 - Deploy API Server
 *
 * This example demonstrates how to deploy an API server using the Seashore Deploy module.
 * The server hosts an agent that responds to user messages via HTTP endpoints.
 */

import 'dotenv/config';
import { createServer, type Agent as DeployAgent, type Message } from '@seashorelab/deploy';
import { createAgent } from '@seashorelab/agent';
import { openaiText } from '@seashorelab/llm';
import { serve } from '@hono/node-server';

const agent = createAgent({
  name: 'api-assistant',
  model: openaiText('gpt-5.1', {
    baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY,
  }),
  systemPrompt: 'You are a helpful assistant named Xiaoming.',
});

// Create a deployable agent wrapper
const deployAgent: DeployAgent = {
  name: agent.name,
  async run(input: { messages: Message[] }) {
    const lastUserMessage = input.messages.filter((m: Message) => m.role === 'user').at(-1);
    const userInput = lastUserMessage?.content ?? '';
    const result = await agent.run(userInput);

    return {
      content: result.content,
    };
  },
};

async function main() {
  console.log('🚀 Example 10: Deploy API Server\n');

  // 创建 API 服务器
  const server = createServer({
    agents: { assistant: deployAgent },
    // Enable CORS for testing
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS'],
    },
    // Supports rate limit out of the box
    rateLimit: {
      window: '1m',
      requests: 10,
    },
  });

  const port = 3000;

  console.log('📋 Endpoints:');
  console.log(`   GET  http://localhost:${port}/health`);
  console.log(`   POST http://localhost:${port}/api/chat`);
  console.log(`   POST http://localhost:${port}/api/agents/assistant/run`);
  console.log(`   POST http://localhost:${port}/api/agents/assistant/stream\n`);

  // Here are two example curl commands to test the API:
  // # Non-streaming request
  // curl -X POST http://localhost:${port}/api/agents/assistant/run \\
  //   -H "Content-Type: application/json" \\
  //   -d '{"input": "How is the weather in New York today?"}'
  // # Chat API
  // curl -X POST http://localhost:${port}/api/chat \\
  //   -H "Content-Type: application/json" \\
  //   -d '{
  //     "model": "assistant",
  //     "messages": [{"role": "user", "content": "Hello!"}]
  //   }'

  // Start the hono server by providing the fetch handler
  serve({
    fetch: server.app.fetch,
    port,
  });
  console.log(`✅ The server is running at http://localhost:${port} !\n`);

  // Demonstrate local call
  console.log('--- Local Call Test ---\n');

  const response = await fetch(
    new Request(`http://localhost:${port}/api/agents/assistant/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: 'How is the weather in New York today?' }),
    })
  );
  const result = await response.json();

  console.log('📝 Request: How is the weather in New York today?');
  console.log(`🤖 Response: ${JSON.stringify(result, null, 2)}`);
}

main().catch(console.error);

// 🚀 Example 10: Deploy API Server

// 📋 Endpoints:
//    GET  http://localhost:3000/health
//    POST http://localhost:3000/api/agents/assistant/run
//    POST http://localhost:3000/api/agents/assistant/stream

// ✅ The server is running at http://localhost:3000 !

// --- Local Call Test ---

// 📝 Request: How is the weather in New York today?
// 🤖 Response: {
//   "content": "I don’t have live access to current weather data.\n\nTo get today’s weather in New York City, check one of these in real time:\n- A weather site/app: weather.com, AccuWeather, Weather Underground\n- A voice assistant or Maps app on your phone\n- Search “New York City weather today” in your browser\n\nIf you tell me which borough or ZIP code you’re in and what you’re planning (e.g., walking, driving, outdoor sports), I can suggest what to wear and how to prepare for typical conditions for this time of year.",
//   "threadId": "thread_1768065367122_m6jv77mdz"
// }
