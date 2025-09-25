import React, { useEffect, useState } from "react";
import LocationList from "./components/LocationList";
import type { SavedLoc } from "./components/LocationList";
import WeatherCard from "./components/WeatherCard";
import { getCurrentPosition } from "./utils/Geolocation";
import { useWeather } from "./hooks/useWeather";
import LocationSearch from "./components/LocatonSearch"; // Make sure file name is correct
import { TbBackground } from "react-icons/tb";
import { BiColor } from "react-icons/bi";


type ViewMode = "hourly" | "daily";

const LOCS_KEY = "saved_locations_v1";
const SELECTED_LOC_KEY = "selected_location_v1";

function loadSaved(): SavedLoc[] {
  try {
    return JSON.parse(localStorage.getItem(LOCS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveSaved(list: SavedLoc[]) {
  localStorage.setItem(LOCS_KEY, JSON.stringify(list));
}

export default function App() {
  const [saved, setSaved] = useState<SavedLoc[]>(() => loadSaved());
  const [selected, setSelected] = useState<SavedLoc | null>(() => {
    try {
      return JSON.parse(localStorage.getItem(SELECTED_LOC_KEY) || "null");
    } catch {
      return null;
    }
  });
  const [units, setUnits] = useState<"metric" | "imperial">(
    () => (localStorage.getItem("units") as any) || "metric"
  );
  const [view, setView] = useState<ViewMode>("daily");
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("theme") as any) || "light"
  );
  const [queryLoading, setQueryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Geolocation
  useEffect(() => {
    if (selected) return;
    getCurrentPosition()
      .then((pos) => {
        const loc: SavedLoc = {
          id: "me",
          name: "Current location",
          lat: pos.lat,
          lon: pos.lon,
        };
        setSelected(loc);
        localStorage.setItem(SELECTED_LOC_KEY, JSON.stringify(loc));
      })
      .catch(() => {});
  }, [selected]);

  const coord = selected ? { lat: selected.lat, lon: selected.lon } : undefined;
  const { data, loading, error: weatherError } = useWeather(coord, units);

  useEffect(() => {
    if (weatherError) setError(weatherError);
  }, [weatherError]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document
      .querySelector(".weather-app")
      ?.classList.toggle("dark-theme", theme === "dark");
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("units", units);
  }, [units]);

  useEffect(() => {
    saveSaved(saved);
  }, [saved]);

  useEffect(() => {
    if (!data) return;
    const severe =
      (data.alerts && data.alerts.length > 0) ||
      Math.abs(data.current.temp) > (units === "metric" ? 40 : 104);
    if (severe && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("Severe weather alert", {
          body: "Severe conditions detected in your selected location.",
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((p) => {
          if (p === "granted")
            new Notification("Severe weather alert", {
              body: "Severe conditions detected.",
            });
        });
      }
    }
  }, [data, units]);

  async function handleSearch(q: string) {
    setError(null);
    setQueryLoading(true);
    try {
      // Lat,lon input
      if (/^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/.test(q)) {
        const [lat, lon] = q.split(",").map((s) => parseFloat(s.trim()));
        const loc: SavedLoc = {
          id: `${lat}_${lon}`,
          name: `Search: ${lat.toFixed(2)},${lon.toFixed(2)}`,
          lat,
          lon,
        };
        setSelected(loc);
        localStorage.setItem(SELECTED_LOC_KEY, JSON.stringify(loc));
        setQueryLoading(false);
        return;
      }

      // Geocoding via OpenStreetMap
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        q
      )}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to geocode query");
      const results = await res.json();
      if (!Array.isArray(results) || results.length === 0)
        throw new Error("Location not found");

      const first = results[0];
      const lat = parseFloat(first.lat);
      const lon = parseFloat(first.lon);
      const loc: SavedLoc = {
        id: `${lat}_${lon}`,
        name: first.display_name || q,
        lat,
        lon,
      };
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
    if (saved.find((s) => s.id === selected.id)) return;
    setSaved([...saved, { ...selected, id: `${selected.lat}_${selected.lon}_${Date.now()}` }]);
  }

  function handleDelete(id: string) {
    setSaved(saved.filter((s) => s.id !== id));
  }

  function handleSelect(s: SavedLoc) {
    setSelected(s);
    localStorage.setItem(SELECTED_LOC_KEY, JSON.stringify(s));
  }

  return (
    <div className="weather-app">
      <header className="weather-header">
        <h1 className="app-title">Weather App</h1>
        <div className="header-controls">
          <select
            value={units}
            onChange={(e) => setUnits(e.target.value as any)}
            className="unit-selector"
          >
            <option value="metric">Celsius</option>
            <option value="imperial">Fahrenheit</option>
          </select>
          <button
            onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
            className="theme-toggle"
          >
            {theme === "light" ? "Dark" : "Light"}
          </button>
        </div>
      </header>

      <main className="weather-main">
        <aside className="sidebar">
          <LocationSearch
  onLocationSelect={handleSearch} // map selection to your existing search handler
  selectedLocation={selected ? selected.name : ""} // pass the current selected location
/>

          <div className="sidebar-controls">
            <button onClick={handleSaveCurrent} className="save-btn">
              Save current
            </button>
            <LocationList
              saved={saved}
              onSelect={handleSelect}
              onDelete={handleDelete}
            />
            <div className="view-selector">
              <h3>View</h3>
              <div className="view-buttons">
                <button
                  onClick={() => setView("daily")}
                  className={view === "daily" ? "active" : ""}
                >
                  Daily
                </button>
                <button
                  onClick={() => setView("hourly")}
                  className={view === "hourly" ? "active" : ""}
                >
                  Hourly
                </button>
              </div>
            </div>
          </div>
        </aside>

        <section className="weather-content">
          <div className="location-header">
            <h2>{selected ? selected.name : "No location selected"}</h2>
            <span className="loading-text">
              {loading || queryLoading ? "Loading..." : ""}
            </span>
          </div>

          {error && <div className="error-msg">{error}</div>}

          <WeatherCard weather={data} units={units} view={view} />
        </section>
      </main>

      <footer className="app-footer" style={{maxWidth: "1024px",
  margin: "32px auto 0 auto",
  fontSize: "0.875rem",
  color: "black", background:"#6b7280"}}>
        <div >
          Local storage is used to save preferences and locations. For real push
          notifications a server and push subscription are required.
        </div>
      </footer>
    </div>
  );
} 
