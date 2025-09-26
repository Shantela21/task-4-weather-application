import type { WeatherData } from '../types/weather';

// Switched to Open-Meteo (no API key required)
const OM_FORECAST = 'https://api.open-meteo.com/v1/forecast';
const OM_GEOCODE = 'https://geocoding-api.open-meteo.com/v1/search';
const OM_WARNINGS = 'https://api.open-meteo.com/v1/warnings';

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
    return `${query}_${days}`;
  }

  private isValidCache(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  private async makeJson(url: string): Promise<any> {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Weather service error: ${res.status}`);
    }
    return res.json();
  }

  private async geocode(query: string): Promise<{ name: string; country: string; lat: number; lon: number; admin1?: string }[]> {
    const url = `${OM_GEOCODE}?name=${encodeURIComponent(query)}&count=10&language=en&format=json`;
    const data = await this.makeJson(url);
    const results = (data?.results ?? []).map((r: any) => ({
      name: r.name,
      country: r.country,
      lat: r.latitude,
      lon: r.longitude,
      admin1: r.admin1,
    }));
    return results;
  }

  private async reverseGeocode(lat: number, lon: number): Promise<{ name: string; country: string; admin1?: string } | null> {
    const url = `${OM_GEOCODE.replace('/search', '/reverse')}?latitude=${lat}&longitude=${lon}&language=en&format=json`;
    const data = await this.makeJson(url);
    const r = data?.results?.[0];
    if (!r) return null;
    return { name: r.name, country: r.country, admin1: r.admin1 };
  }

  private wmoToText(code: number): string {
    // Minimal WMO code mapping
    const map: Record<number, string> = {
      0: 'Clear sky',
      1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
      45: 'Fog', 48: 'Depositing rime fog',
      51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
      61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
      71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
      80: 'Rain showers', 81: 'Rain showers', 82: 'Violent rain showers',
      95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail',
    };
    return map[code] ?? 'Unknown';
  }

  private px(): string {
    // Transparent pixel placeholder for icons
    return 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
  }

  public async getCurrentWeather(query: string): Promise<WeatherData> {
    // Delegate to forecast which includes current
    return this.getForecastWeather(query, 7);
  }

  public async getForecastWeather(query: string, days: number = 7): Promise<WeatherData> {
    const cacheKey = this.getCacheKey(query, days);
    const cached = this.cache.get(cacheKey);
    if (cached && this.isValidCache(cached.timestamp)) return cached.data;

    let lat: number | null = null;
    let lon: number | null = null;
    let name = '';
    let country = '';

    // Accept "lat,lon" or place name
    const parts = query.split(',').map(s => s.trim());
    if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
      lat = Number(parts[0]);
      lon = Number(parts[1]);
      // Try to get a friendly name for coordinates
      const rev = await this.reverseGeocode(lat, lon);
      name = rev ? rev.name + (rev.admin1 ? `, ${rev.admin1}` : '') : 'Current Location';
      country = rev?.country ?? '';
    } else {
      const results = await this.geocode(query);
      if (!results.length) throw new Error('Invalid location. Please check the location name.');
      lat = results[0].lat;
      lon = results[0].lon;
      name = results[0].name + (results[0].admin1 ? `, ${results[0].admin1}` : '');
      country = results[0].country;
    }

    const params = new URLSearchParams({
      latitude: String(lat!),
      longitude: String(lon!),
      current: [
        'temperature_2m',
        'relative_humidity_2m',
        'apparent_temperature',
        'wind_speed_10m',
        'wind_direction_10m',
        'weather_code'
      ].join(','),
      hourly: [
        'temperature_2m',
        'relative_humidity_2m',
        'apparent_temperature',
        'precipitation',
        'weather_code',
        'wind_speed_10m',
        'wind_direction_10m'
      ].join(','),
      daily: [
        'temperature_2m_max',
        'temperature_2m_min',
        'precipitation_sum',
        'weather_code',
        'uv_index_max'
      ].join(','),
      timezone: 'auto'
    });

    const url = `${OM_FORECAST}?${params.toString()}`;
    const data = await this.makeJson(url);

    // Map Open-Meteo response to our WeatherData shape
    const current = data.current;
    const hourly = data.hourly;
    const daily = data.daily;

    const kmph = (ms: number) => ms * 3.6;
    const mph = (ms: number) => ms * 2.236936;
    const f = (c: number) => (c * 9) / 5 + 32;

    const now: WeatherData['current'] = {
      temp_c: current.temperature_2m,
      temp_f: f(current.temperature_2m),
      condition: {
        text: this.wmoToText(current.weather_code),
        icon: this.px(),
        code: current.weather_code,
      },
      wind_mph: mph(current.wind_speed_10m),
      wind_kph: kmph(current.wind_speed_10m),
      wind_dir: String(current.wind_direction_10m),
      pressure_mb: 0,
      pressure_in: 0,
      precip_mm: hourly?.precipitation?.[0] ?? 0,
      precip_in: (hourly?.precipitation?.[0] ?? 0) / 25.4,
      humidity: current.relative_humidity_2m,
      cloud: 0,
      feelslike_c: current.apparent_temperature,
      feelslike_f: f(current.apparent_temperature),
      vis_km: 0,
      vis_miles: 0,
      uv: daily?.uv_index_max?.[0] ?? 0,
      gust_mph: mph(current.wind_speed_10m),
      gust_kph: kmph(current.wind_speed_10m),
    };

    const forecastday = (daily.time || []).map((dateStr: string, idx: number) => {
      // Build hours for this date (filter hourly arrays by date)
      const dayHours: any[] = [];
      if (hourly?.time) {
        for (let i = 0; i < hourly.time.length; i++) {
          const t = hourly.time[i];
          if (t.startsWith(dateStr)) {
            const tc = hourly.temperature_2m[i];
            dayHours.push({
              time_epoch: Math.floor(new Date(t).getTime() / 1000),
              time: t,
              temp_c: tc,
              temp_f: f(tc),
              is_day: 1,
              condition: {
                text: this.wmoToText(hourly.weather_code[i]),
                icon: this.px(),
                code: hourly.weather_code[i],
              },
              wind_mph: mph(hourly.wind_speed_10m[i]),
              wind_kph: kmph(hourly.wind_speed_10m[i]),
              wind_dir: String(hourly.wind_direction_10m[i]),
              wind_degree: hourly.wind_direction_10m[i],
              pressure_mb: 0,
              pressure_in: 0,
              precip_mm: hourly.precipitation[i],
              precip_in: hourly.precipitation[i] / 25.4,
              humidity: hourly.relative_humidity_2m[i],
              cloud: 0,
              feelslike_c: hourly.apparent_temperature[i],
              feelslike_f: f(hourly.apparent_temperature[i]),
              windchill_c: hourly.apparent_temperature[i],
              windchill_f: f(hourly.apparent_temperature[i]),
              heatindex_c: hourly.apparent_temperature[i],
              heatindex_f: f(hourly.apparent_temperature[i]),
              dewpoint_c: 0,
              dewpoint_f: 0,
              will_it_rain: 0,
              chance_of_rain: Math.round(Math.min(100, hourly.precipitation[i] * 10)),
              will_it_snow: 0,
              chance_of_snow: 0,
              vis_km: 0,
              vis_miles: 0,
              gust_mph: mph(hourly.wind_speed_10m[i]),
              gust_kph: kmph(hourly.wind_speed_10m[i]),
              uv: 0,
            });
          }
        }
      }

      return {
        date: dateStr,
        date_epoch: Math.floor(new Date(dateStr).getTime() / 1000),
        day: {
          maxtemp_c: daily.temperature_2m_max[idx],
          maxtemp_f: f(daily.temperature_2m_max[idx]),
          mintemp_c: daily.temperature_2m_min[idx],
          mintemp_f: f(daily.temperature_2m_min[idx]),
          avgtemp_c: (daily.temperature_2m_max[idx] + daily.temperature_2m_min[idx]) / 2,
          avgtemp_f: f((daily.temperature_2m_max[idx] + daily.temperature_2m_min[idx]) / 2),
          maxwind_mph: mph(Math.max(...hourly.wind_speed_10m)),
          maxwind_kph: kmph(Math.max(...hourly.wind_speed_10m)),
          totalprecip_mm: daily.precipitation_sum[idx],
          totalprecip_in: daily.precipitation_sum[idx] / 25.4,
          totalsnow_cm: 0,
          avgvis_km: 0,
          avgvis_miles: 0,
          avghumidity: 0,
          daily_will_it_rain: 0,
          daily_chance_of_rain: Math.round(Math.min(100, (daily.precipitation_sum[idx] || 0) * 10)),
          daily_will_it_snow: 0,
          daily_chance_of_snow: 0,
          condition: {
            text: this.wmoToText(daily.weather_code[idx]),
            icon: this.px(),
            code: daily.weather_code[idx],
          },
          uv: daily.uv_index_max?.[idx] ?? 0,
        },
        astro: {
          sunrise: '', sunset: '', moonrise: '', moonset: '', moon_phase: '', moon_illumination: ''
        },
        hour: dayHours,
      };
    });

    // Fetch alerts (if available for region)
    let alerts: any[] = [];
    try {
      const warnUrl = `${OM_WARNINGS}?latitude=${lat}&longitude=${lon}&timezone=auto`;
      const warn = await this.makeJson(warnUrl);
      alerts = (warn?.warnings ?? []).map((a: any, idx: number) => ({
        id: String(a.id ?? idx),
        headline: a.headline ?? a.event ?? 'Weather Warning',
        msgtype: a.event ?? '',
        severity: a.severity ?? '',
        urgency: a.urgency ?? '',
        areas: a.region ?? '',
        category: a.response_type ?? '',
        certainty: a.certainty ?? '',
        event: a.event ?? '',
        note: a.sender ?? '',
        effective: a.onset ?? '',
        expires: a.expires ?? '',
        desc: a.description ?? '',
        instruction: a.instruction ?? ''
      }));
    } catch {
      // ignore warning errors
    }

    const weatherData: WeatherData = {
      location: { name, country, lat: lat!, lon: lon! },
      current: now,
      forecast: { forecastday },
      alerts,
    };

    this.cache.set(cacheKey, { data: weatherData, timestamp: Date.now() });
    this.saveToLocalStorage(cacheKey, weatherData);
    return weatherData;
  }

  public async searchLocations(query: string): Promise<any[]> {
    try {
      const list = await this.geocode(query);
      return list.map((x, i) => ({
        id: `${x.lat},${x.lon}`,
        name: x.name,
        region: x.admin1,
        country: x.country,
        lat: x.lat,
        lon: x.lon,
      }));
    } catch (error) {
      console.error('Location search failed:', error);
      return [];
    }
  }

  private saveToLocalStorage(key: string, data: WeatherData): void {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(`weatherCache_${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save weather data to localStorage:', error);
    }
  }

  public loadFromLocalStorage(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('weatherCache_'));
      
      keys.forEach(key => {
        const cacheKey = key.replace('weatherCache_', '');
        const cached = localStorage.getItem(key);
        
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          this.cache.set(cacheKey, { data, timestamp });
        }
      });
    } catch (error) {
      console.warn('Failed to load weather data from localStorage:', error);
    }
  }

  public clearCache(): void {
    this.cache.clear();
    const keys = Object.keys(localStorage).filter(key => key.startsWith('weatherCache_'));
    keys.forEach(key => localStorage.removeItem(key));
  }
}

export const weatherApi = WeatherApiService.getInstance();
