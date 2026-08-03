import { useContext, useState } from "react";
import { ThemeContext } from "../context/ThemeContext";
function AddExpense({ expenses, setExpenses }) {
  const { theme } = useContext(ThemeContext);

  const [formData, setformData] = useState({
    expenseName: "",
    amount: "",
    date: "",
    category: "",
  });
  const handleChange = (e) => {
    const { name, value } = e.target;
    setformData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
 const handleSubmit = (e) => {
  e.preventDefault();

  const newExpenses = [...expenses, formData];
  setExpenses(newExpenses);

  console.log(newExpenses);

  setformData({
    expenseName: "",
    amount: "",
    date: "",
    category: "",
  });
};
  return (
    <div className="max-w-2xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className={`p-6 rounded-xl shadow-lg space-y-5 ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"}`}
      >
        <div className="w-full rounded-lg p-2">
          <label className="mb-3 block">Expense Name:</label>
          <input
            type="text"
            className="w-full border rounded-lg p-2"
            name="expenseName"
            value={formData.expenseName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="w-full rounded-lg p-2">
          <label className="mb-3 block">Amount:</label>
          <input
            type="number"
            className="w-full border rounded-lg p-2"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            required
          />
        </div>
        <div className="w-full  rounded-lg p-2">
          <label className="mb-3 block">Date:</label>
          <input
            type="date"
            className="w-full border rounded-lg p-2"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>
        <div className="w-full rounded-lg p-2">
          <label className="mb-3 block">Category:</label>
          <select
            className="w-full border rounded-lg p-2"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select Category</option>
            <option value="food">Food</option>
            <option value="transportation">Transportation</option>
            <option value="entertainment">Entertainment</option>
            <option value="utilities">Utilities</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white rounded-lg p-3"
        >
          Add Expense
        </button>
      </form>
    </div>
  );
}

export default AddExpense;
