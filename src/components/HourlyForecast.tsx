
import React from 'react';

import { type WeatherData } from '../types/weather';
import { useWeather } from '../context/WeatherContext';

interface Props {
  data: WeatherData;
}

const HourlyForecast: React.FC<Props> = ({ data }) => {
  const { state } = useWeather();
  const hours = data.forecast?.forecastday?.[0]?.hour ?? [];

  return (
    <div className="hourly">
      <div className="hourly__grid">
        {hours.map((h) => {
          const temp = state.temperatureUnit === 'celsius' ? Math.round(h.temp_c) + '°C' : Math.round(h.temp_f) + '°F';
          const time = new Date(h.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return (
            <div key={h.time_epoch} className="hourly__card">
              <div className="hourly__time">{time}</div>
              <img src={h.condition.icon} alt={h.condition.text} className="hourly__icon" />
              <div className="hourly__temp">{temp}</div>
              <div className="hourly__rain">{h.chance_of_rain}% rain</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HourlyForecast;
