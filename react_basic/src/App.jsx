import React, { useState } from "react";

function App() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };
  const [count, setCount] = useState(0);
  const cardsData = [
    {
      id: 1,
      title: "React",
      desc: "React is a JavaScript library for building UI",
      img: "vite.svg",
      rating: 4.5,
    },
    {
      id: 2,
      title: "JavaScript",
      desc: "JavaScript is used to make websites interactive",
      img: "vite.svg",
      rating: 3,
    },
    {
      id: 3,
      title: "HTML",
      desc: "HTML is the structure of web pages",
      img: "vite.svg",
      rating: 2.5,
    },
    {
      id: 4,
      title: "CSS",
      desc: "CSS is used for styling websites",
      img: "vite.svg",
      rating: 8,
    },
  ];

  return (
    <>
      <div
        className={`cards ${theme === "light" ? "light-mode" : "dark-mode"}`}
      >
        {cardsData.map((card) => (
          <Netflix key={card.id} card={card} />
        ))}
      </div>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </>
  );
}

export default App;

const Netflix = ({ card }) => {
  return (
    <>
      <div className="card">
        <img className="card-img" src={card.img} alt={card.title} />
        <h2>{card.title}</h2>
        <p> {card.desc} </p>
        <p>Rating: {card.rating >= 8 ? "Hit" : "Average"} </p>
        <button className="read-more-btn" onClick={() => alert(card.title)}>
          Read More
        </button>
      </div>
    </>
  );
};
