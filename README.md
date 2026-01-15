<img src="https://socialify.git.ci/Shantela21/task-4-weather-application/image?language=1&owner=1&name=1&stargazers=1&theme=Light" alt="task-4-weather-application" width="640" height="320" />

# WeatherNow - Modern Weather Application

A comprehensive weather application that provides real-time weather data, forecasts, and location-based weather information. Built with modern React, TypeScript, and integrated with professional weather APIs to deliver accurate and detailed weather insights.

## What This App Does

**WeatherNow** is a feature-rich weather application that helps users:

- **Get Current Weather**: Real-time weather data for any location worldwide
- **View Forecasts**: 7-day weather forecasts with detailed hourly breakdowns
- **Location Search**: Smart location search with geocoding and reverse geocoding
- **GPS Integration**: Automatic current location detection with weather updates
- **Save Locations**: Save frequently accessed locations for quick weather checks
- **Weather Details**: Comprehensive weather metrics including humidity, wind, visibility, UV index, and pressure
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark Mode**: Toggle between light and dark themes for comfortable viewing

## Key Features

### Weather Information
- **Current Conditions**: Temperature, weather conditions, and real-time updates
- **Detailed Metrics**: Humidity, wind speed/direction, visibility, UV index, atmospheric pressure
- **Hourly Forecasts**: Hour-by-hour weather predictions for the next 24 hours
- **Daily Forecasts**: 7-day weather outlook with high/low temperatures
- **Weather Alerts**: Severe weather notifications and warnings

### Location Features
- **Smart Search**: Intelligent location search with autocomplete suggestions
- **GPS Detection**: Automatic current location detection using browser geolocation
- **Saved Locations**: Save and manage favorite weather locations
- **Coordinate Support**: Search by latitude/longitude coordinates
- **Reverse Geocoding**: Convert coordinates to readable location names

### User Experience
- **Responsive Design**: Optimized for all screen sizes
- **Dark/Light Themes**: Toggle between color schemes
- **Temperature Units**: Switch between Celsius and Fahrenheit
- **Fast Performance**: Caching and optimized API calls
- **Professional UI**: Modern, clean interface with smooth animations

## Technologies Used

### Frontend Framework
- [React 19](https://react.dev/) - Modern React with hooks and context
- [TypeScript](https://www.typescriptlang.org/) - Type-safe development
- [Vite](https://vitejs.dev/) - Fast build tool and development server

### Styling & UI
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Lucide React](https://lucide.dev/) - Beautiful icon library
- CSS3 with custom animations and transitions

### Routing & State Management
- [React Router DOM](https://reactrouter.com/) - Client-side routing
- React Context API - Global state management
- LocalStorage - Data persistence

### Weather APIs
- [Open-Meteo API](https://open-meteo.com/) - Comprehensive weather data
- [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org/) - Geocoding services

### Development Tools
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - Component testing
- [Web Vitals](https://web.dev/vitals/) - Performance monitoring
- ESLint & Prettier - Code quality and formatting

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- npm or yarn package manager

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/Shantela21/task-4-weather-application
cd task-4-weather-application
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start development server:**
```bash
npm run dev
```

4. **Open your browser:**
Navigate to [http://localhost:5173](http://localhost:5173)

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
weather-application/
├─ public/                 # Static assets
├─ src/
│  ├─ components/          # Reusable UI components
│  │  ├─ Header.tsx       # Navigation header
│  │  ├─ Footer.tsx       # Application footer
│  │  ├─ SearchBar.tsx    # Location search input
│  │  ├─ LocationList.tsx # Saved locations list
│  │  ├─ WeatherSummary.tsx # Current weather display
│  │  ├─ HourlyForecast.tsx # Hourly weather forecast
│  │  ├─ DailyForecast.tsx  # Daily weather forecast
│  │  └─ Alerts.tsx      # Weather alerts component
│  ├─ pages/              # Page components
│  │  ├─ Home.tsx         # Main weather dashboard
│  │  └─ Settings.tsx     # Application settings
│  ├─ context/            # React context
│  │  └─ WeatherContext.tsx # Global weather state
│  ├─ services/           # API services
│  │  └─ WeatherApi.ts    # Weather API integration
│  ├─ types/              # TypeScript types
│  │  └─ weather.ts       # Weather data interfaces
│  ├─ utils/              # Utility functions
│  │  └─ Geolocation.ts   # Location utilities
│  ├─ App.tsx            # Main application component
│  └─ main.tsx           # Application entry point
├─ package.json           # Dependencies and scripts
├─ tailwind.config.js     # TailwindCSS configuration
└─ README.md             # This file
```

## 🎮 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run lint         # Run ESLint
```

## 🌟 Key Features in Detail

### Weather Data Sources
- **Open-Meteo API**: Provides accurate weather forecasts, historical data, and climate information
- **Real-time Updates**: Current weather conditions updated every few minutes
- **Global Coverage**: Weather data available for any location worldwide

### Smart Location Features
- **Geocoding**: Convert city names to coordinates
- **Reverse Geocoding**: Convert GPS coordinates to readable addresses
- **Location Caching**: Store frequently accessed locations for faster loading
- **Fallback Mechanisms**: Graceful handling of API failures and network issues

### Performance Optimizations
- **API Caching**: 10-minute cache for weather data to reduce API calls
- **LocalStorage**: Persistent storage for user preferences and saved locations
- **Lazy Loading**: Components loaded only when needed
- **Optimized Images**: Weather icons and assets optimized for fast loading

## 🤝 Contributing

Feel free to submit issues or pull requests! Please follow the existing code style and conventions:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Shantela Noyila**
- GitHub: [@Shantela21](https://github.com/Shantela21)
- Project: [WeatherNow](https://github.com/Shantela21/task-4-weather-application)

---

⭐ **Star this repository** if you find this weather application helpful!
