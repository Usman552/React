import React, { useState, useEffect } from 'react';
import './digital.css';

const DigitalClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval); // Clean up interval
  }, []);

  const formatTime = (time) => {
    return time < 10 ? `0${time}` : time; // Add leading zero
  };

  const hours = formatTime(time.getHours()%12);
  const minutes = formatTime(time.getMinutes());
  const seconds = formatTime(time.getSeconds());
  const amPm = hours >= 12 ? 'AM' : 'PM';

  return (
    <div className="digital-clock">
      <div className="time">
        {hours}:{minutes}:{seconds}:{amPm}
      </div>
    </div>
  );
};

export default DigitalClock;
