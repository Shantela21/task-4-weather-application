import React, { useEffect } from 'react';
import { Bell } from 'lucide-react';
import { notify } from '../utils/notifications';

// Fallback interfaces if import fails
export interface WeatherAlert {
  id: string;
  event: string;
  severity: string;
  headline?: string;
  desc?: string;
  expires?: string;
}

export interface WeatherData {
  alerts?: WeatherAlert[];
}

interface Props {
  data: WeatherData;
}

const Alerts: React.FC<Props> = ({ data }) => {
  const alerts: WeatherAlert[] = data?.alerts ?? [];

  useEffect(() => {
    alerts.forEach((alert) => {
      const severity = alert.severity?.toLowerCase();
      if (severity === 'severe' || severity === 'extreme') {
        notify(`${alert.event} (${alert.severity})`, alert.headline || alert.desc || '');
      }
    });
  }, [alerts]);

  if (!alerts.length) return null;

  return (
    <div className="alerts">
      {alerts.map((alert) => (
        <div key={alert.id} className="alert">
          <Bell className="alert__icon" />
          <div className="alert__body">
            <div className="alert__title">
              {alert.event ?? 'Unknown Event'} — {alert.severity ?? 'Unknown Severity'}
            </div>
            <div className="alert__text">{alert.headline || alert.desc || 'No description'}</div>
            {alert.expires && (
              <div className="alert__expires">
                Expires: {new Date(alert.expires).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Alerts;