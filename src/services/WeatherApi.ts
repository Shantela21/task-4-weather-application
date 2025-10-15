import type { WeatherData } from '../types/weather';

const OM_FORECAST = 'https://api.open-meteo.com/v1/forecast';

export class WeatherApiService {
  private static instance: WeatherApiService;
  private cache: Map<string, { data: WeatherData; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  public static getInstance(): WeatherApiService {
    if (!WeatherApiService.instance) {
      WeatherApiService.instance = new WeatherApiService();
    }
    return WeatherApiService.instance;
  }

  private getCacheKey(query: string, days: number): string {
    return `${query.toLowerCase().trim()}_${days}`;
  }

  private isValidCache(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  private async makeRequest(url: string): Promise<any> {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'WeatherApp/1.0' } });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // --- Geocoding with OpenStreetMap / Nominatim ---
  private async geocode(query: string): Promise<{ lat: number; lon: number; name: string; country: string; admin1: string }> {
    const cleanQuery = query.trim();
    if (!cleanQuery) throw new Error('Please enter a city name');

    const coordMatch = cleanQuery.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lon = parseFloat(coordMatch[3]);
      return { lat, lon, name: 'Current Location', country: 'Unknown', admin1: 'Unknown' };
    }

    const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';
    const url = `${NOMINATIM_API}?q=${encodeURIComponent(cleanQuery)}&format=json&limit=5&addressdetails=1`;
    const data = await this.makeRequest(url);

    if (!data || data.length === 0) throw new Error(`No location found for "${cleanQuery}".`);

    const result = data[0];
    return {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      name: result.display_name.split(',')[0],
      country: result.address.country || 'Unknown',
      admin1: result.address.state || result.address.region || result.address.county || 'Unknown'
    };
  }

  // --- Weather helpers ---
  private wmoToText(code: number): string {
    const weatherCodes: Record<number, string> = {
      0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
      45: 'Fog', 48: 'Depositing rime fog', 51: 'Light drizzle', 53: 'Moderate drizzle',
      55: 'Dense drizzle', 56: 'Light freezing drizzle', 57: 'Dense freezing drizzle',
      61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain', 66: 'Light freezing rain',
      67: 'Heavy freezing rain', 71: 'Slight snow fall', 73: 'Moderate snow fall', 75: 'Heavy snow fall',
      77: 'Snow grains', 80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
      85: 'Slight snow showers', 86: 'Heavy snow showers', 95: 'Thunderstorm', 96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    };
    return weatherCodes[code] || 'Unknown';
  }

  private getWeatherIcon(code: number, isDay: number = 1): string {
    const iconMap: Record<number, string> = {
      0: isDay ? '☀️' : '🌙', 1: isDay ? '🌤️' : '🌤️', 2: '⛅', 3: '☁️',
      45: '🌫️', 48: '🌫️', 51: '🌦️', 53: '🌦️', 55: '🌦️',
      61: '🌧️', 63: '🌧️', 65: '🌧️', 71: '🌨️', 73: '🌨️', 75: '🌨️',
      80: '🌦️', 81: '🌦️', 82: '🌦️', 95: '⛈️', 96: '⛈️', 99: '⛈️'
    };
    return iconMap[code] || '🌈';
  }

  private celsiusToFahrenheit(c: number): number {
    return Math.round((c * 9/5 + 32) * 10) / 10;
  }

  private msToKmph(ms: number): number {
    return Math.round(ms * 3.6 * 10) / 10;
  }

  private msToMph(ms: number): number {
    return Math.round(ms * 2.23694 * 10) / 10;
  }

  private getWindDirection(degrees: number): string {
    const directions = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  private calculateRainChance(precipitationMm: number, weatherCode: number): number {
    // Base chance on precipitation amount
    let chance = 0;
    
    if (precipitationMm > 0) {
      // If there's any precipitation, start with a base chance
      if (precipitationMm < 0.1) chance = 10;
      else if (precipitationMm < 0.5) chance = 25;
      else if (precipitationMm < 1.0) chance = 40;
      else if (precipitationMm < 2.5) chance = 60;
      else if (precipitationMm < 5.0) chance = 80;
      else chance = 95;
    }
    
    // Adjust based on weather code
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(weatherCode)) {
      // Rain-related weather codes - increase chance
      chance = Math.max(chance, 30);
      if ([63, 65, 67, 81, 82, 95, 96, 99].includes(weatherCode)) {
        chance = Math.max(chance, 70); // Heavy rain/thunderstorm codes
      }
    }
    
    return Math.min(100, chance);
  }

  // --- Daily/hourly forecast processing ---
  private processDailyForecast(daily: any, hourly: any): any[] {
    if (!daily || !daily.time) return [];

    return daily.time.map((date: string, index: number) => ({
      date,
      date_epoch: Math.floor(new Date(date).getTime() / 1000),
      day: {
        maxtemp_c: Math.round(daily.temperature_2m_max[index] * 10) / 10,
        maxtemp_f: this.celsiusToFahrenheit(daily.temperature_2m_max[index]),
        mintemp_c: Math.round(daily.temperature_2m_min[index] * 10) / 10,
        mintemp_f: this.celsiusToFahrenheit(daily.temperature_2m_min[index]),
        avgtemp_c: Math.round((daily.temperature_2m_max[index] + daily.temperature_2m_min[index]) / 2 * 10) / 10,
        avgtemp_f: this.celsiusToFahrenheit((daily.temperature_2m_max[index] + daily.temperature_2m_min[index]) / 2),
        maxwind_mph: this.msToMph(daily.wind_speed_10m_max[index]),
        maxwind_kph: this.msToKmph(daily.wind_speed_10m_max[index]),
        totalprecip_mm: Math.round(daily.precipitation_sum[index] * 10) / 10,
        totalprecip_in: Math.round((daily.precipitation_sum[index] / 25.4) * 100) / 100,
        daily_chance_of_rain: this.calculateRainChance(daily.precipitation_sum[index], daily.weathercode[index]),
        condition: {
          text: this.wmoToText(daily.weathercode[index]),
          icon: this.getWeatherIcon(daily.weathercode[index]),
          code: daily.weathercode[index]
        },
        uv: 0
      },
      hour: this.processHourlyForecastForDate(date, hourly)
    }));
  }

