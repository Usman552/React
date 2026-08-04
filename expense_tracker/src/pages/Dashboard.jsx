import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import {
  FaWallet,
  FaArrowTrendUp,
  FaArrowTrendDown,
  FaPiggyBank,
} from "react-icons/fa6";
import Card from "../components/Card";
function Dashboard({ expenses }) {
  const { theme } = useContext(ThemeContext);
  const totalBalance = expenses.reduce((total, expense) => {
    return total + Number(expense.amount);
  }, 0);
  const cards = [
    {
      title: "Total Balance",
      amount: "PKR 20,000",
      icon: <FaWallet />,
      border: "border-blue-500",
    },
    {
      title: "Income",
      amount: "PKR 80,000",
      icon: <FaArrowTrendUp />,
      border: "border-green-500",
    },
    {
      title: "Expense",
      amount: `PKR ${totalBalance.toLocaleString()}`,
      icon: <FaArrowTrendDown />,
      border: "border-red-500",
    },
    {
      title: "Savings",
      amount: "PKR 20,000",
      icon: <FaPiggyBank />,
      border: "border-yellow-500",
    },
  ];

  return (
    <>
      <div
        className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 p-4 ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"}`}
      >
        {cards.map((card) => (
          <Card
            title={card.title}
            amount={card.amount}
            icon={card.icon}
            border={card.border}
          />
        ))}
      </div>
    </>
  );
}

export default Dashboard;
