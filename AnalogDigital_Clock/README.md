# React Analog and Digital Clock

This project contains both an analog and a digital clock built using React. Both clocks dynamically update the time every second and display the current time in different formats.

---

## Features

- **Analog Clock**
  - Displays an analog clock with hour, minute, and second hands.
  - Dynamically updates every second using React state and `useEffect`.
  - Styled with CSS for an elegant appearance.
  - Clock numbers are dynamically rendered in an anti-clockwise manner.

- **Digital Clock**
  - Displays the current time in a digital format (HH:MM:SS AM/PM).
  - Dynamically updates every second using React state and `useEffect`.
  - Leading zeros added to single-digit hours, minutes, and seconds for consistent formatting.

---

## Installation

1. Navigate to the project directory.
   ```bash
   cd AbalogDigital_Clock
   ```

2. Install dependencies.
   ```bash
   bun install
   ```

3. Start the development server.
   ```bash
   bun run dev
   ```

---

## Usage

1. Ensure your project structure includes the following files:
   - `Analog.jsx`: Contains the React component for the analog clock.
   - `Clock.css`: Contains the styling for the analog clock.
   - `DigitalClock.jsx`: Contains the React component for the digital clock.
   - `digital.css`: Contains the styling for the digital clock.

2. Import the desired clock components wherever you want to display them:

   ```javascript
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
   ```

3. Add the `Clock.css` and `Digital.css` files to style the clocks. Ensure the CSS files include styles for the clock components.

---

## File Structure

```plaintext
src/
├── components/
│   ├── Analog.jsx
│   ├── clock.css
│   ├── DigitalClock.jsx
│   └── gigital.css
├── App.js
├── index.js
└── ...
```

---

## How It Works

### Analog Clock

1. **State Management:**
   - The `time` state is initialized to the current date and updated every second using `setInterval` inside a `useEffect` hook.

2. **Hand Rotation Calculation:**
   - The angles for hour, minute, and second hands are calculated dynamically based on the current time.

3. **Number Placement:**
   - Clock numbers are dynamically generated and positioned using CSS transformations to align around the clock face.

4. **Cleanup:**
   - The interval is cleared when the component unmounts to prevent memory leaks.

### Digital Clock

1. **State Management:**
   - The `time` state is initialized to the current date and updated every second using `setInterval` inside a `useEffect` hook.

2. **Time Formatting:**
   - Hours, minutes, and seconds are formatted to include leading zeros when necessary.
   - The clock displays time in 12-hour format with an AM/PM indicator.

3. **Cleanup:**
   - The interval is cleared when the component unmounts to prevent memory leaks.

---

## Dependencies

- **React**: Ensure you have React installed. Use React 16.8+ for hooks support.

---

## Contributing

Contributions are welcome! Feel free to fork the repository and submit a pull request with improvements or bug fixes.

---

## License

This project is open-source and available under the [MIT License](LICENSE).

---

