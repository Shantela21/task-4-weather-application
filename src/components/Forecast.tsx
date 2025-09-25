
import React, { useState, useEffect } from 'react';

interface ForecastProps {
  location: string;
  units: 'metric' | 'imperial';
}

const API_KEY = 'YOUR_API_KEY'; // Replace with your OpenWeatherMap API key

const Forecast: React.FC<ForecastProps> = ({ location, units }) => {
  const [forecastType, setForecastType] = useState<'hourly' | 'daily'>('hourly');
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) return;
    const fetchForecast = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get coordinates for the location
        const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${API_KEY}`);
        const geoData = await geoRes.json();
        if (!geoData[0]) throw new Error('Location not found');
        const { lat, lon } = geoData[0];
        // Fetch forecast
        const res = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,current,alerts&appid=${API_KEY}&units=${units}`);
        const data = await res.json();
        setForecast(data);
      } catch (err: any) {
        setError(err.message);
        setForecast(null);
      } finally {
        setLoading(false);
      }
    };
    fetchForecast();
    // eslint-disable-next-line
  }, [location, units]);

  return (
    <div className="forecast-container">
      <div style={{ marginBottom: 12 }}>
        <button
          onClick={() => setForecastType('hourly')}
          style={{ fontWeight: forecastType === 'hourly' ? 'bold' : 'normal', marginRight: 8 }}
        >
          Hourly
        </button>
        <button
          onClick={() => setForecastType('daily')}
          style={{ fontWeight: forecastType === 'daily' ? 'bold' : 'normal' }}
        >
          Daily
        </button>
      </div>
      {loading && <p>Loading forecast...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {forecast && forecastType === 'hourly' && (
        <div>
          <h3>Hourly Forecast (next 12 hours)</h3>
          <ul>
            {forecast.hourly.slice(0, 12).map((h: any, idx: number) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{new Date(h.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}:</span>
                <img src={`https://openweathermap.org/img/wn/${h.weather[0].icon}@2x.png`} alt={h.weather[0].description} width={32} height={32} />
                <span>{h.temp}°{units === 'metric' ? 'C' : 'F'}</span>
                <span>Humidity: {h.humidity}%</span>
                <span>Wind: {h.wind_speed} {units === 'metric' ? 'm/s' : 'mph'}</span>
                <span>{h.weather[0].description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {forecast && forecastType === 'daily' && (
        <div>
          <h3>Daily Forecast (next 7 days)</h3>
          <ul>
            {forecast.daily.slice(0, 7).map((d: any, idx: number) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{new Date(d.dt * 1000).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}:</span>
                <img src={`https://openweathermap.org/img/wn/${d.weather[0].icon}@2x.png`} alt={d.weather[0].description} width={32} height={32} />
                <span>{d.temp.day}°{units === 'metric' ? 'C' : 'F'}</span>
                <span>Humidity: {d.humidity}%</span>
                <span>Wind: {d.wind_speed} {units === 'metric' ? 'm/s' : 'mph'}</span>
                <span>{d.weather[0].description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Forecast;
