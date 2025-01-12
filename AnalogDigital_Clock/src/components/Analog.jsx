import React, { useEffect, useState } from 'react';
import './Clock.css';

const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours();

  const secondHandStyle = {
    transform: `rotate(${seconds * 6}deg)`,
  };

  const minuteHandStyle = {
    transform: `rotate(${minutes * 6 + seconds * 0.1}deg)`,
  };

  const hourHandStyle = {
    transform: `rotate(${hours * 30 + minutes * 0.5}deg)`,
  };

  // Create clock numbers dynamically
  const numbers = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="clock">
      <div className="clock-face">
        {numbers.map((num) => {
          const angle = num * 30; // Each number is 30 degrees apart
          const style = {
            transform: `rotate(${angle}deg) translate(100px) rotate(-${angle}deg)`,
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
