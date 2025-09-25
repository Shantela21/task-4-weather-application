
import type { SavedLocations } from '../types/LocalStorage';




import React, { useState, useEffect } from 'react';

interface LocationSearchProps {
  onLocationSelect: (location: string) => void;
  selectedLocation: string;
}

const LOCAL_STORAGE_KEY = 'weatherAppLocations';

const LocationSearch: React.FC<LocationSearchProps> = ({ onLocationSelect, selectedLocation }) => {
  const [input, setInput] = useState('');
  const [locations, setLocations] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed: SavedLocations = JSON.parse(saved);
        if (Array.isArray(parsed.locations)) {
          setLocations(parsed.locations);
        } else {
          setLocations([]);
        }
      } catch {
        setLocations([]);
      }
    }
  }, []);

  useEffect(() => {
  const toSave: SavedLocations = { locations };
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(toSave));
  }, [locations]);

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed && !locations.includes(trimmed)) {
      setLocations([trimmed, ...locations]);
      onLocationSelect(trimmed);
      setInput('');
    }
  };

  const handleSelect = (loc: string) => {
    onLocationSelect(loc);
  };

  const handleDelete = (loc: string) => {
    setLocations(locations.filter((l: string) => l !== loc));
    if (selectedLocation === loc && locations.length > 1) {
      onLocationSelect(locations.find((l: string) => l !== loc) || '');
    }
  };

  return (
    <div className="location-search">
      <form onSubmit={handleAddLocation}>
        <input
          type="text"
          placeholder="Search location..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>
      <ul>
        {locations.map((loc: string) => (
          <li key={loc} style={{ display: 'flex', alignItems: 'center' }}>
            <button
              style={{ fontWeight: loc === selectedLocation ? 'bold' : 'normal', cursor: 'pointer' }}
              onClick={() => handleSelect(loc)}
            >
              {loc}
            </button>
            <button onClick={() => handleDelete(loc)} style={{ marginLeft: 8, color: 'red', cursor: 'pointer' }}>x</button>
          </li>
      ))}
      </ul>
    </div>
  );
};

export default LocationSearch;
