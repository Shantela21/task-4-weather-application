import React from 'react';
import { ForecastDay, WeatherData } from '../types/weather';
import { useWeather } from '../context/WeatherContext';

interface Props {
  data: WeatherData;
}

const DailyCard: React.FC<{ day: ForecastDay }> = ({ day }) => {
  const { state } = useWeather();
  const max = state.temperatureUnit === 'celsius' ? Math.round(day.day.maxtemp_c) + '°C' : Math.round(day.day.maxtemp_f) + '°F';
  const min = state.temperatureUnit === 'celsius' ? Math.round(day.day.mintemp_c) + '°C' : Math.round(day.day.mintemp_f) + '°F';
  const date = new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="daily__card">
      <div className="daily__date">{date}</div>
      <div className="daily__cond">
        <img src={day.day.condition.icon} alt={day.day.condition.text} className="daily__icon" />
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
