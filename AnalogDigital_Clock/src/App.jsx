import { useState } from 'react';
import AnalogClock from './components/Analog';
import DigitalClock from './components/DigitalClock';
import './App.css';

function App() {
  const [isAnalog, setIsAnalog] = useState(true);
  const [timezone, setTimezone] = useState('UTC'); // Default timezone is UTC

  const toggleClock = () => {
    setIsAnalog(!isAnalog);
  };

  const handleTimezoneChange = (event) => {
    setTimezone(event.target.value);
  };

  const timezones = [
    { label: 'UTC', value: 'UTC' },
    { label: 'Pacific Time (US)', value: 'America/Los_Angeles' },
    { label: 'Eastern Time (US)', value: 'America/New_York' },
    { label: 'Central European Time', value: 'Europe/Berlin' },
    { label: 'Indian Standard Time', value: 'Asia/Kolkata' },
    { label: 'Australian Eastern Time', value: 'Australia/Sydney' },
  ];

  return (
    <div className="app">
      <h1>Toggle Clock</h1>
      {/* Dropdown for timezones */}
      <select value={timezone} onChange={handleTimezoneChange}>
        {timezones.map((tz) => (
          <option key={tz.value} value={tz.value}>
            {tz.label}
          </option>
        ))}
      </select>

      {/* Clock Component */}
      {isAnalog ? (
        <AnalogClock timezone={timezone} />
      ) : (
        <DigitalClock timezone={timezone} />
      )}

      {/* Toggle Button */}
      <button onClick={toggleClock}>
        {isAnalog ? 'Switch to Digital' : 'Switch to Analog'}
      </button>
    </div>
  );
}

export default App;
