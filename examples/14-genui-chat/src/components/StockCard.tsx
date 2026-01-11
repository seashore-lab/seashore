/**
 * Stock Card Component - Custom UI for stock data
 */

'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
}

interface StockCardProps {
  data: StockData;
}

export function StockCard({ data }: StockCardProps) {
  const isPositive = data.change >= 0;

  // Generate mock intraday chart data
  const chartData = [
    { time: '9:30', price: data.price - data.change * 1.5 },
    { time: '10:30', price: data.price - data.change * 1.0 },
    { time: '11:30', price: data.price - data.change * 0.5 },
    { time: '12:30', price: data.price - data.change * 0.3 },
    { time: '13:30', price: data.price - data.change * 0.1 },
    { time: '14:30', price: data.price },
  ];

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '16px',
        padding: '24px',
        minWidth: '340px',
        maxWidth: '380px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'start',
          marginBottom: '16px',
        }}
      >
        <div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700', color: '#111' }}>
            {data.symbol}
          </h3>
          <div style={{ fontSize: '36px', fontWeight: '700', margin: '8px 0', color: '#111' }}>
            ${data.price.toFixed(2)}
          </div>
        </div>
        <div
          style={{
            background: isPositive ? '#d1fae5' : '#fee2e2',
            color: isPositive ? '#065f46' : '#991b1b',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '700',
          }}
        >
          {isPositive ? '↑' : '↓'} ${Math.abs(data.change).toFixed(2)} (
          {Math.abs(data.changePercent).toFixed(2)}%)
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={chartData}>
            <Line
              type="monotone"
              dataKey="price"
              stroke={isPositive ? '#10b981' : '#ef4444'}
              strokeWidth={3}
              dot={false}
            />
            <XAxis dataKey="time" hide />
            <YAxis domain={['auto', 'auto']} hide />
            <Tooltip
              contentStyle={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
              }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          paddingTop: '16px',
          borderTop: '1px solid #e5e7eb',
          fontSize: '14px',
          color: '#6b7280',
        }}
      >
        <div>
          <div style={{ marginBottom: '4px', fontWeight: '500' }}>High</div>
          <div style={{ fontSize: '16px', color: '#111', fontWeight: '600' }}>
            ${data.high.toFixed(2)}
          </div>
        </div>
        <div>
          <div style={{ marginBottom: '4px', fontWeight: '500' }}>Low</div>
          <div style={{ fontSize: '16px', color: '#111', fontWeight: '600' }}>
            ${data.low.toFixed(2)}
          </div>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <div style={{ marginBottom: '4px', fontWeight: '500' }}>Volume</div>
          <div style={{ fontSize: '16px', color: '#111', fontWeight: '600' }}>
            {(data.volume / 1000000).toFixed(2)}M
          </div>
        </div>
      </div>
    </div>
  );
}

export function StockCardLoading() {
  return (
    <div style={{ padding: '24px', textAlign: 'center' }}>
      <div className="spinner" />
      <p style={{ marginTop: '12px', color: '#666' }}>Loading stock data...</p>
    </div>
  );
}

export function StockCardError({ error }: { error: Error }) {
  return (
    <div
      style={{
        padding: '24px',
        color: '#dc2626',
        backgroundColor: '#fee2e2',
        borderRadius: '12px',
      }}
    >
      ⚠️ Failed to fetch stock: {error.message}
    </div>
  );
}
