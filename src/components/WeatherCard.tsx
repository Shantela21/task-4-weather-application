import React from "react";
import type { WeatherResponse } from "../types";

type Props = {
  weather: WeatherResponse | null;
  units: "metric" | "imperial";
  view: "hourly" | "daily";
};

export default function WeatherCard({ weather, units, view }: Props) {
  if (!weather) return <div className="p-4">No weather loaded.</div>;

  const uTemp = units === "metric" ? "°C" : "°F";
  return (
    <div className="p-4 rounded shadow bg-white/80 dark:bg-gray-800/70">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-3xl font-bold">{Math.round(weather.current.temp)}{uTemp}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">{weather.current.description ?? ""}</div>
        </div>
        <div className="text-sm">
          <div>Humidity: {weather.current.humidity}%</div>
          <div>Wind: {weather.current.wind_speed} {units === "metric" ? "m/s" : "mph"}</div>
        </div>
      </div>

      <div className="mt-4">
        {view === "hourly" ? (
          <div className="grid grid-cols-3 gap-2">
            {(weather.hourly ?? []).slice(0, 9).map((h) => (
              <div key={h.dt} className="border p-2 rounded text-center">
                <div className="text-sm">{new Date(h.dt * 1000).getHours()}:00</div>
                <div className="font-semibold">{Math.round(h.temp)}{uTemp}</div>
                <div className="text-xs">Hum {h.humidity}%</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {(weather.daily ?? []).slice(0, 7).map((d) => (
              <div key={d.dt} className="border p-2 rounded">
                <div className="font-semibold">{new Date(d.dt * 1000).toLocaleDateString()}</div>
                <div>Min: {Math.round(d.temp.min)}{uTemp} — Max: {Math.round(d.temp.max)}{uTemp}</div>
                <div className="text-xs">Hum {d.humidity}%</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
