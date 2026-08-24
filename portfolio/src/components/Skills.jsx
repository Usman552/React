import useScrollReveal from "../hooks/useScrollReveal";
import { skillGroups } from "../data/skills";
import "./Skills.css";

function SkillBar({ skill }) {
  return (
    <li className="skill">
      <div className="skill__top">
        <span className="skill__name">{skill.name}</span>
        <span className="skill__percent">{skill.level}%</span>
      </div>
      <div
        className="skill__track"
        role="progressbar"
        aria-label={skill.name}
        aria-valuenow={skill.level}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span className="skill__fill" style={{ "--target": `${skill.level}%` }}></span>
      </div>
    </li>
  );
}

function SkillGroup({ group, index }) {
  const ref = useScrollReveal();

  return (
    <div
      ref={ref}
      className="skill-group glass reveal"
      style={{ transitionDelay: `${index * 0.1}s`, "--accent": group.accent }}
    >
      <div className="skill-group__head">
        <span className="skill-group__dot" aria-hidden="true"></span>
        <div>
          <h3 className="skill-group__title">{group.title}</h3>
          <p className="skill-group__blurb">{group.blurb}</p>
        </div>
      </div>

      <ul className="skill-group__list">
        {group.skills.map((skill) => (
          <SkillBar key={skill.name} skill={skill} />
        ))}
      </ul>
    </div>
  );
}

export default function Skills() {
  return (
    <section id="skills" className="section skills">
      <div className="container">
        <div className="section__head">
          <p className="section-label">My Skills</p>
          <h2 className="section__title">
            The stack I use to{" "}
            <span className="text-gradient">ship real products</span>.
          </h2>
          <p className="section__lead">
            Grouped by where they sit in the build — interface, data layer, and
            the tooling that ties them together.
          </p>
        </div>

        <div className="skills__grid">
          {skillGroups.map((group, i) => (
            <SkillGroup key={group.title} group={group} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
