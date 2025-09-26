import React, { useEffect, useState } from 'react';
import { useWeather } from '../context/WeatherContext';
import { weatherApi } from '../services/WeatherApi';
import { requestNotificationPermission } from '../utils/notifications';

const Settings: React.FC = () => {
  const { state, dispatch } = useWeather();
  const [notificationsEnabled, setNotificationsEnabled] = useState(Notification?.permission === 'granted');

  useEffect(() => {
    // keep state in sync with system permission
    setNotificationsEnabled(Notification?.permission === 'granted');
  }, []);

  const onThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const theme = e.target.value as 'light' | 'dark';
    dispatch({ type: 'SET_THEME', payload: theme });
  };

  const onUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const unit = e.target.value as 'celsius' | 'fahrenheit';
    dispatch({ type: 'SET_TEMPERATURE_UNIT', payload: unit });
  };

  const enableNotifications = async () => {
    const perm = await requestNotificationPermission();
    setNotificationsEnabled(perm === 'granted');
  };

  const clearCache = () => {
    weatherApi.clearCache();
    // Provide simple feedback
    alert('Cached weather data cleared.');
  };

  return (
    <div className="settings">
      <h1 className="settings__title">Settings</h1>

      <div className="settings__card">
        <div className="settings__group">
          <label className="settings__label">Theme</label>
          <select value={state.theme} onChange={onThemeChange} className="settings__select">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div className="settings__group">
          <label className="settings__label">Temperature Unit</label>
          <select value={state.temperatureUnit} onChange={onUnitChange} className="settings__select">
            <option value="celsius">Celsius (°C)</option>
            <option value="fahrenheit">Fahrenheit (°F)</option>
          </select>
        </div>

        <div className="settings__row">
          <div>
            <div className="settings__row-title">Severe Weather Notifications</div>
            <div className="settings__row-sub">Enable browser notifications for severe alerts</div>
          </div>
          <button onClick={enableNotifications} className={`settings__btn ${notificationsEnabled ? 'settings__btn--ok' : ''}`}>
            {notificationsEnabled ? 'Enabled' : 'Enable'}
          </button>
        </div>

        <div className="settings__divider" />

        <div className="settings__row">
          <div>
            <div className="settings__row-title">Clear cached weather data</div>
            <div className="settings__row-sub">Removes locally stored weather data and alerts</div>
          </div>
          <button onClick={clearCache} className="settings__btn settings__btn--ghost">Clear</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
