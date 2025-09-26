import React from 'react';
import { useWeather } from '../context/WeatherContext';
// @ts-ignore
import { SavedLocation } from '../types/weather';
import { MapPin, Trash2 } from 'lucide-react';

interface Props {
  onSelect: (loc: SavedLocation) => void;
}

const LocationList: React.FC<Props> = ({ onSelect }) => {
  const { state, dispatch } = useWeather();

  const remove = (id: string) => dispatch({ type: 'REMOVE_SAVED_LOCATION', payload: id });

  return (
    <div className="loclist">
      {state.savedLocations.map(loc => (
        <div key={loc.id} className="loclist__card">
          <button onClick={() => onSelect(loc)} className="loclist__select">
            <MapPin className="loclist__pin" />
            <div>
              <div className="loclist__name">{loc.name}</div>
              <div className="loclist__country">{loc.country}</div>
            </div>
          </button>
          <button onClick={() => remove(loc.id)} className="loclist__remove" aria-label="Remove saved location">
            <Trash2 className="loclist__remove-icon" />
          </button>
        </div>
      ))}
      {state.savedLocations.length === 0 && (
        <div className="loclist__empty">No saved locations yet. Use the search above to add one.</div>
      )}
    </div>
  );
};

export default LocationList;
