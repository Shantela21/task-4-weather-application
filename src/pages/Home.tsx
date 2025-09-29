import React, { useEffect, useState } from 'react';
import { useWeather } from '../context/WeatherContext';
import SearchBar from '../components/SearchBar';
import LocationList from '../components/LocationList';
import WeatherSummary from '../components/WeatherSummary';
import { weatherApi } from '../services/WeatherApi';

import type { ViewMode } from '../types/weather';
import HourlyForecast from '../components/HourlyForecast';
import DailyForecast from '../components/DailyForecast';
import ForecastToggle from '../components/ForecastToggle';
import { getCurrentPosition } from '../utils/Geolocation';
import Alerts from '../components/Alerts';

const Home: React.FC = () => {
  const { state, dispatch } = useWeather();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    weatherApi.loadFromLocalStorage();
  }, []);

  // Attempt to get user's current location once
  useEffect(() => {
    const init = async () => {
      if (initialized) return;
      setInitialized(true);
      try {
        const pos = await getCurrentPosition({ enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 });
        const coords = `${pos.coords.latitude},${pos.coords.longitude}`;
        const data = await weatherApi.getForecastWeather(coords, 7);
        dispatch({ type: 'SET_CURRENT_WEATHER', payload: data });
        const currentLoc = {
          id: 'current',
          name: data.location.name,
          country: data.location.country,
          lat: data.location.lat,
          lon: data.location.lon,
          isCurrentLocation: true,
        };
        dispatch({ type: 'ADD_SAVED_LOCATION', payload: currentLoc });
        dispatch({ type: 'SET_SELECTED_LOCATION', payload: currentLoc });
      } catch (e) {
        // silently ignore if denied or failed; user can search
      }
    };
    init();
  }, [dispatch, initialized]);

  // Fetch data when a location is selected
  useEffect(() => {
    const fetchData = async () => {
      if (!state.selectedLocation) return;
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const q = `${state.selectedLocation.lat},${state.selectedLocation.lon}`;
        const data = await weatherApi.getForecastWeather(q, 7);
        dispatch({ type: 'SET_CURRENT_WEATHER', payload: data });
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error?.message ?? 'Failed to load weather' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    fetchData();
  }, [state.selectedLocation, dispatch]);

  const onSelectLocation = (loc: any) => {
    dispatch({ type: 'SET_SELECTED_LOCATION', payload: loc });
  };

  const changeView = (mode: ViewMode) => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode });
  };

  return (
    <div className="home">
      <SearchBar />
      <LocationList onSelect={onSelectLocation} />

      {state.loading && (
        <div className="home__status home__status--loading">Loading weather...</div>
      )}
      {state.error && (
        <div className="home__status home__status--error">{state.error}</div>
      )}

      {state.currentWeather && (
        <>
          <WeatherSummary data={state.currentWeather} />
          <Alerts data={state.currentWeather} />
          <div className="home__forecast-header">
            <h2 className="home__forecast-title">Forecast</h2>
            <ForecastToggle value={state.viewMode} onChange={changeView} />
          </div>
          {state.viewMode === 'hourly' ? (
            <HourlyForecast data={state.currentWeather} />
          ) : state.viewMode === 'daily' ? (
            <DailyForecast data={state.currentWeather} />
          ) : null}
        </>
      )}
    </div>
  );
};

export default Home;
