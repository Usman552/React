import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

function Card({ title, amount, icon, border }) {
  const { theme } = useContext(ThemeContext);
  return (
    <div>
      <div
        className={`p-4 rounded-lg shadow hover:shadow-xl border-t-4 transition-all h-40 duration-300 ${ border } ${theme === "dark" ? "bg-gray-600" : "bg-white"}`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="text-2xl">{icon}</div>
        </div>
        <p className="text-2xl font-bold mt-2"> {amount}</p>
      </div>
    </div>
  );
}

export default Card;
