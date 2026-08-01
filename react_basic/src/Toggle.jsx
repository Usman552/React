import React from "react";
import { useState } from "react";

function Toggle() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };
  return (
    <>
      <div className={theme === "light" ? "light-mode" : "dark-mode"}>
        <h1>Toggle</h1>
        <button onClick={toggleTheme}>Toggle Theme</button>
      </div>
    </>
  );
}

export default Toggle;
