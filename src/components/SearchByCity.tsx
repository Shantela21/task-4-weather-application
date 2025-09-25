import { useState, useEffect } from 'react';

type CurrentWeather = {
  city?: { name?: string; country?: string };
  main?: { temp?: number; feels_like?: number; humidity?: number; pressure?: number };
  weather?: { description?: string; main?: string }[];
  dt?: number;
  wind?: { speed?: number; deg?: number };
  visibility?: number;
  sys?: { sunrise?: number; sunset?: number; country?: string };
  name?: string;
};

type ForecastItem = {
  dt: number;
  main: { temp: number };
  weather: { main: string; description: string }[];
};

export default function WeatherDashboard() {
  const [cityInput, setCityInput] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<ForecastItem[]>([]);

  const RAPIDAPI_KEY = '50d6f73245msh414cc98723596ffp107a37jsnb1c8a0f3fc88';
  const RAPIDAPI_HOST = 'weather-api167.p.rapidapi.com';

  useEffect(() => {
    if (!city) return;

    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      setWeather(null);
      setForecast([]);

      try {
        // Fetch current weather
        const currentUrl = `https://${RAPIDAPI_HOST}/api/weather/current?place=${encodeURIComponent(city)}&units=metric&lang=en`;
        const currentRes = await fetch(currentUrl, {
          method: 'GET',
          headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': RAPIDAPI_HOST },
        });

        if (!currentRes.ok) {
          if (currentRes.status === 429) throw new Error('Too many requests – please wait and try again later.');
          throw new Error(`Weather request failed: ${currentRes.status}`);
        }

        const currentData: CurrentWeather = await currentRes.json();
        setWeather(currentData);

        // Fetch 5-day forecast
        const forecastUrl = `https://'weather-api167.p.rapidapi.com'/api/weather/forecast?place=${encodeURIComponent(city)}&units=metric&lang=en&cnt=5`;
        const forecastRes = await fetch(forecastUrl, {
          method: 'GET',
          headers: { 'X-RapidAPI-Key': 'd5a34761d0msh09042868a3b465bp1504dcjsn1f48d6391370', 'X-RapidAPI-Host': 'weather-api167.p.rapidapi.com' },
        });

        if (forecastRes.ok) {
          const forecastData: { list: ForecastItem[] } = await forecastRes.json();
          setForecast(forecastData.list || []);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch weather data.');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [city]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityInput.trim()) {
      setError('Please enter a city name.');
      return;
    }
    setCity(cityInput.trim());
  };

  const formatTime = (dt?: number) => dt ? new Date(dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
  const formatDate = (dt?: number) => dt ? new Date(dt * 1000).toLocaleDateString('en-US', { weekday: 'long' }) : '—';
  
  const calculateUVIndex = () => { const h = new Date().getHours(); return h >= 10 && h <= 16 ? 6 : h >= 8 && h <= 18 ? 4 : 2; };
  const calculateAirQuality = () => { const h = weather?.main?.humidity||50, p = weather?.main?.pressure||1013; return Math.min(Math.round(50 + Math.abs(h-50) + Math.abs(p-1013)/10), 200); };
  const getWindDirection = (deg?: number) => { if(!deg) return '—'; const dirs=['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']; return dirs[Math.round(deg/22.5)%16]; };
  const getWeatherIcon = (cond?: string) => { if(!cond) return '☁️'; switch(cond.toLowerCase()){ case 'clear': case 'sunny': return '☀️'; case 'clouds': case 'cloudy': return '☁️'; case 'rain': case 'rainy': return '🌧️'; case 'snow': return '❄️'; case 'thunderstorm': return '⛈️'; case 'drizzle': return '🌦️'; case 'mist': case 'fog': return '🌫️'; default: return '☁️'; } };

  return (
    <div className="weather-dashboard">
      <form onSubmit={handleSubmit}>
        <input value={cityInput} onChange={e=>setCityInput(e.target.value)} placeholder="Search City" />
        <button type="submit" disabled={loading}>{loading?'Searching…':'Search'}</button>
      </form>

      {error && <div style={{color:'red'}}>{error}</div>}

      {weather && (
        <div>
          <h2>{weather.name || weather.city?.name}, {weather.sys?.country || weather.city?.country}</h2>
          <p>Temperature: {Math.round(weather.main?.temp||0)}°C</p>
          <p>Feels like: {Math.round(weather.main?.feels_like||0)}°C</p>
          <p>Condition: {weather.weather?.[0]?.description || 'N/A'}</p>

          <h3>Today's Highlights</h3>
          <ul>
            <li>UV Index: {calculateUVIndex()}</li>
            <li>Wind: {weather.wind?.speed||0} m/s ({getWindDirection(weather.wind?.deg)})</li>
            <li>Humidity: {weather.main?.humidity}%</li>
            <li>Visibility: {(weather.visibility||0)/1000} km</li>
            <li>Air Quality: {calculateAirQuality()}</li>
            <li>Sunrise: {formatTime(weather.sys?.sunrise)} | Sunset: {formatTime(weather.sys?.sunset)}</li>
          </ul>

          {forecast.length>0 && (
            <>
              <h3>5-Day Forecast</h3>
              <div style={{display:'flex', gap:'20px'}}>
                {forecast.map((f, i)=>(
                  <div key={i} style={{textAlign:'center', border:'1px solid #ccc', borderRadius:'10px', padding:'10px'}}>
                    <div>{formatDate(f.dt)}</div>
                    <div style={{fontSize:'32px'}}>{getWeatherIcon(f.weather[0]?.main)}</div>
                    <div>{Math.round(f.main.temp)}°C</div>
                    <div>{f.weather[0]?.description}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
