import React from "react";
import useScrollReveal from "../hooks/useScrollReveal";
import "./Projects.css";

// Apne real projects se ye array replace kar dena
const projects = [
  {
    title: "Z&S Perfumes",
    description: "Laravel 10 par bana e-commerce store — cart aur checkout ke saath.",
    tech: "Laravel · MySQL · Bootstrap",
  },
  {
    title: "Nic & Mia — By the Seashore",
    description: "Children's swimwear brand ke liye responsive frontend site.",
    tech: "HTML · CSS · JavaScript",
  },
  {
    title: "Emotion Recognition from Speech",
    description: "Final Year Project — speech se emotions detect karne wala ML model.",
    tech: "Python · ML",
  },
];

function ProjectCard({ project }) {
  const ref = useScrollReveal();
  return (
    <div ref={ref} className="project-card clay reveal">
      <h3>{project.title}</h3>
      <p className="project-card__desc">{project.description}</p>
      <p className="project-card__tech">{project.tech}</p>
    </div>
  );
}

export default function Projects() {
  return (
    <section id="projects" className="projects">
      <div className="container">
        <p className="section-label">Projects</p>

        <div className="projects__grid">
          {projects.map((project) => (
            <ProjectCard project={project} key={project.title} />
          ))}
        </div>
      </div>
    </section>
  );
}
