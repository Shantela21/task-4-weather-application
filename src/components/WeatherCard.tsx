import React from "react";
import type { WeatherResponse } from "../types";

type Props = {
  weather: WeatherResponse | null;
  units: "metric" | "imperial";
  view: "hourly" | "daily";
};

export default function WeatherCard({ weather, units, view }: Props) {
  if (!weather) return <div className="weathercard-empty">No weather loaded.</div>;

  const uTemp = units === "metric" ? "°C" : "°F";

  return (
    <div className="weathercard-container">
      <div className="weathercard-header">
        <div className="weathercard-current">
          <div className="weathercard-temp">{Math.round(weather.current.temp)}{uTemp}</div>
          <div className="weathercard-description">{weather.current.description ?? ""}</div>
        </div>
        <div className="weathercard-details">
          <div>Humidity: {weather.current.humidity}%</div>
          <div>Wind: {weather.current.wind_speed} {units === "metric" ? "m/s" : "mph"}</div>
        </div>
      </div>

      <div className="weathercard-forecast">
        {view === "hourly" ? (
          <div className="weathercard-hourly">
            {(weather.hourly ?? []).slice(0, 9).map((h) => (
              <div key={h.dt} className="weathercard-hour">
                <div className="weathercard-hour-time">{new Date(h.dt * 1000).getHours()}:00</div>
                <div className="weathercard-hour-temp">{Math.round(h.temp)}{uTemp}</div>
                <div className="weathercard-hour-hum">Hum {h.humidity}%</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="weathercard-daily">
            {(weather.daily ?? []).slice(0, 7).map((d) => (
              <div key={d.dt} className="weathercard-day">
                <div className="weathercard-day-date">{new Date(d.dt * 1000).toLocaleDateString()}</div>
                <div className="weathercard-day-temp">
                  Min: {Math.round(d.temp.min)}{uTemp} — Max: {Math.round(d.temp.max)}{uTemp}
                </div>
                <div className="weathercard-day-hum">Hum {d.humidity}%</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
