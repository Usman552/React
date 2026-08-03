import { NavLink } from "react-router-dom";
import { FaHome, FaPlus, FaList, FaChartBar } from "react-icons/fa";
import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

function Sidebar() {
  const { theme } = useContext(ThemeContext);
  return (
    <>
      <aside
        className={`w-64  p-4 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"}`}
      >
        <h1 className="text-2xl font-bold mb-8">Expense Tracker</h1>
        <nav>
          <ul className="space-y-2">
            <li>
              <NavLink
                to="/"
                className={`block flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 ${theme === "dark" ? "hover:bg-gray-700 text-white" : "hover:bg-gray-200 text-black"}`}
              >
                <FaHome />
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/add-expense"
                className="block flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700"
              >
                <FaPlus />
                Add Expense
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/transactions"
                className="block flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700"
              >
                <FaList />
                Transactions
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/reports"
                className="block flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700"
              >
                <FaChartBar />
                Reports
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
