import React, { useEffect, useMemo, useState } from 'react';
import { weatherApi } from '../services/WeatherApi';
import { useWeather } from '../context/WeatherContext';

import { type SavedLocation } from '../types/weather';
import { Search } from 'lucide-react';

const SearchBar: React.FC = () => {
  const { dispatch } = useWeather();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      const data = await weatherApi.searchLocations(query.trim());
      setResults(data);
      setLoading(false);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  const onSelect = (item: any) => {
    const location: SavedLocation = {
      id: `${item.id ?? `${item.lat},${item.lon}`}`,
      name: `${item.name}${item.region ? `, ${item.region}` : ''}`,
      country: item.country,
      lat: item.lat,
      lon: item.lon,
    };
    dispatch({ type: 'ADD_SAVED_LOCATION', payload: location });
    dispatch({ type: 'SET_SELECTED_LOCATION', payload: location });
    setQuery('');
    setResults([]);
  };

  const showList = useMemo(() => results.length > 0 && query.length >= 2, [results, query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 2) return;
    setLoading(true);
    try {
      // Prefer existing debounce results; otherwise search now
      const data = results.length ? results : await weatherApi.searchLocations(q);
      if (data && data.length) {
        onSelect(data[0]);
      } else {
        // Enhanced fallback: try multiple approaches
        try {
          // Try direct forecast first
          const wx = await weatherApi.getForecastWeather(q, 7);
          const loc: SavedLocation = {
            id: `${wx.location.lat},${wx.location.lon}`,
            name: wx.location.name,
            country: wx.location.country,
            lat: wx.location.lat,
            lon: wx.location.lon,
          };
          dispatch({ type: 'ADD_SAVED_LOCATION', payload: loc });
          dispatch({ type: 'SET_SELECTED_LOCATION', payload: loc });
          dispatch({ type: 'SET_CURRENT_WEATHER', payload: wx });
        } catch (forecastError) {
          // If forecast fails, try coordinate parsing
          const coordMatch = q.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
          if (coordMatch) {
            const lat = parseFloat(coordMatch[1]);
            const lon = parseFloat(coordMatch[3]);
            
            if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
              const loc: SavedLocation = {
                id: `${lat},${lon}`,
                name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
                country: 'Coordinates',
                lat,
                lon,
              };
              dispatch({ type: 'ADD_SAVED_LOCATION', payload: loc });
              dispatch({ type: 'SET_SELECTED_LOCATION', payload: loc });
              
              // Try to get weather for these coordinates
              try {
                const wx = await weatherApi.getForecastWeather(`${lat},${lon}`, 7);
                dispatch({ type: 'SET_CURRENT_WEATHER', payload: wx });
              } catch (weatherError) {
                // Even if weather fails, we've set the location
              }
            } else {
              throw new Error('Invalid coordinates format');
            }
          } else {
            throw new Error('Location not found');
          }
        }
        setQuery('');
        setResults([]);
      }
    } catch (error) {
      // Enhanced error handling
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      console.error('Location search error:', errorMessage);
      // You could add user notification here
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="searchbar">
      <form className="searchbar__form" onSubmit={handleSubmit}>
        <div className="searchbar__inputwrap">
          <Search className="searchbar__icon" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search city or place..."
            className="searchbar__input"
          />
        </div>
        <button type="submit" className="searchbar__button" aria-label="Search">
          Search
        </button>
      </form>
      {showList && (
        <div className="searchbar__results">
          {loading && <div className="searchbar__results-status">Searching...</div>}
          {!loading && results.map((item) => (
            <button
              key={`${item.id ?? `${item.lat},${item.lon}`}`}
              onClick={() => onSelect(item)}
              className="searchbar__result"
            >
              <div className="searchbar__result-title">{item.name}{item.region ? `, ${item.region}` : ''}</div>
              <div className="searchbar__result-sub">{item.country}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
