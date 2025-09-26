import React from 'react';

import { type ViewMode } from '../types/weather';

interface Props {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

const ForecastToggle: React.FC<Props> = ({ value, onChange }) => {
  const btn = (mode: ViewMode, label: string) => (
    <button
      onClick={() => onChange(mode)}
      className={`ftoggle__btn ${value === mode ? 'ftoggle__btn--active' : ''}`}
    >
      {label}
    </button>
  );

  return (
    <div className="ftoggle">
      {btn('hourly', 'Hourly')}
      {btn('daily', 'Daily')}
    </div>
  );
};

export default ForecastToggle;
