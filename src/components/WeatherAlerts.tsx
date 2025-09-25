
import React, { useEffect, useState } from 'react';

interface WeatherAlertsProps {
  location: string;
}

const API_KEY = 'YOUR_API_KEY'; // Replace with your OpenWeatherMap API key

const WeatherAlerts: React.FC<WeatherAlertsProps> = ({ location }) => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) return;
    const fetchAlerts = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get coordinates for the location
        const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${API_KEY}`);
        const geoData = await geoRes.json();
        if (!geoData[0]) throw new Error('Location not found');
        const { lat, lon } = geoData[0];
        // Fetch alerts
        const res = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily,current&appid=${API_KEY}`);
        const data = await res.json();
        setAlerts(data.alerts || []);
      } catch (err: any) {
        setError(err.message);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
    // eslint-disable-next-line
  }, [location]);

  return (
    <div className="weather-alerts">
      <h3>Weather Alerts</h3>
      {loading && <p>Loading alerts...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {alerts.length === 0 && !loading && <p>No weather alerts for this location.</p>}
      {alerts.length > 0 && (
        <ul>
          {alerts.map((alert, idx) => (
            <li key={idx} style={{ marginBottom: 12 }}>
              <strong>{alert.event}</strong> ({alert.sender_name})<br />
              <span>{alert.description}</span>
              <br />
              <span>From: {new Date(alert.start * 1000).toLocaleString()}</span><br />
              <span>To: {new Date(alert.end * 1000).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default WeatherAlerts;
