import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom';
import AnalogClock from './components/Analog';
import DigitalClock from './components/DigitalClock';
import './App.css';

function App() {
  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone; // Get user's local timezone

  const [isAnalog, setIsAnalog] = useState(true); // Default clock type
  const [timezone, setTimezone] = useState(localTimezone); // Set local timezone as default
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Sync state with URL on load
  useEffect(() => {
    const clockType = searchParams.get('type');
    const zone = searchParams.get('timezone');
    if (clockType) setIsAnalog(clockType === 'analog');
    if (zone) setTimezone(zone);
  }, [searchParams]);

  // Update the URL whenever the clock type or timezone changes
  useEffect(() => {
    const clockType = isAnalog ? 'analog' : 'digital';
    navigate(`/?type=${clockType}&timezone=${timezone}`);
  }, [isAnalog, timezone, navigate]);

  const toggleClock = () => {
    setIsAnalog(!isAnalog);
  };

  const handleTimezoneChange = (e) => {
    setTimezone(e.target.value);
  };

  const timezones = [
    'UTC',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Asia/Kolkata',
    'Australia/Sydney',
    localTimezone, // Add local timezone dynamically
  ];

  return (
    <div className="app">
      <h1>Toggle Clock</h1>
      <select onChange={handleTimezoneChange} value={timezone}>
        {timezones.map((tz) => (
          <option key={tz} value={tz}>
            {tz === localTimezone ? `${tz} (Local)` : tz}
          </option>
        ))}
      </select>
      {isAnalog ? <AnalogClock timezone={timezone} /> : <DigitalClock timezone={timezone} />}
      <button onClick={toggleClock}>
        {isAnalog ? 'Switch to Digital' : 'Switch to Analog'}
      </button>
    </div>
  );
}

export default function MainApp() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
      </Routes>
    </Router>
  );
}
