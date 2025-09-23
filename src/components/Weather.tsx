import React, { useState, useEffect } from 'react';

const Weather = () => {
  const [weather, setWeather] = useState(null);

  const fetchWeather = async () => {
    try {
      const response = await fetch(
        'https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_API_KEY'
      );
      const data = await response.json();
      setWeather(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  return (
    <div className='weather-container'>
        <h1 className='weather'>Weather App</h1>

    </div>
  );
};

export default Weather;