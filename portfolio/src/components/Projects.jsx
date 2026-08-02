import React from "react";
import useScrollReveal from "../hooks/useScrollReveal";
import useTilt from "../hooks/useTilt";
import "./Projects.css";

const projects = [
  {
    title: "Z&S Perfumes",
    description: "An e-commerce store built with Laravel 10, complete with a product catalog, cart and checkout flow.",
    tech: ["Laravel", "MySQL", "Bootstrap"],
    image: null,
    gradient: "linear-gradient(135deg, #7c5cff, #38dfff)",
    demo: "#",
    github: "#",
  },
  {
    title: "Nic & Mia — By the Seashore",
    description: "A responsive frontend site for a children's swimwear brand with a clean product showcase.",
    tech: ["HTML", "CSS", "JavaScript"],
    image: null,
    gradient: "linear-gradient(135deg, #ff5cad, #7c5cff)",
    demo: "#",
    github: "#",
  },
  {
    title: "Emotion Recognition from Speech",
    description: "A Final Year Project — a machine learning model that detects emotions from speech.",
    tech: ["Python", "Machine Learning"],
    image: null,
    gradient: "linear-gradient(135deg, #38dfff, #35e8c3)",
    demo: "#",
    github: "#",
  },
];

function ProjectCard({ project, index }) {
  const reveal = useScrollReveal();
  const tilt = useTilt(6);

  return (
    <article
      ref={(node) => { reveal.current = node; tilt.ref.current = node; }}
      className="project-card glass reveal"
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
    >
      <div className="project-card__media" style={{ background: project.image ? undefined : project.gradient }}>
        {project.image && <img src={project.image} alt={project.title} />}
        <span className="project-card__index">{String(index + 1).padStart(2, "0")}</span>

        <div className="project-card__overlay">
          <a href={project.demo} className="project-card__view">View Project →</a>
        </div>
      </div>

      <div className="project-card__body">
        <h3 className="project-card__title">{project.title}</h3>
        <p className="project-card__desc">{project.description}</p>

        <div className="project-card__tech">
          {project.tech.map((t) => (
            <span key={t} className="project-card__pill">{t}</span>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function Projects() {
  return (
    <section id="projects" className="projects">
      <div className="container">
        <p className="section-label">Projects</p>

        <div className="projects__grid">
          {projects.map((project, i) => (
            <ProjectCard project={project} index={i} key={project.title} />
          ))}
        </div>
      </div>
    </section>
  );
}
