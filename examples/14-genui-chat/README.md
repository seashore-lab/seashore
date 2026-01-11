# GenUI Chat Example

This is a complete Vite + React 18 application demonstrating Seashore's GenUI package for building interactive chat interfaces with custom UI components.

## 🔒 Isolated Workspace

This example uses its own pnpm workspace to avoid affecting the root project dependencies. It links to the Seashore packages using local file links.

## Tech Stack

- **Frontend**: Vite + React 18
- **Backend**: Node.js HTTP server
- **Framework**: Seashore Agent Framework
- **UI**: Custom GenUI components with Recharts

## Features

- 🤖 AI-powered chat with streaming responses
- 🎨 Custom UI components for tool results
- 📊 Interactive visualizations (weather cards, stock charts)
- ⚡ Real-time streaming with Server-Sent Events
- 🎯 TypeScript type safety
- 🔧 Extensible component registry

## Setup

1. Install dependencies (in this directory):

```bash
cd examples/14-genui-chat
pnpm install
```

2. Set environment variables:

Create a `.env` file:

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_API_BASE_URL=https://api.openai.com/v1
```

3. Run the development server:

```bash
pnpm dev
```

This starts both the frontend (http://localhost:3000) and backend API server (http://localhost:3001).

Or run them separately:

```bash
# Terminal 1 - Backend
pnpm dev:server

# Terminal 2 - Frontend  
pnpm dev:client
```

## Try it out

Ask questions like:
- "What's the weather in Tokyo?"
- "Show me AAPL stock price"
- "What's the weather in Paris and TSLA stock?"

## Project Structure

```
14-genui-chat/
├── src/
│   ├── components/
│   │   ├── Chat.tsx           # Main chat interface
│   │   ├── WeatherCard.tsx    # Weather UI component
│   │   └── StockCard.tsx      # Stock UI component
│   ├── tools/
│   │   ├── weather.ts         # Weather tool definition
│   │   └── stock.ts           # Stock tool definition
│   ├── app/
│   │   └── globals.css        # Global styles
│   ├── server.ts              # Backend API server
│   ├── App.tsx                # React app root
│   ├── main.tsx               # Vite entry point
│   └── styles.css             # GenUI styles
├── index.html                 # HTML template
├── vite.config.ts             # Vite configuration
├── pnpm-workspace.yaml        # Isolated workspace config
└── package.json
```

## How It Works

### 1. GenUI Registry

```typescript
const registry = createGenUIRegistry();

registry.register('get_weather', {
  component: WeatherCard,
  loading: WeatherCardLoading,
  error: WeatherCardError,
});
```

### 2. Custom UI Components

Each tool result is rendered with a custom component:

- **WeatherCard**: Displays temperature, conditions, and forecast
- **StockCard**: Shows stock price with interactive chart
- **Loading/Error States**: Graceful handling of async operations

### 3. Backend API

The Node.js server streams agent responses to the frontend:

```typescript
for await (const chunk of agent.stream(message)) {
  res.write(JSON.stringify(chunk) + '\n');
}
```

## Build for Production

```bash
pnpm build
pnpm preview
```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── chat/
│   │   │       └── route.ts      # Chat API endpoint
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Home page with chat
│   ├── components/
│   │   ├── Chat.tsx              # Main chat component
│   │   ├── WeatherCard.tsx       # Weather UI component
│   │   └── StockCard.tsx         # Stock UI component
│   └── tools/
│       ├── weather.ts            # Weather tool definition
│       └── stock.ts              # Stock tool definition
├── package.json
├── tsconfig.json
└── next.config.js
```

## How it works

1. **Tools with GenUI**: Tools return data with `__genui: true` marker
2. **Custom Components**: Register UI components for each tool in the registry
3. **Streaming**: Server streams responses using Next.js Route Handlers
4. **Client**: React components handle streaming and render custom UIs

## Learn More

- [Seashore Documentation](../../docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [@seashore/genui Package](../../packages/genui)
