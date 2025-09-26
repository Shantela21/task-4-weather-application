import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { WeatherData, SavedLocation, TemperatureUnit, Theme, ViewMode } from '../types/weather';

interface WeatherState {
  currentWeather: WeatherData | null;
  savedLocations: SavedLocation[];
  selectedLocation: SavedLocation | null;
  temperatureUnit: TemperatureUnit;
  theme: Theme;
  viewMode: ViewMode;
  loading: boolean;
  error: string | null;
}

type WeatherAction =
  | { type: 'SET_CURRENT_WEATHER'; payload: WeatherData }
  | { type: 'SET_SAVED_LOCATIONS'; payload: SavedLocation[] }
  | { type: 'ADD_SAVED_LOCATION'; payload: SavedLocation }
  | { type: 'REMOVE_SAVED_LOCATION'; payload: string }
  | { type: 'SET_SELECTED_LOCATION'; payload: SavedLocation }
  | { type: 'SET_TEMPERATURE_UNIT'; payload: TemperatureUnit }
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: WeatherState = {
  currentWeather: null,
  savedLocations: [],
  selectedLocation: null,
  temperatureUnit: 'celsius',
  theme: 'light',
  viewMode: 'current',
  loading: false,
  error: null,
};

const weatherReducer = (state: WeatherState, action: WeatherAction): WeatherState => {
  switch (action.type) {
    case 'SET_CURRENT_WEATHER':
      return { ...state, currentWeather: action.payload, loading: false, error: null };
    case 'SET_SAVED_LOCATIONS':
      return { ...state, savedLocations: action.payload };
    case 'ADD_SAVED_LOCATION':
      const exists = state.savedLocations.find(loc => loc.id === action.payload.id);
      if (exists) return state;
      return { ...state, savedLocations: [...state.savedLocations, action.payload] };
    case 'REMOVE_SAVED_LOCATION':
      return {
        ...state,
        savedLocations: state.savedLocations.filter(loc => loc.id !== action.payload)
      };
    case 'SET_SELECTED_LOCATION':
      return { ...state, selectedLocation: action.payload };
    case 'SET_TEMPERATURE_UNIT':
      return { ...state, temperatureUnit: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
};

interface WeatherContextType {
  state: WeatherState;
  dispatch: React.Dispatch<WeatherAction>;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

export const useWeather = () => {
  const context = useContext(WeatherContext);
  if (context === undefined) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
};

interface WeatherProviderProps {
  children: ReactNode;
}

export const WeatherProvider: React.FC<WeatherProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(weatherReducer, initialState);

  // Load saved data from localStorage on mount
  useEffect(() => {
    const savedLocations = localStorage.getItem('weatherApp_savedLocations');
    const temperatureUnit = localStorage.getItem('weatherApp_temperatureUnit') as TemperatureUnit;
    const theme = localStorage.getItem('weatherApp_theme') as Theme;
    const viewMode = localStorage.getItem('weatherApp_viewMode') as ViewMode;

    if (savedLocations) {
      dispatch({ type: 'SET_SAVED_LOCATIONS', payload: JSON.parse(savedLocations) });
    }
    if (temperatureUnit) {
      dispatch({ type: 'SET_TEMPERATURE_UNIT', payload: temperatureUnit });
    }
    if (theme) {
      dispatch({ type: 'SET_THEME', payload: theme });
    }
    if (viewMode) {
      dispatch({ type: 'SET_VIEW_MODE', payload: viewMode });
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('weatherApp_savedLocations', JSON.stringify(state.savedLocations));
  }, [state.savedLocations]);

  useEffect(() => {
    localStorage.setItem('weatherApp_temperatureUnit', state.temperatureUnit);
  }, [state.temperatureUnit]);

  useEffect(() => {
    localStorage.setItem('weatherApp_theme', state.theme);
    // Apply theme to document
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.theme]);

  useEffect(() => {
    localStorage.setItem('weatherApp_viewMode', state.viewMode);
  }, [state.viewMode]);

  return (
    <WeatherContext.Provider value={{ state, dispatch }}>
      {children}
    </WeatherContext.Provider>
  );
};
