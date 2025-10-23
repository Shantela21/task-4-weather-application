import React from 'react';
import { type WeatherAlert, type WeatherData } from '../types/weather';
import { useWeather } from '../context/WeatherContext';
import { Wind, Droplets, Sun, Moon, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning } from 'lucide-react';

interface Props {
  data: WeatherData;
}

const getWeatherIcon = (iconName: string) => {
  const iconMap: Record<string, React.ComponentType<any>> = {
    sun: Sun,
    moon: Moon,
    'cloud-sun': CloudSun,
    cloud: Cloud,
    'cloud-fog': CloudFog,
    'cloud-drizzle': CloudDrizzle,
    'cloud-rain': CloudRain,
    'cloud-snow': CloudSnow,
    'cloud-lightning': CloudLightning
  };
  const IconComponent = iconMap[iconName] || Cloud;
  return <IconComponent className="summary__icon" />;
};

const WeatherSummary: React.FC<Props> = ({ data }) => {
  const { state } = useWeather();
  const temp = state.temperatureUnit === 'celsius' ? `${Math.round(data.current.temp_c)}°C` : `${Math.round(data.current.temp_f)}°F`;

  return (
    <div className="summary">
      <div className="summary__top">
        <div>
          <div className="summary__title">{data.location.name}</div>
          <div className="summary__subtitle">{data.location.country}</div>
        </div>
        {getWeatherIcon(data.current.condition.icon)}
      </div>
      <div className="summary__mid">
        <div className="summary__temp">{temp}</div>
        <div className="summary__cond">{data.current.condition.text}</div>
      </div>
      <div className="summary__meta">
        <div className="summary__meta-item">
          <Droplets className="summary__meta-icon" />
          Humidity: {data.current.humidity}%
        </div>
        <div className="summary__meta-item">
          <Wind className="summary__meta-icon" />
          Wind: {state.temperatureUnit === 'celsius' ? `${data.current.wind_kph} kph` : `${data.current.wind_mph} mph`}
        </div>
        <div className="summary__meta-item">Feels like: {state.temperatureUnit === 'celsius' ? `${Math.round(data.current.feelslike_c)}°C` : `${Math.round(data.current.feelslike_f)}°F`}</div>
      </div>
    </div>
  );
};

export default WeatherSummary;
