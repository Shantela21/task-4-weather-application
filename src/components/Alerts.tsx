import React, { useEffect } from 'react';
import { WeatherAlert, WeatherData } from '../types/weather';
import { Bell } from 'lucide-react';
import { notify } from '../utils/notifications';

interface Props {
  data: WeatherData;
}

const Alerts: React.FC<Props> = ({ data }) => {
  const alerts: WeatherAlert[] = data.alerts ?? [];

  useEffect(() => {
    // Send browser notifications for severe alerts
    alerts.forEach((a) => {
      if (a.severity?.toLowerCase() === 'severe' || a.severity?.toLowerCase() === 'extreme') {
        notify(`${a.event} (${a.severity})`, a.headline || a.desc);
      }
    });
  }, [alerts]);

  if (!alerts.length) return null;

  return (
    <div className="alerts">
      {alerts.map((a) => (
        <div key={a.id} className="alert">
          <Bell className="alert__icon" />
          <div className="alert__body">
            <div className="alert__title">{a.event} — {a.severity}</div>
            <div className="alert__text">{a.headline || a.desc}</div>
            {a.expires && (
              <div className="alert__expires">Expires: {new Date(a.expires).toLocaleString()}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Alerts;
