import React, { useEffect, useState } from 'react';
import './Clock.css';

const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours();

  // Calculate rotation for each hand
  const secondHandStyle = {
    transform: `rotate(${seconds * 6}deg)`,
  };

  const minuteHandStyle = {
    transform: `rotate(${minutes * 6 + seconds * 0.1}deg)`,
  };

  const hourHandStyle = {
    transform: `rotate(${(hours % 12) * 30 + minutes * 0.5}deg)`,
  };

  // Create clock numbers dynamically
  const numbers = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="clock">
      <div className="clock-face">
        {numbers.map((num, index) => {
          // Fix angle calculation to make numbers anti-clockwise
          const angle =270 + (index + 1)*30; // 30 degrees per number
          
          // Anti-clockwise adjustment: Starting from 12 at top (0 degrees)
          const style = {
            transform: `rotate(${angle}deg) translate(110px) rotate(-${angle}deg)`, 
          };

          return (
            <div key={num} className="number" style={style}>
              {num}
            </div>
          );
        })}
        <div className="hand hour-hand" style={hourHandStyle}></div>
        <div className="hand minute-hand" style={minuteHandStyle}></div>
        <div className="hand second-hand" style={secondHandStyle}></div>
        <div className="center-dot"></div>
      </div>
    </div>
  );
};

export default Clock;
