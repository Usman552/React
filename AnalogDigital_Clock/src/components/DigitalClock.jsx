import React, { useState, useEffect } from 'react';
import './digital.css';

const DigitalClock = ({ timezone = 'UTC' }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval); // Clean up interval
  }, []);

  const formatTime = (time) => {
    return time < 10 ? `0${time}` : time; // Add leading zero
  };

  const getTimeInZone = (date, zone) => {
    return new Date(date.toLocaleString('en-US', { timeZone: zone }));
  };

  const zonedTime = getTimeInZone(time, timezone);
  const hours = formatTime(zonedTime.getHours() % 12 || 12); // 12-hour format
  const minutes = formatTime(zonedTime.getMinutes());
  const seconds = formatTime(zonedTime.getSeconds());
  const amPm = zonedTime.getHours() >= 12 ? 'PM' : 'AM';

  return (
    <div className="digital-clock">
      <div className="time">
        {hours}:{minutes}:{seconds} {amPm}
      </div>
      <div className="timezone">
        Timezone: {timezone}
      </div>
    </div>
  );
};

export default DigitalClock;
