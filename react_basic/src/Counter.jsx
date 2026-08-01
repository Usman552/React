import React from "react";
import { useState } from "react";

function Counter() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };
  const [count, setCount] = useState(0);
  return (
    <div className={theme === "light" ? "light-mode" : "dark-mode"}>
      <h1>Counter</h1>
      <h2>{count}</h2>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>decrement</button>
      <button onClick={() => setCount(0)}>Reset</button>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}

export default Counter;
