
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
    <div className="weather-container forecast-container">
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setForecastType('hourly')}
          className={`px-3 py-1 rounded font-semibold transition ${forecastType === 'hourly' ? 'bg-sky-600 text-white' : 'bg-white/80 text-gray-800 dark:bg-gray-700 dark:text-gray-100 border border-gray-300 dark:border-gray-700'}`}
        >
          Hourly
        </button>
        <button
          onClick={() => setForecastType('daily')}
          className={`px-3 py-1 rounded font-semibold transition ${forecastType === 'daily' ? 'bg-sky-600 text-white' : 'bg-white/80 text-gray-800 dark:bg-gray-700 dark:text-gray-100 border border-gray-300 dark:border-gray-700'}`}
        >
          Daily
        </button>
      </div>
      {loading && <p className="text-sky-700 dark:text-sky-300">Loading forecast...</p>}
      {error && <p className="text-red-600 dark:text-red-400 font-semibold">{error}</p>}
      {forecast && forecastType === 'hourly' && (
        <div>
          <h3 className="text-lg font-bold mb-2">Hourly Forecast (next 12 hours)</h3>
          <ul className="space-y-2">
            {forecast.hourly.slice(0, 12).map((h: any, idx: number) => (
              <li key={idx} className="flex items-center gap-4 bg-white/70 dark:bg-gray-800/70 rounded-lg px-4 py-2 shadow">
                <span className="w-16 font-semibold">{new Date(h.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}:</span>
                <img src={`https://openweathermap.org/img/wn/${h.weather[0].icon}@2x.png`} alt={h.weather[0].description} className="w-8 h-8" />
                <span className="font-bold text-lg">{h.temp}°{units === 'metric' ? 'C' : 'F'}</span>
                <span className="ml-2 text-sm">Humidity: {h.humidity}%</span>
                <span className="ml-2 text-sm">Wind: {h.wind_speed} {units === 'metric' ? 'm/s' : 'mph'}</span>
                <span className="ml-2 italic text-gray-600 dark:text-gray-300">{h.weather[0].description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {forecast && forecastType === 'daily' && (
        <div>
          <h3 className="text-lg font-bold mb-2">Daily Forecast (next 7 days)</h3>
          <ul className="space-y-2">
            {forecast.daily.slice(0, 7).map((d: any, idx: number) => (
              <li key={idx} className="flex items-center gap-4 bg-white/70 dark:bg-gray-800/70 rounded-lg px-4 py-2 shadow">
                <span className="w-32 font-semibold">{new Date(d.dt * 1000).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}:</span>
                <img src={`https://openweathermap.org/img/wn/${d.weather[0].icon}@2x.png`} alt={d.weather[0].description} className="w-8 h-8" />
                <span className="font-bold text-lg">{d.temp.day}°{units === 'metric' ? 'C' : 'F'}</span>
                <span className="ml-2 text-sm">Humidity: {d.humidity}%</span>
                <span className="ml-2 text-sm">Wind: {d.wind_speed} {units === 'metric' ? 'm/s' : 'mph'}</span>
                <span className="ml-2 italic text-gray-600 dark:text-gray-300">{d.weather[0].description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Forecast;
