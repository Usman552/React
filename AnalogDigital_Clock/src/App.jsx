import { useState } from 'react';
import AnalogClock from './components/Analog';
import DigitalClock from './components/DigitalClock';
import './App.css';

function App() {
  const [isAnalog, setIsAnalog] = useState(true);

  const toggleClock = () => {
    setIsAnalog(!isAnalog);
  };

  return (
    <div className="app">
      <h1>Toggle Clock</h1>
      {isAnalog ? <AnalogClock /> : <DigitalClock />}
      <button onClick={toggleClock}>
        {isAnalog ? 'Switch to Digital' : 'Switch to Analog'}
      </button>
    </div>
  );
}

export default App;
