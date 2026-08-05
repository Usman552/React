import { useContext, useState } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
function AddExpense({
  expenses,
  setExpenses,
  editExpense,
  setEditExpense,
  editIndex,
  setEditIndex,
}) {
  const { theme } = useContext(ThemeContext);

  const [formData, setformData] = useState(
    () =>
      editExpense || {
        expenseName: "",
        amount: "",
        date: "",
        category: "",
      },
  );
  const navigate = useNavigate();
  const handleChange = (e) => {
    const { name, value } = e.target;
    setformData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editIndex !== null) {
      const updatedExpenses = [...expenses];

      updatedExpenses[editIndex] = formData;

      setExpenses(updatedExpenses);

      setEditExpense(null);
      setEditIndex(null);
    } else {
      try {
        await addDoc(collection(db, "expenses"), formData);
      } catch (error) {
        console.error("Error adding document: ", error);
      }
    }

    setformData({
      expenseName: "",
      amount: "",
      date: "",
      category: "",
    });
    navigate("/transactions");
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
            className={`w-full border rounded-lg p-2 ${theme === "dark" ? "bg-gray-700 text-white" : "bg-white text-black"}`}
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
          {editIndex !== null ? "Update Expense" : "Add Expense"}
        </button>
      </form>
    </div>
  );
}

export default AddExpense;
