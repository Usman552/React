import Dashboard from "../pages/Dashboard";
import AddExpense from "../pages/AddExpense";
import Transactions from "../pages/Transactions";
import Reports from "../pages/Reports";
import { Routes, Route } from "react-router-dom";
import Topbar from "./Topbar";
import { useContext, useState } from "react";
import { ThemeContext } from "../context/ThemeContext";
function Main() {
  const { theme } = useContext(ThemeContext);
  const [expenses, setExpenses] = useState([]);
  return (
    <main
      className={`flex-1 min-h-screen ${theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-100 text-black"}`}
    >
      <Topbar />
      <div className=" p-5">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route
            path="/add-expense"
            element={
              <AddExpense expenses={expenses} setExpenses={setExpenses} />
            }
          />
          <Route
            path="/transactions"
            element={<Transactions expenses={expenses} />}
          />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </div>
    </main>
  );
}

export default Main;
