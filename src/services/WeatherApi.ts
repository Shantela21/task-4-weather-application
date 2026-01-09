import type { WeatherData } from '../types/weather';

const OM_FORECAST = 'https://api.open-meteo.com/v1/forecast';

export class WeatherApiService {
  private static instance: WeatherApiService;
  private cache: Map<string, { data: WeatherData; timestamp: number }> = new Map();
  private readonly CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes
  private readonly FALLBACK_HUMIDITY = 50;
  private readonly FALLBACK_CLOUD = 0;
  private readonly FALLBACK_VIS_KM = 10;
  private readonly FALLBACK_VIS_MILES = 6.2;
  private readonly FALLBACK_UV = 0;
  private readonly FALLBACK_PRESSURE_MB = 1013;
  private readonly FALLBACK_PRESSURE_IN = 29.92;

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
    return Date.now() - timestamp < this.CACHE_DURATION_MS;
  }

  private async makeRequest(url: string): Promise<any> {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'WeatherApp/1.0' } });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      if (!data) {
        throw new Error('Empty response from weather API');
      }
      
      if (data.error) {
        throw new Error(`Weather API error: ${data.error}`);
      }
      
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch weather data: ${error.message}`);
      }
      throw new Error('Failed to fetch weather data: Unknown error');
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
      
      if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        throw new Error('Invalid coordinates. Please use format: latitude,longitude (e.g., 40.7128,-74.0060)');
      }
      
      // Try to get location name for coordinates
      try {
        const NOMINATIM_REVERSE_API = 'https://nominatim.openstreetmap.org/reverse';
        const reverseUrl = `${NOMINATIM_REVERSE_API}?lat=${lat}&lon=${lon}&format=json&addressdetails=1&zoom=10`;
        const reverseData = await this.makeRequest(reverseUrl);
        
        if (reverseData && reverseData.address) {
          const cityName = reverseData.address.city || 
                          reverseData.address.town || 
                          reverseData.address.village || 
                          reverseData.address.county ||
                          reverseData.display_name.split(',')[0] || 
                          'Current Location';
          
          const countryName = reverseData.address.country || 'Unknown';
          const regionName = reverseData.address.state || 
                           reverseData.address.region || 
                           reverseData.address.county || 
                           '';
          
          console.log('Reverse geocoding successful:', { cityName, countryName, regionName });
          
          return {
            lat,
            lon,
            name: cityName,
            country: countryName,
            admin1: regionName
          };
        }
      } catch (error) {
        console.log('Reverse geocoding failed, using coordinates as location name');
        // Continue with coordinate-based location if reverse geocoding fails
      }
      
      // Better fallback: show coordinates instead of "Unknown"
      return { 
        lat, 
        lon, 
        name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`, 
        country: 'Current Location', 
        admin1: '' 
      };
    }

    // Enhanced search with multiple strategies
    const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';
    const searchStrategies = [
      // Primary search with full address details
      `${NOMINATIM_API}?q=${encodeURIComponent(cleanQuery)}&format=json&limit=5&addressdetails=1`,
      // Fallback: city-specific search
      `${NOMINATIM_API}?city=${encodeURIComponent(cleanQuery)}&format=json&limit=3&addressdetails=1`,
      // Fallback: more general search
      `${NOMINATIM_API}?q=${encodeURIComponent(cleanQuery)}&format=json&limit=3`
    ];

    let lastError: Error | null = null;
    
    for (const url of searchStrategies) {
      try {
        const data = await this.makeRequest(url);

        if (!data || data.length === 0) continue;

        // Find the best result based on importance and relevance
        const bestResult = data
          .filter((result: any) => {
            const lat = parseFloat(result.lat);
            const lon = parseFloat(result.lon);
            return !isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
          })
          .sort((a: any, b: any) => {
            // Prioritize by importance, then by exact name match
            const aImportance = a.importance || 0;
            const bImportance = b.importance || 0;
            if (aImportance !== bImportance) return bImportance - aImportance;
            
            const aName = (a.display_name.split(',')[0] || '').toLowerCase();
            const bName = (b.display_name.split(',')[0] || '').toLowerCase();
            const queryLower = cleanQuery.toLowerCase();
            
            if (aName === queryLower && bName !== queryLower) return -1;
            if (bName === queryLower && aName !== queryLower) return 1;
            
            return 0;
          })[0];

        if (bestResult) {
          const lat = parseFloat(bestResult.lat);
          const lon = parseFloat(bestResult.lon);
          
          return {
            lat,
            lon,
            name: bestResult.display_name.split(',')[0],
            country: bestResult.address.country || 'Unknown',
            admin1: bestResult.address.state || bestResult.address.region || bestResult.address.county || 'Unknown'
          };
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown geocoding error');
        continue;
      }
    }

    if (lastError) {
      throw new Error(`Location search failed: ${lastError.message}`);
    }
    
    throw new Error(`No location found for "${cleanQuery}". Try a more specific search or check spelling.`);
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
    // Using Lucide React icon names instead of emojis
    const iconMap: Record<number, string> = {
      0: isDay ? 'sun' : 'moon', 1: 'sun', 2: 'cloud-sun', 3: 'cloud',
      45: 'cloud-fog', 48: 'cloud-fog', 51: 'cloud-drizzle', 53: 'cloud-drizzle', 55: 'cloud-drizzle',
      61: 'cloud-rain', 63: 'cloud-rain', 65: 'cloud-rain', 71: 'cloud-snow', 73: 'cloud-snow', 75: 'cloud-snow',
      80: 'cloud-drizzle', 81: 'cloud-drizzle', 82: 'cloud-drizzle', 95: 'cloud-lightning', 96: 'cloud-lightning', 99: 'cloud-lightning'
    };
    return iconMap[code] || 'cloud';
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
        totalsnow_cm: 0,
        avgvis_km: this.FALLBACK_VIS_KM,
        avgvis_miles: this.FALLBACK_VIS_MILES,
        avghumidity: this.FALLBACK_HUMIDITY,
        daily_will_it_rain: daily.precipitation_sum[index] > 0 ? 1 : 0,
        daily_chance_of_rain: this.calculateRainChance(daily.precipitation_sum[index], daily.weathercode[index]),
        daily_will_it_snow: 0,
        daily_chance_of_snow: 0,
        condition: {
          text: this.wmoToText(daily.weathercode[index]),
          icon: this.getWeatherIcon(daily.weathercode[index]),
          code: daily.weathercode[index]
        },
        uv: daily.uv_index_max?.[index] ?? this.FALLBACK_UV
      },
      astro: {
        sunrise: daily.sunrise?.[index] || '06:00',
        sunset: daily.sunset?.[index] || '18:00',
        moonrise: '00:00',
        moonset: '00:00',
        moon_phase: 'New Moon',
        moon_illumination: '0'
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
  relativehumidity_2m?: number[];
  pressure_msl?: number[];
  visibility?: number[];
  uv_index?: number[];
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
    wind_degree: hourly.winddirection_10m[index],
    precip_mm: Math.round(hourly.precipitation[index] * 10) / 10,
    precip_in: Math.round((hourly.precipitation[index] / 25.4) * 100) / 100,
    chance_of_rain: this.calculateRainChance(hourly.precipitation[index], hourly.weathercode[index]),
    feelslike_c: Math.round(hourly.apparent_temperature[index] * 10) / 10,
    feelslike_f: this.celsiusToFahrenheit(hourly.apparent_temperature[index]),
    humidity: hourly.relativehumidity_2m?.[index] ?? this.FALLBACK_HUMIDITY,
    pressure_mb: hourly.pressure_msl?.[index] ?? this.FALLBACK_PRESSURE_MB,
    pressure_in: Math.round(((hourly.pressure_msl?.[index] ?? this.FALLBACK_PRESSURE_MB) / 33.864) * 100) / 100,
    vis_km: hourly.visibility?.[index] ?? this.FALLBACK_VIS_KM,
    vis_miles: Math.round(((hourly.visibility?.[index] ?? this.FALLBACK_VIS_KM) / 1.609) * 100) / 100,
    uv: hourly.uv_index?.[index] ?? this.FALLBACK_UV,
    gust_mph: this.msToMph(hourly.windspeed_10m[index]),
    gust_kph: this.msToKmph(hourly.windspeed_10m[index])
  }));
}
  // --- Main forecast fetch ---
  public async getForecastWeather(query: string, days: number = 7): Promise<WeatherData> {
    const cacheKey = this.getCacheKey(query, days);
    const cached = this.cache.get(cacheKey);
    
    // Clear cache if it contains "Unknown" location data to force refresh
    if (cached && cached.data.location && 
        (cached.data.location.country === 'Unknown' || cached.data.location.name === 'Unknown')) {
      console.log('Clearing cache with Unknown location data for query:', query);
      this.cache.delete(cacheKey);
    }
    
    if (cached && this.isValidCache(cached.timestamp)) return cached.data;

    const location = await this.geocode(query);
    const { lat, lon, name, country } = location;
    
    // Debug logging to see what we get from geocoding
    console.log('Geocoded location:', { name, country, lat, lon });

    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      current_weather: 'true',
      hourly: 'temperature_2m,weathercode,apparent_temperature,precipitation,windspeed_10m,winddirection_10m,is_day,relativehumidity_2m,pressure_msl,visibility,uv_index',
      daily: 'temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,wind_speed_10m_max,wind_direction_10m_dominant,sunrise,sunset,uv_index_max,precipitation_hours',
      timezone: 'auto',
      forecast_days: days.toString()
    });

    const data = await this.makeRequest(`${OM_FORECAST}?${params.toString()}`);

    const weatherData: WeatherData = {
      location: { 
        name: name || 'Current Location', 
        country: country || 'Current Location', 
        lat, 
        lon 
      },
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
        pressure_mb: data.hourly?.pressure_msl?.[0] ?? this.FALLBACK_PRESSURE_MB,
        pressure_in: Math.round(((data.hourly?.pressure_msl?.[0] ?? this.FALLBACK_PRESSURE_MB) / 33.864) * 100) / 100,
        precip_mm: data.current_weather.precipitation ?? 0,
        precip_in: Math.round((data.current_weather.precipitation ?? 0) / 25.4 * 100) / 100,
        humidity: data.hourly?.relativehumidity_2m?.[0] ?? this.FALLBACK_HUMIDITY,
        cloud: this.FALLBACK_CLOUD,
        feelslike_c: Math.round(data.current_weather.apparent_temperature * 10) / 10,
        feelslike_f: this.celsiusToFahrenheit(data.current_weather.apparent_temperature),
        vis_km: data.hourly?.visibility?.[0] ?? this.FALLBACK_VIS_KM,
        vis_miles: Math.round(((data.hourly?.visibility?.[0] ?? this.FALLBACK_VIS_KM) / 1.609) * 100) / 100,
        uv: data.hourly?.uv_index?.[0] ?? this.FALLBACK_UV,
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
            
            // Skip loading cache with "Unknown" location data
            if (data.location && 
                (data.location.country === 'Unknown' || data.location.name === 'Unknown')) {
              console.log('Skipping cache with Unknown location:', k);
              localStorage.removeItem(k);
              return;
            }
            
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
    
    const cleanQuery = query.trim();
    
    // Check if it's coordinates first
    const coordMatch = cleanQuery.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lon = parseFloat(coordMatch[3]);
      
      if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        return [];
      }
      
      // Reverse geocode to get location name for coordinates
      try {
        const NOMINATIM_REVERSE_API = 'https://nominatim.openstreetmap.org/reverse';
        const reverseUrl = `${NOMINATIM_REVERSE_API}?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
        const reverseData = await this.makeRequest(reverseUrl);
        
        if (reverseData && reverseData.address) {
          return [{
            id: `${lat},${lon}`,
            name: reverseData.display_name.split(',')[0] || 'Unknown Location',
            region: reverseData.address.state || reverseData.address.region || reverseData.address.county || '',
            country: reverseData.address.country || 'Unknown',
            lat,
            lon
          }];
        }
      } catch (error) {
        // If reverse geocoding fails, still return coordinate result
      }
      
      return [{
        id: `${lat},${lon}`,
        name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        region: '',
        country: 'Coordinates',
        lat,
        lon
      }];
    }
    
    const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';
    const url = `${NOMINATIM_API}?q=${encodeURIComponent(cleanQuery)}&format=json&limit=5&addressdetails=1`;
    const data = await this.makeRequest(url);

    if (!data || data.length === 0) return [];

    return data.map((result: any) => {
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);
      
      if (isNaN(lat) || isNaN(lon)) {
        return null;
      }
      
      return {
        id: `${lat},${lon}`,
        name: result.display_name.split(',')[0],
        region: result.address.state || result.address.region || result.address.county || '',
        country: result.address.country,
        lat,
        lon,
        importance: result.importance || 0,
        class: result.class || '',
        type: result.type || ''
      };
    }).filter(Boolean).sort((a: any, b: any) => (b.importance || 0) - (a.importance || 0));
  }
}

export const weatherApi = WeatherApiService.getInstance();
