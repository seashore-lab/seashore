/**
 * Weather Card Component - Custom UI for weather data
 */

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: string;
  unit: 'celsius' | 'fahrenheit';
}

interface WeatherCardProps {
  data: WeatherData;
}

export function WeatherCard({ data }: WeatherCardProps) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '24px',
        borderRadius: '16px',
        minWidth: '280px',
        maxWidth: '320px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div style={{ fontSize: '56px', marginBottom: '12px', textAlign: 'center' }}>{data.icon}</div>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '26px', fontWeight: '600' }}>{data.location}</h3>
      <div style={{ fontSize: '48px', fontWeight: '700', margin: '12px 0' }}>
        {data.temperature}°{data.unit === 'celsius' ? 'C' : 'F'}
      </div>
      <div style={{ fontSize: '20px', marginBottom: '20px', opacity: 0.95 }}>{data.condition}</div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          fontSize: '15px',
          opacity: 0.9,
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <div>
          <div style={{ marginBottom: '4px' }}>💧 Humidity</div>
          <div style={{ fontWeight: '600' }}>{data.humidity}%</div>
        </div>
        <div>
          <div style={{ marginBottom: '4px' }}>💨 Wind</div>
          <div style={{ fontWeight: '600' }}>{data.windSpeed} km/h</div>
        </div>
      </div>
    </div>
  );
}

export function WeatherCardLoading() {
  return (
    <div style={{ padding: '24px', textAlign: 'center' }}>
      <div className="spinner" />
      <p style={{ marginTop: '12px', color: '#666' }}>Fetching weather data...</p>
    </div>
  );
}

export function WeatherCardError({ error }: { error: Error }) {
  return (
    <div
      style={{
        padding: '24px',
        color: '#dc2626',
        backgroundColor: '#fee2e2',
        borderRadius: '12px',
      }}
    >
      ⚠️ Failed to fetch weather: {error.message}
    </div>
  );
}
