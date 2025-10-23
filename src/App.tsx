import React from 'react';
import './App.css';
import Header from './components/Header';
import ErrorBoundary from './components/ErrorBoundary';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Settings from './pages/Settings';

function App() {
  return (
    <ErrorBoundary>
      <div className="app">
        <Header />
        <main className="app__main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
