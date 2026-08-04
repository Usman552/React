import Dashboard from "../pages/Dashboard";
import AddExpense from "../pages/AddExpense";
import Transactions from "../pages/Transactions";
import Reports from "../pages/Reports";
import { Routes, Route } from "react-router-dom";
import Topbar from "./Topbar";
import { useContext, useState, useEffect } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
function Main() {
  useEffect(() => {
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
    try {
      const querySnapshot = await getDocs(collection(db, "expenses"));
      const expensesData = querySnapshot.docs.map((doc) => doc.data());
      setExpenses(expensesData);
    } catch (error) {
      console.error("Error fetching expenses: ", error);
    }
  }
  const { theme } = useContext(ThemeContext);
  const [expenses, setExpenses] = useState([]);
  const [editExpense, setEditExpense] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  return (
    <main
      className={`flex-1 min-h-screen ${theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-100 text-black"}`}
    >
      <Topbar />
      <div className=" p-5">
        <Routes>
          <Route path="/" element={<Dashboard expenses={expenses} />} />
          <Route
            path="/add-expense"
            element={
              <AddExpense
                expenses={expenses}
                setExpenses={setExpenses}
                editExpense={editExpense}
                setEditExpense={setEditExpense}
                editIndex={editIndex}
                setEditIndex={setEditIndex}
              />
            }
          />
          <Route
            path="/transactions"
            element={
              <Transactions
                expenses={expenses}
                setExpenses={setExpenses}
                setEditExpense={setEditExpense}
                setEditIndex={setEditIndex}
              />
            }
          />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </div>
    </main>
  );
}

export default Main;
