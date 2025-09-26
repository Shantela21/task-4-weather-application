import { useEffect, useState, useRef } from "react";
import type { Coord, WeatherResponse } from "../utils/notifications"; // prefer no .ts extension

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const RAPIDAPI_HOST = import.meta.env.VITE_RAPIDAPI_HOST;

function cacheKeyForCoord(lat: number, lon: number) {
  return `weather_cache_${lat.toFixed(3)}_${lon.toFixed(3)}`;
}

export function useWeather(coord?: Coord, units: "metric" | "imperial" = "metric") {
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attemptRef = useRef<number>(0);

  useEffect(() => {
    if (!coord) return;
    // ← guard ensures coord exists; destructure so TS knows lat/lon are defined
    const { lat, lon } = coord;

    let cancelled = false;

    async function fetchWithRetry() {
      setLoading(true);
      setError(null);

      const cacheKey = cacheKeyForCoord(lat, lon);
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        try {
          const parsed = JSON.parse(cached) as { ts: number; payload: WeatherResponse };
          if (Date.now() - parsed.ts < 1000 * 60 * 30) setData(parsed.payload);
        } catch {}
      }

      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        units,
      });

      const url = `https://${RAPIDAPI_HOST}/onecall?${params.toString()}`;
      attemptRef.current = 0;

      while (!cancelled) {
        try {
          attemptRef.current++;
          const res = await fetch(url, {
            headers: {
              "X-RapidAPI-Key": RAPIDAPI_KEY,
              "X-RapidAPI-Host": RAPIDAPI_HOST,
            },
          });

          if (res.status === 429) {
            if (attemptRef.current > 4) throw new Error("Rate limited. Try again later.");
            await new Promise(r => setTimeout(r, 500 * Math.pow(2, attemptRef.current)));
            continue;
          }

          if (!res.ok) throw new Error(`Weather request failed: ${res.statusText}`);

          const payload = (await res.json()) as WeatherResponse;
          if (cancelled) return;
          setData(payload);
          localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), payload }));
          setLoading(false);
          return;
        } catch (err: any) {
          if (attemptRef.current >= 4 && cached) {
            try {
              const parsed = JSON.parse(cached) as { ts: number; payload: WeatherResponse };
              setData(parsed.payload);
              setError("Using cached data due to network/rate issues.");
              setLoading(false);
              return;
            } catch {}
          }
          setError(err.message ?? String(err));
          setLoading(false);
          return;
        }
      }
    }

    fetchWithRetry();
    return () => { cancelled = true; };
  }, [coord?.lat, coord?.lon, units]);

  return { data, loading, error };
}
