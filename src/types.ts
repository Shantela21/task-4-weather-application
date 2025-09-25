export type Coord = { lat: number; lon: number };

export type WeatherCurrent = {
  temp: number;
  humidity: number;
  wind_speed: number;
  description?: string;
  dt?: number;
};

export type HourlyForecast = {
  dt: number;
  temp: number;
  humidity: number;
  wind_speed: number;
};

export type DailyForecast = {
  dt: number;
  temp: { min: number; max: number };
  humidity: number;
  wind_speed: number;
  description?: string;
};

export type WeatherResponse = {
  current: WeatherCurrent;
  hourly?: HourlyForecast[];
  daily?: DailyForecast[];
  alerts?: any; // depends on API; keep generic for assignment
};
