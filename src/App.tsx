
import React, { useState, useEffect } from 'react';
import './App.css';

import LocationSearch from './components/LocatonSearch';
import Weather from './components/Weather';
import Forecast from './components/Forecast';
import WeatherAlerts from './components/WeatherAlerts';
import SearchByCity from './components/SearchByCity';

const DEFAULT_UNITS: 'metric' | 'imperial' = 'metric';

function App() {
  const [selectedLocation, setSelectedLocation] = useState('');
  const [units, setUnits] = useState<'metric' | 'imperial'>(DEFAULT_UNITS);

  // Load last selected location from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('weatherAppSelectedLocation');
    if (saved) setSelectedLocation(saved);
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      localStorage.setItem('weatherAppSelectedLocation', selectedLocation);
    }
  }, [selectedLocation]);

  return (
    <div className="App">
      <SearchByCity/>
      {/* <header>
        <h1>Weather Application</h1>
        <div style={{ marginBottom: 16 }}>
          <label>
            Units:
            <select value={units} onChange={e => setUnits(e.target.value as 'metric' | 'imperial')}>
              <option value="metric">Celsius</option>
              <option value="imperial">Fahrenheit</option>
            </select>
          </label>
        </div>
      </header>
      <LocationSearch
        onLocationSelect={setSelectedLocation}
        selectedLocation={selectedLocation}
      />
      <main>
        {selectedLocation ? (
          <>
            <Weather location={selectedLocation} units={units} />
            <Forecast location={selectedLocation} units={units} />
            <WeatherAlerts location={selectedLocation} />
          </>
        ) : (
          <p>Please select or add a location to view weather.</p>
        )}
      </main> */}
    </div>
  );
}

export default App;
