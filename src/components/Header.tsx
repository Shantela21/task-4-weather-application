import React from 'react';
import { useWeather } from '../context/WeatherContext';
import { Sun, Moon, ThermometerSun, ThermometerSnowflake, MapPin, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  const { state, dispatch } = useWeather();

  const toggleTheme = () => {
    dispatch({ type: 'SET_THEME', payload: state.theme === 'light' ? 'dark' : 'light' });
  };

  const toggleUnit = () => {
    dispatch({ type: 'SET_TEMPERATURE_UNIT', payload: state.temperatureUnit === 'celsius' ? 'fahrenheit' : 'celsius' });
  };

  return (
    <header className="header">
      <div className="header__inner">
        <Link to="/" className="header__brand">
          <MapPin className="header__brand-icon" />
          <span className="header__title">WeatherNow</span>
        </Link>
        <nav className="header__nav">
          <Link to="/settings" className="header__link">
            <Settings className="header__link-icon" />
            Settings
          </Link>
          <button onClick={toggleUnit} className="header__btn">
            {state.temperatureUnit === 'celsius' ? <><ThermometerSun className="header__btn-icon" /> C°</> : <><ThermometerSnowflake className="header__btn-icon" /> F°</>}
          </button>
          <button onClick={toggleTheme} className="header__iconbtn" aria-label="Toggle theme">
            {state.theme === 'light' ? <Moon className="header__iconbtn-icon" /> : <Sun className="header__iconbtn-icon" />}
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
