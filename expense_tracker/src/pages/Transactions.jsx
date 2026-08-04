import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext";
function Transactions({ expenses, setExpenses, setEditExpense, setEditIndex }) {
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const deleteExpense = (index) => {
    const updatedExpenses = expenses.filter((_, i) => i !== index);
    setExpenses(updatedExpenses);
  };
  return (
    <div>
      <h2>Transactions</h2>
      <ul></ul>
      <table className="w-full border-collapse border border-gray-300">
        <thead
          className={`bg-gray-200 ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"}`}
        >
          <tr
            className={`border-b hover:bg-gray-100 ${theme === "dark" ? "hover:bg-gray-700" : ""}`}
          >
            <th className="p-3 text-left">Expense</th>
            <th className="p-3">Amount</th>
            <th className="p-3">Category</th>
            <th className="p-3">Date</th>
            <th className="p-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense, index) => (
            <tr
              key={expense.id}
              className={`border-b hover:bg-gray-100 ${theme === "dark" ? "hover:bg-gray-700" : ""}`}
            >
              <td className="p-3 ">{expense.expenseName}</td>
              <td>{expense.amount}</td>
              <td>{expense.category}</td>
              <td>{expense.date}</td>
              <td className="flex gap-2 justify-center items-center p-3">
                <button
                  onClick={() => {
                    setEditExpense(expense);
                    setEditIndex(index);
                    navigate("/add-expense");
                  }}
                  className={`p-2 rounded ${theme === "dark" ? "bg-blue-600 text-white" : "bg-blue-500 text-white"}`}
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteExpense(index)}
                  className={`p-2 rounded ${theme === "dark" ? "bg-red-600 text-white" : "bg-red-500 text-white"}`}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Transactions;
