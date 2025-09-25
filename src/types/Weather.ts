export interface WeatherData {
  location: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  feelsLike: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
  timestamp: number;
}

export interface ForecastDay {
  date: string;
  maxTemp: number;
  minTemp: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
}

export interface ForecastHour {
  time: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
}

export interface Location {
  id: string;
  name: string;
  lat: number;
  lon: number;
  isCurrent: boolean;
}

export interface AppSettings {
  unit: 'celsius' | 'fahrenheit';
  theme: 'light' | 'dark' | 'auto';
}