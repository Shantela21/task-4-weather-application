import React, { useEffect, useState } from "react";
import SearchBar from "./components/SearchBar";
import LocationList from "./components/LocationList";
import type { SavedLoc } from "./components/LocationList";
import WeatherCard from "./components/WeatherCard";
import { getCurrentPosition } from "./utils/Geolocation";
import { useWeather} from "./hooks/useWeather";

type ViewMode = "hourly" | "daily";

const LOCS_KEY = "saved_locations_v1";
const SELECTED_LOC_KEY = "selected_location_v1";

function loadSaved(): SavedLoc[] {
  try {
    return JSON.parse(localStorage.getItem(LOCS_KEY) ?? "[]");
  } catch { return []; }
}

function saveSaved(list: SavedLoc[]) {
  localStorage.setItem(LOCS_KEY, JSON.stringify(list));
}

export default function App() {
  const [saved, setSaved] = useState<SavedLoc[]>(() => loadSaved());
  const [selected, setSelected] = useState<SavedLoc | null>(() => {
    try {
      return JSON.parse(localStorage.getItem(SELECTED_LOC_KEY) || "null");
    } catch { return null; }
  });
  const [units, setUnits] = useState<"metric" | "imperial">(() => localStorage.getItem("units") as any || "metric");
  const [view, setView] = useState<ViewMode>("daily");
  const [theme, setTheme] = useState<"light" | "dark">(() => localStorage.getItem("theme") as any || "light");
  const [queryLoading, setQueryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If no selected location, attempt to detect geolocation
  useEffect(() => {
    if (selected) return;
    getCurrentPosition().then(pos => {
      const loc: SavedLoc = { id: "me", name: "Current location", lat: pos.lat, lon: pos.lon };
      setSelected(loc);
      localStorage.setItem(SELECTED_LOC_KEY, JSON.stringify(loc));
    }).catch(() => {
      // user maybe denied; do nothing
    });
  }, []);

  const coord = selected ? { lat: selected.lat, lon: selected.lon } : undefined;
  const { data, loading, error: weatherError } = useWeather(coord, units);

  useEffect(() => {
    if (weatherError) setError(weatherError);
  }, [weatherError]);

  // Theme persistence
  useEffect(() => {
    localStorage.setItem("theme", theme);
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [theme]);

  // Units persist
  useEffect(() => {
    localStorage.setItem("units", units);
  }, [units]);

  // Saved locations persistence
  useEffect(() => { saveSaved(saved); }, [saved]);

  // Notification simulation: show Notification if "alerts" or extreme temp found
  useEffect(() => {
    if (!data) return;
    // Example logic: if alerts present or current temp is extreme
    const severe = (data.alerts && data.alerts.length > 0) || Math.abs(data.current.temp) > (units === "metric" ? 40 : 104);
    if (severe && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("Severe weather alert", { body: "Severe conditions detected in your selected location." });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((p) => {
          if (p === "granted") new Notification("Severe weather alert", { body: "Severe conditions detected." });
        });
      }
    }
  }, [data, units]);

  // Search handler: perform geocoding (basic) — use the RapidAPI host geocoding if available,
  // otherwise try a simple "lat,lon" parser.
  async function handleSearch(q: string) {
    setError(null);
    setQueryLoading(true);
    try {
      if (/^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/.test(q)) {
        const [lat, lon] = q.split(",").map(s => parseFloat(s.trim()));
        const loc: SavedLoc = { id: `${lat}_${lon}`, name: `Search: ${lat.toFixed(2)},${lon.toFixed(2)}`, lat, lon };
        setSelected(loc);
        localStorage.setItem(SELECTED_LOC_KEY, JSON.stringify(loc));
        setQueryLoading(false);
        return;
      }

      // Basic geocoding via the same RapidAPI provider (if endpoint exists).
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to geocode query");
      const results = await res.json();
      if (!Array.isArray(results) || results.length === 0) {
        throw new Error("Location not found");
      }
      const first = results[0];
      const lat = parseFloat(first.lat);
      const lon = parseFloat(first.lon);
      const loc: SavedLoc = { id: `${lat}_${lon}`, name: first.display_name || q, lat, lon };
      setSelected(loc);
      localStorage.setItem(SELECTED_LOC_KEY, JSON.stringify(loc));
    } catch (err: any) {
      setError(err.message ?? String(err));
    } finally {
      setQueryLoading(false);
    }
  }

  function handleSaveCurrent() {
    if (!selected) return;
    if (saved.find(s => s.id === selected.id)) return;
    const newSaved = [...saved, { ...selected, id: `${selected.lat}_${selected.lon}_${Date.now()}` }];
    setSaved(newSaved);
  }

  function handleDelete(id: string) {
    setSaved(saved.filter(s => s.id !== id));
  }

  function handleSelect(s: SavedLoc) {
    setSelected(s);
    localStorage.setItem(SELECTED_LOC_KEY, JSON.stringify(s));
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Weather App</h1>
        <div className="flex gap-3 items-center">
          <select value={units} onChange={(e) => setUnits(e.target.value as any)} className="p-1 rounded">
            <option value="metric">Celsius</option>
            <option value="imperial">Fahrenheit</option>
          </select>
          <button onClick={() => setTheme(t => t === "light" ? "dark" : "light")} className="px-2 py-1 rounded border">
            {theme === "light" ? "Dark" : "Light"}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
        <aside className="md:col-span-1">
          <SearchBar onSearch={handleSearch} />
          <div className="mt-4 space-y-4">
            <div>
              <button onClick={handleSaveCurrent} className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700">Save current</button>
            </div>

            <LocationList saved={saved} onSelect={handleSelect} onDelete={handleDelete} />
            <div className="mt-4">
              <h3 className="font-semibold">View</h3>
              <div className="mt-2 space-x-2">
                <button onClick={() => setView("daily")} className={`px-2 py-1 rounded ${view === "daily" ? "bg-sky-600 text-white" : "border"}`}>Daily</button>
                <button onClick={() => setView("hourly")} className={`px-2 py-1 rounded ${view === "hourly" ? "bg-sky-600 text-white" : "border"}`}>Hourly</button>
              </div>
            </div>
          </div>
        </aside>

        <section className="md:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">{selected ? selected.name : "No location selected"}</h2>
            <div className="text-sm text-gray-500">{loading || queryLoading ? "Loading..." : ""}</div>
          </div>

          {error && <div className="p-2 bg-red-100 text-red-700 rounded">{error}</div>}

          <WeatherCard weather={data} units={units} view={view} />
        </section>
      </main>

      <footer className="max-w-4xl mx-auto mt-8 text-sm text-gray-500">
        <div>Local storage is used to save preferences and locations. For real push notifications a server and push subscription are required.</div>
      </footer>
    </div>
  );
}
