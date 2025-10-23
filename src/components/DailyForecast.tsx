import React from 'react';
import { type ForecastDay, type WeatherData } from '../types/weather';
import { useWeather } from '../context/WeatherContext';
import { Sun, Moon, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning } from 'lucide-react';

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
  return <IconComponent className="daily__icon" />;
};

const DailyCard: React.FC<{ day: ForecastDay }> = ({ day }) => {
  const { state } = useWeather();
  const max = state.temperatureUnit === 'celsius' ? Math.round(day.day.maxtemp_c) + '°C' : Math.round(day.day.maxtemp_f) + '°F';
  const min = state.temperatureUnit === 'celsius' ? Math.round(day.day.mintemp_c) + '°C' : Math.round(day.day.mintemp_f) + '°F';
  const date = new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="daily__card" >
      <div className="daily__date">{date}</div>
      <div className="daily__cond">
        {getWeatherIcon(day.day.condition.icon)}
        <div className="daily__cond-text">{day.day.condition.text}</div>
      </div>
      <div className="daily__rain">Rain: {day.day.daily_chance_of_rain}%</div>
      <div className="daily__max">{max}</div>
      <div className="daily__min">{min}</div>
    </div>
  );
};


const DailyForecast: React.FC<Props> = ({ data }) => {
  const days = data.forecast?.forecastday ?? [];
  return (
    <div className="daily">
      {days.map((d) => (
        <DailyCard key={d.date_epoch} day={d} />
      ))}
    </div>
  );
};

export default DailyForecast;
