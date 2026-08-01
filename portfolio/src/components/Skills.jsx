import React from "react";
import useScrollReveal from "../hooks/useScrollReveal";
import "./Skills.css";

const skills = [
  "React", "JavaScript", "HTML & CSS", "Bootstrap",
  "Laravel", "PHP", "CodeIgniter", "Git & GitHub",
];

// Har card apna reveal ref chahta hai, is liye chota alag component
// bana diya (loop ke andar hook call nahi kar sakte).
function SkillCard({ name }) {
  const ref = useScrollReveal();
  return (
    <div ref={ref} className="skill-card clay reveal">
      {name}
    </div>
  );
}

export default function Skills() {
  return (
    <section id="skills" className="skills">
      <div className="container">
        <p className="section-label">My Skills</p>

        <div className="skills__grid">
          {skills.map((name) => (
            <SkillCard name={name} key={name} />
          ))}
        </div>
      </div>
    </section>
  );
}
