import React from "react";
import useScrollReveal from "../hooks/useScrollReveal";
import "./About.css";

const stats = [
  { value: "1+", label: "Year Experience" },
  { value: "10+", label: "Projects Built" },
  { value: "BS SE", label: "2022 - 2026" },
];

export default function About() {
  const ref = useScrollReveal();

  return (
    <section id="about" className="about">
      <div className="container">
        <p className="section-label">About Me</p>

        <div ref={ref} className="about__card clay reveal">
          <p className="about__text">
            Main <strong>Usman Qasim</strong> hoon, Multan, Pakistan se ek
            Front-End Developer. Meri background PHP, Laravel aur
            CodeIgniter mein hai, aur ab main React ke saath modern,
            simple aur user-friendly interfaces banane par focus kar
            raha hoon.
          </p>

          <div className="about__stats">
            {stats.map((stat) => (
              <div className="about__stat" key={stat.label}>
                <span className="about__value">{stat.value}</span>
                <span className="about__label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
