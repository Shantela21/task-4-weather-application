import type { WeatherData } from '../types/weather';

const OM_FORECAST = 'https://api.open-meteo.com/v1/forecast';
const OM_GEOCODE = 'https://geocoding-api.open-meteo.com/v1/search';

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
      console.log('Fetching:', url); // Debug log
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data); // Debug log
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw new Error(`Failed to fetch data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async geocode(query: string): Promise<{ lat: number; lon: number; name: string; country: string; admin1: string }> {
    // Clean the query string
    const cleanQuery = query.trim();
    
    if (!cleanQuery) {
      throw new Error('Please enter a city name');
    }

    // Build the geocoding URL with proper parameters
    const geocodeParams = new URLSearchParams({
      name: cleanQuery,
      count: '5',
      language: 'en',
      format: 'json'
    });

    const url = `${OM_GEOCODE}?${geocodeParams.toString()}`;
    const data = await this.makeRequest(url);
    
    console.log('Geocoding results:', data); // Debug log
    
    if (!data.results || data.results.length === 0) {
      // Try with different approach - common cities fallback
      const fallbackCoords = this.getFallbackCoordinates(cleanQuery);
      if (fallbackCoords) {
        return {
          lat: fallbackCoords.lat,
          lon: fallbackCoords.lon,
          name: cleanQuery,
          country: 'Unknown',
          admin1: 'Unknown'
        };
      }
      throw new Error(`No location found for "${cleanQuery}". Try a different spelling or larger city.`);
    }
    
    // Get the first result (most relevant)
    const result = data.results[0];
    return {
      lat: result.latitude,
      lon: result.longitude,
      name: result.name,
      country: result.country,
      admin1: result.admin1 || result.country
    };
  }

  // Fallback coordinates for common cities
  private getFallbackCoordinates(cityName: string): { lat: number; lon: number } | null {
    const fallbackCities: Record<string, { lat: number; lon: number }> = {
      'london': { lat: 51.5074, lon: -0.1278 },
      'new york': { lat: 40.7128, lon: -74.0060 },
      'paris': { lat: 48.8566, lon: 2.3522 },
      'tokyo': { lat: 35.6762, lon: 139.6503 },
      'sydney': { lat: -33.8688, lon: 151.2093 },
      'berlin': { lat: 52.5200, lon: 13.4050 },
      'mumbai': { lat: 19.0760, lon: 72.8777 },
      'shanghai': { lat: 31.2304, lon: 121.4737 },
      'moscow': { lat: 55.7558, lon: 37.6173 },
      'cairo': { lat: 30.0444, lon: 31.2357 },
      'rome': { lat: 41.9028, lon: 12.4964 },
      'madrid': { lat: 40.4168, lon: -3.7038 },
      'amsterdam': { lat: 52.3676, lon: 4.9041 },
      'dubai': { lat: 25.2048, lon: 55.2708 },
      'singapore': { lat: 1.3521, lon: 103.8198 },
      'seoul': { lat: 37.5665, lon: 126.9780 },
      'mexico city': { lat: 19.4326, lon: -99.1332 },
      'sao paulo': { lat: -23.5505, lon: -46.6333 },
      'los angeles': { lat: 34.0522, lon: -118.2437 },
      'chicago': { lat: 41.8781, lon: -87.6298 },
      'toronto': { lat: 43.6532, lon: -79.3832 }
    };

    const normalizedCity = cityName.toLowerCase().trim();
    return fallbackCities[normalizedCity] || null;
  }

  // ... rest of your existing methods (wmoToText, getWeatherIcon, celsiusToFahrenheit, etc.)
  // Keep all the other methods exactly as they were in my previous response

  private wmoToText(code: number): string {
    const weatherCodes: Record<number, string> = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      56: 'Light freezing drizzle',
      57: 'Dense freezing drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      66: 'Light freezing rain',
      67: 'Heavy freezing rain',
      71: 'Slight snow fall',
      73: 'Moderate snow fall',
      75: 'Heavy snow fall',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    };
    return weatherCodes[code] || 'Unknown';
  }

  private getWeatherIcon(code: number, isDay: number = 1): string {
    const iconMap: Record<number, string> = {
      0: isDay ? '☀️' : '🌙',
      1: isDay ? '🌤️' : '🌤️',
      2: '⛅',
      3: '☁️',
      45: '🌫️',
      48: '🌫️',
      51: '🌦️',
      53: '🌦️',
      55: '🌦️',
      61: '🌧️',
      63: '🌧️',
      65: '🌧️',
      71: '🌨️',
      73: '🌨️',
      75: '🌨️',
      80: '🌦️',
      81: '🌦️',
      82: '🌦️',
      95: '⛈️',
      96: '⛈️',
      99: '⛈️'
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

  public async getForecastWeather(query: string, days: number = 7): Promise<WeatherData> {
    try {
      const cacheKey = this.getCacheKey(query, days);
      const cached = this.cache.get(cacheKey);
      
      if (cached && this.isValidCache(cached.timestamp)) {
        return cached.data;
      }

      // Get location coordinates
      const location = await this.geocode(query);
      const { lat, lon, name, country } = location;

      // Build forecast URL
      const forecastParams = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lon.toString(),
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m,is_day',
        hourly: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,is_day',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,wind_speed_10m_max,wind_direction_10m_dominant',
        timezone: 'auto',
        forecast_days: days.toString()
      });

      const forecastUrl = `${OM_FORECAST}?${forecastParams.toString()}`;
      const forecastData = await this.makeRequest(forecastUrl);

      // Process current weather
      const current = forecastData.current;
      
      const weatherData: WeatherData = {
        location: {
          name: name,
          country: country,
          lat: lat,
          lon: lon
        },
        current: {
          temp_c: Math.round(current.temperature_2m * 10) / 10,
          temp_f: this.celsiusToFahrenheit(current.temperature_2m),
          condition: {
            text: this.wmoToText(current.weather_code),
            icon: this.getWeatherIcon(current.weather_code, current.is_day),
            code: current.weather_code
          },
          wind_mph: this.msToMph(current.wind_speed_10m),
          wind_kph: this.msToKmph(current.wind_speed_10m),
          wind_dir: this.getWindDirection(current.wind_direction_10m),
          pressure_mb: Math.round(current.pressure_msl),
          pressure_in: Math.round(current.pressure_msl * 0.02953 * 100) / 100,
          precip_mm: Math.round(current.precipitation * 10) / 10,
          precip_in: Math.round((current.precipitation / 25.4) * 100) / 100,
          humidity: current.relative_humidity_2m,
          cloud: 0,
          feelslike_c: Math.round(current.apparent_temperature * 10) / 10,
          feelslike_f: this.celsiusToFahrenheit(current.apparent_temperature),
          vis_km: 10,
          vis_miles: 6.2,
          uv: 0,
          gust_mph: this.msToMph(current.wind_speed_10m),
          gust_kph: this.msToKmph(current.wind_speed_10m)
        },
        forecast: {
          forecastday: this.processDailyForecast(forecastData.daily, forecastData.hourly)
        },
        alerts: []
      };

      // Cache the result
      this.cache.set(cacheKey, { data: weatherData, timestamp: Date.now() });
      this.saveToLocalStorage(cacheKey, weatherData);

      return weatherData;
    } catch (error) {
      console.error('Error in getForecastWeather:', error);
      throw error;
    }
  }

  private getWindDirection(degrees: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  private processDailyForecast(daily: any, hourly: any): any[] {
    if (!daily || !daily.time) return [];
    
    return daily.time.map((date: string, index: number) => ({
      date: date,
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
        totalsnow_cm: 0,
        avgvis_km: 10,
        avgvis_miles: 6.2,
        avghumidity: 70,
        daily_will_it_rain: daily.precipitation_sum[index] > 0 ? 1 : 0,
        daily_chance_of_rain: Math.min(100, Math.round(daily.precipitation_sum[index] * 20)),
        daily_will_it_snow: 0,
        daily_chance_of_snow: 0,
        condition: {
          text: this.wmoToText(daily.weather_code[index]),
          icon: this.getWeatherIcon(daily.weather_code[index]),
          code: daily.weather_code[index]
        },
        uv: 0
      },
      astro: {
        sunrise: '06:00 AM',
        sunset: '06:00 PM',
        moonrise: '00:00 AM',
        moonset: '00:00 PM',
        moon_phase: 'New Moon',
        moon_illumination: '0'
      },
      hour: this.processHourlyForecastForDate(date, hourly)
    }));
  }

  private processHourlyForecastForDate(date: string, hourly: any): any[] {
    if (!hourly || !hourly.time) return [];
    
    const dateHours = hourly.time
      .map((time: string, index: number) => ({ time, index }))
      .filter((item: { time: string; index: number }) => item.time.startsWith(date))
      .slice(0, 24);

    return dateHours.map((item: { time: string; index: number }) => {
      const index = item.index;
      return {
        time_epoch: Math.floor(new Date(item.time).getTime() / 1000),
        time: item.time,
        temp_c: Math.round(hourly.temperature_2m[index] * 10) / 10,
        temp_f: this.celsiusToFahrenheit(hourly.temperature_2m[index]),
        is_day: hourly.is_day?.[index] || 1,
        condition: {
          text: this.wmoToText(hourly.weather_code[index]),
          icon: this.getWeatherIcon(hourly.weather_code[index], hourly.is_day?.[index] || 1),
          code: hourly.weather_code[index]
        },
        wind_mph: this.msToMph(hourly.wind_speed_10m[index]),
        wind_kph: this.msToKmph(hourly.wind_speed_10m[index]),
        wind_dir: this.getWindDirection(hourly.wind_direction_10m[index]),
        wind_degree: hourly.wind_direction_10m[index],
        pressure_mb: 1013,
        pressure_in: 29.92,
        precip_mm: Math.round(hourly.precipitation[index] * 10) / 10,
        precip_in: Math.round((hourly.precipitation[index] / 25.4) * 100) / 100,
        humidity: hourly.relative_humidity_2m?.[index] || 50,
        cloud: 0,
        feelslike_c: Math.round(hourly.apparent_temperature[index] * 10) / 10,
        feelslike_f: this.celsiusToFahrenheit(hourly.apparent_temperature[index]),
        windchill_c: Math.round(hourly.apparent_temperature[index] * 10) / 10,
        windchill_f: this.celsiusToFahrenheit(hourly.apparent_temperature[index]),
        heatindex_c: Math.round(hourly.apparent_temperature[index] * 10) / 10,
        heatindex_f: this.celsiusToFahrenheit(hourly.apparent_temperature[index]),
        dewpoint_c: Math.round(hourly.temperature_2m[index] * 10) / 10,
        dewpoint_f: this.celsiusToFahrenheit(hourly.temperature_2m[index]),
        will_it_rain: hourly.precipitation[index] > 0 ? 1 : 0,
        chance_of_rain: Math.min(100, Math.round(hourly.precipitation[index] * 20)),
        will_it_snow: 0,
        chance_of_snow: 0,
        vis_km: 10,
        vis_miles: 6.2,
        gust_mph: this.msToMph(hourly.wind_speed_10m[index]),
        gust_kph: this.msToKmph(hourly.wind_speed_10m[index]),
        uv: 0
      };
    });
  }

  public async searchLocations(query: string): Promise<any[]> {
    if (query.length < 2) return [];
    
    try {
      const geocodeParams = new URLSearchParams({
        name: query.trim(),
        count: '5',
        language: 'en',
        format: 'json'
      });

      const url = `${OM_GEOCODE}?${geocodeParams.toString()}`;
      const data = await this.makeRequest(url);
      
      if (!data.results || data.results.length === 0) {
        return [];
      }
      
      return data.results.map((result: any) => ({
        id: `${result.latitude},${result.longitude}`,
        name: result.name,
        region: result.admin1 || result.country,
        country: result.country,
        lat: result.latitude,
        lon: result.longitude
      }));
    } catch (error) {
      console.error('Location search failed:', error);
      return [];
    }
  }

  private saveToLocalStorage(key: string, data: WeatherData): void {
    try {
      localStorage.setItem(`weatherCache_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  public loadFromLocalStorage(): void {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith('weatherCache_'))
        .forEach(key => {
          const cached = localStorage.getItem(key);
          if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            const cacheKey = key.replace('weatherCache_', '');
            this.cache.set(cacheKey, { data, timestamp });
          }
        });
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
  }

  public clearCache(): void {
    this.cache.clear();
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith('weatherCache_'))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear localStorage cache:', error);
    }
  }
}

export const weatherApi = WeatherApiService.getInstance();