private processHourlyForecastForDate(date: string, hourly: {
  time: string[];
  temperature_2m: number[];
  apparent_temperature: number[];
  precipitation: number[];
  weathercode: number[];
  windspeed_10m: number[];
  winddirection_10m: number[];
  is_day?: number[];
}): any[] {
  if (!hourly || !hourly.time) return [];

  // Create an array of indices for the given date
  const dateIndices: number[] = hourly.time
    .map((time, index) => ({ time, index }))
    .filter(item => typeof item.time === 'string' && item.time.startsWith(date))
    .map(item => item.index)
    .slice(0, 24);

  // Map over indices to produce hourly forecast objects
  return dateIndices.map(index => ({
    time: hourly.time[index],
    time_epoch: Math.floor(new Date(hourly.time[index]).getTime() / 1000),
    temp_c: Math.round(hourly.temperature_2m[index] * 10) / 10,
    temp_f: this.celsiusToFahrenheit(hourly.temperature_2m[index]),
    is_day: hourly.is_day?.[index] ?? 1,
    condition: {
      text: this.wmoToText(hourly.weathercode[index]),
      icon: this.getWeatherIcon(hourly.weathercode[index], hourly.is_day?.[index] ?? 1),
      code: hourly.weathercode[index]
    },
    wind_mph: this.msToMph(hourly.windspeed_10m[index]),
    wind_kph: this.msToKmph(hourly.windspeed_10m[index]),
    wind_dir: this.getWindDirection(hourly.winddirection_10m[index]),
    precip_mm: Math.round(hourly.precipitation[index] * 10) / 10,
    precip_in: Math.round((hourly.precipitation[index] / 25.4) * 100) / 100,
    chance_of_rain: this.calculateRainChance(hourly.precipitation[index], hourly.weathercode[index]),
    feelslike_c: Math.round(hourly.apparent_temperature[index] * 10) / 10,
    feelslike_f: this.celsiusToFahrenheit(hourly.apparent_temperature[index])
  }));
}
  // --- Main forecast fetch ---
  public async getForecastWeather(query: string, days: number = 7): Promise<WeatherData> {
    const cacheKey = this.getCacheKey(query, days);
    const cached = this.cache.get(cacheKey);
    if (cached && this.isValidCache(cached.timestamp)) return cached.data;

    const location = await this.geocode(query);
    const { lat, lon, name, country } = location;

    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      current_weather: 'true',
      hourly: 'temperature_2m,weathercode,apparent_temperature,precipitation,windspeed_10m,winddirection_10m,is_day',
      daily: 'temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,wind_speed_10m_max,wind_direction_10m_dominant',
      timezone: 'auto',
      forecast_days: days.toString()
    });

    const data = await this.makeRequest(`${OM_FORECAST}?${params.toString()}`);

    const weatherData: WeatherData = {
      location: { name, country, lat, lon },
      current: {
        temp_c: Math.round(data.current_weather.temperature * 10) / 10,
        temp_f: this.celsiusToFahrenheit(data.current_weather.temperature),
        condition: {
          text: this.wmoToText(data.current_weather.weathercode),
          icon: this.getWeatherIcon(data.current_weather.weathercode, data.current_weather.is_day),
          code: data.current_weather.weathercode
        },
        wind_mph: this.msToMph(data.current_weather.windspeed_10m),
        wind_kph: this.msToKmph(data.current_weather.windspeed_10m),
        wind_dir: this.getWindDirection(data.current_weather.winddirection_10m),
        pressure_mb: 1013,
        pressure_in: 29.92,
        precip_mm: data.current_weather.precipitation,
        precip_in: Math.round(data.current_weather.precipitation / 25.4 * 100) / 100,
        humidity: 50,
        cloud: 0,
        feelslike_c: Math.round(data.current_weather.apparent_temperature * 10) / 10,
        feelslike_f: this.celsiusToFahrenheit(data.current_weather.apparent_temperature),
        vis_km: 10,
        vis_miles: 6.2,
        uv: 0,
        gust_mph: this.msToMph(data.current_weather.windspeed_10m),
        gust_kph: this.msToKmph(data.current_weather.windspeed_10m)
      },
      forecast: { forecastday: this.processDailyForecast(data.daily, data.hourly) },
      alerts: []
    };

    this.cache.set(cacheKey, { data: weatherData, timestamp: Date.now() });
    this.saveToLocalStorage(cacheKey, weatherData);
    return weatherData;
  }

  // --- LocalStorage caching ---
  private saveToLocalStorage(key: string, data: WeatherData): void {
    try { localStorage.setItem(`weatherCache_${key}`, JSON.stringify({ data, timestamp: Date.now() })); } catch {}
  }

  public loadFromLocalStorage(): void {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith('weatherCache_'))
        .forEach(k => {
          const cached = localStorage.getItem(k);
          if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            const cacheKey = k.replace('weatherCache_', '');
            this.cache.set(cacheKey, { data, timestamp });
          }
        });
    } catch {}
  }

  public clearCache(): void {
    this.cache.clear();
    Object.keys(localStorage).filter(k => k.startsWith('weatherCache_')).forEach(k => localStorage.removeItem(k));
  }

  // --- Location search ---
  public async searchLocations(query: string): Promise<any[]> {
    if (query.length < 2) return [];
    const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';
    const url = `${NOMINATIM_API}?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;
    const data = await this.makeRequest(url);

    if (!data || data.length === 0) return [];

    return data.map((result: any) => ({
      id: `${result.lat},${result.lon}`,
      name: result.display_name.split(',')[0],
      region: result.address.state || result.address.region || result.address.county || result.address.country,
      country: result.address.country,
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon)
    }));
  }
}

export const weatherApi = WeatherApiService.getInstance();
