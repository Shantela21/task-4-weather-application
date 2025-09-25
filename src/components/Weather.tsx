import React, { useState, useEffect } from 'react';

interface WeatherProps {
  location: string;
  units: 'metric' | 'imperial';
}

const API_KEY = 'YOUR_API_KEY'; // Replace with your OpenWeatherMap API key

const Weather: React.FC<WeatherProps> = ({ location, units }) => {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async () => {
    if (!location) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${API_KEY}&units=${units}`
      );
      if (!response.ok) throw new Error('Location not found');
      const data = await response.json();
      setWeather(data);
    } catch (err: any) {
      setError(err.message);
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    // eslint-disable-next-line
  }, [location, units]);

  return (
    <div className='weather-container'>
      <h1 className='weather'>Weather App</h1>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {weather && (
        <div className="weather-details">
          <h2>{weather.name}, {weather.sys?.country}</h2>
          <p>Temperature: {weather.main?.temp}°{units === 'metric' ? 'C' : 'F'}</p>
          <p>Humidity: {weather.main?.humidity}%</p>
          <p>Wind Speed: {weather.wind?.speed} {units === 'metric' ? 'm/s' : 'mph'}</p>
          <p>Condition: {weather.weather?.[0]?.description}</p>
        </div>
      )}
    </div>
  );
};

export default Weather;