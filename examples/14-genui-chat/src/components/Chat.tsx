/**
 * Main Chat Component with GenUI Registry
 */

import { Chat as GenUIChat, createGenUIRegistry } from '@seashore/genui';
import { WeatherCard, WeatherCardLoading, WeatherCardError } from './WeatherCard';
import { StockCard, StockCardLoading, StockCardError } from './StockCard';

// Create GenUI registry for custom tool result rendering
const registry = createGenUIRegistry();

// Register Weather Card Component
registry.register('get_weather', {
  component: WeatherCard,
  loading: WeatherCardLoading,
  error: WeatherCardError,
});

// Register Stock Card Component
registry.register('get_stock', {
  component: StockCard,
  loading: StockCardLoading,
  error: StockCardError,
});

export default function ChatDemo() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          padding: '24px 32px',
          borderBottom: '1px solid #e5e7eb',
          background: 'white',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#111' }}>
          🌊 Seashore GenUI Demo
        </h1>
        <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: '15px' }}>
          Interactive chat with custom UI components for weather and stock data
        </p>
        <div
          style={{
            marginTop: '12px',
            fontSize: '14px',
            color: '#9ca3af',
            display: 'flex',
            gap: '24px',
            flexWrap: 'wrap',
          }}
        >
          <span>💬 Try: "What's the weather in Tokyo?"</span>
          <span>📈 Try: "Show me AAPL stock"</span>
          <span>🔄 Try: "Weather in Paris and TSLA stock"</span>
        </div>
      </header>

      <GenUIChat
        endpoint="/api/chat"
        genUIRegistry={registry}
        placeholder="Ask about weather or stock prices..."
        welcomeMessage="Hello! I can help you check weather forecasts and stock prices. What would you like to know?"
      />
    </div>
  );
}
