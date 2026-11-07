"use client";

import useScrollReveal from "../hooks/useScrollReveal";
import { useContent } from "../context/content";
import { accentColors } from "../data/site";
import SectionHead from "./SectionHead";
import "./Skills.css";

function SkillBar({ skill }) {
  const hasLevel = Number.isFinite(skill.level);

  return (
    <li className={`skill ${hasLevel ? "" : "skill--plain"}`}>
      <div className="skill__top">
        <span className="skill__name">{skill.name}</span>
        {hasLevel && <span className="skill__percent">{skill.level}%</span>}
      </div>
      {hasLevel && (
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
      )}
    </li>
  );
}

function SkillGroup({ group, index }) {
  const ref = useScrollReveal();

  return (
    <div
      ref={ref}
      className="skill-group reveal"
      style={{
        transitionDelay: `${index * 0.1}s`,
        "--accent": accentColors[group.accent] || accentColors.violet,
      }}
    >
      <div className="skill-group__head">
        <span className="skill-group__index">{String(index + 1).padStart(2, "0")}</span>
        <div>
          <h3 className="skill-group__title">{group.title}</h3>
          {group.blurb && <p className="skill-group__blurb">{group.blurb}</p>}
        </div>
      </div>

      <ul className="skill-group__list">
        {group.skills.map((skill) => (
          <SkillBar key={skill.id} skill={skill} />
        ))}
      </ul>
    </div>
  );
}

export default function Skills({ index }) {
  const { skill_categories, settings } = useContent();
  const groups = skill_categories.filter((group) => group.skills.length > 0);

  return (
    <section id="skills" className="section skills">
      <div className="container">
        <SectionHead section={settings.sections.skills} index={index} split />

        <div className="skills__grid">
          {groups.map((group, i) => (
            <SkillGroup key={group.id} group={group} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
