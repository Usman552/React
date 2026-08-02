import { FaMoon, FaBell, FaUserCircle, FaSun } from "react-icons/fa";
import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

function Topbar() {
  const { theme, setTheme } = useContext(ThemeContext);
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };
  return (
    <header
      className={`sticky top-0 z-10 flex justify-between items-center h-16 shadow-md px-4 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"}`}
    >
      <div>Dashboard</div>

      <div className="flex items-center gap-4">
        {theme === "light" ? (
          <FaMoon onClick={toggleTheme} className="cursor-pointer" />
        ) : (
          <FaSun onClick={toggleTheme} className="cursor-pointer" />
        )}

        <FaBell className="cursor-pointer" />
        <FaUserCircle className="cursor-pointer" />
      </div>
    </header>
  );
}

export default Topbar;
