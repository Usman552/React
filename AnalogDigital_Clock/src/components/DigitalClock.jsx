import React, { useState, useEffect } from 'react';
import './digital.css';

const DigitalClock = ({ timezone = 'UTC' }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000); // Update every second
    return () => clearInterval(interval); // Clean up the interval on component unmount
  }, []);

  const formatTime = (time) => {
    return time < 10 ? `0${time}` : time; // Add leading zero if necessary
  };

  const getTimeInZone = (date, zone) => {
    // Use `Intl.DateTimeFormat` for accurate timezone conversion with hour12 option
    const options = { timeZone: zone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    return formatter.format(date); // Return formatted date string in given timezone
  };

  const zonedTimeString = getTimeInZone(time, timezone);
  const [hours, minutes, seconds] = zonedTimeString.split(':'); // Split time into hours, minutes, and seconds

  return (
    <div className="digital-clock">
      <div className="time">
        {hours}:{minutes}:{seconds}
      </div>
      <div className="timezone">
        Timezone: {timezone}
      </div>
    </div>
  );
};

export default DigitalClock;
