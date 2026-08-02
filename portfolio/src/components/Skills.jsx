import useScrollReveal from "../hooks/useScrollReveal";
import "./Skills.css";

const skills = [
  { name: "React", level: 90 },
  { name: "JavaScript", level: 85 },
  { name: "HTML & CSS", level: 95 },
  { name: "Bootstrap", level: 88 },
  { name: "Laravel", level: 85 },
  { name: "PHP", level: 80 },
  { name: "CodeIgniter", level: 78 },
  { name: "Git & GitHub", level: 85 },
];

function SkillCard({ skill }) {
  const ref = useScrollReveal();

  return (
    <div ref={ref} className="skill-card glass reveal">
      <div className="skill-card__top">
        <span className="skill-card__name">{skill.name}</span>
        <span className="skill-card__percent">{skill.level}%</span>
      </div>
      <div className="skill-card__track">
        <span
          className="skill-card__fill"
          style={{ "--target": `${skill.level}%` }}
        ></span>
      </div>
    </div>
  );
}

export default function Skills() {
  return (
    <section id="skills" className="skills">
      <div className="container">
        <p className="section-label">My Skills</p>

        <div className="skills__grid">
          {skills.map((skill) => (
            <SkillCard skill={skill} key={skill.name} />
          ))}
        </div>
      </div>
    </section>
  );
}
