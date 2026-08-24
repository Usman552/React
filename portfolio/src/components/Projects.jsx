import { useMemo, useState } from "react";
import useScrollReveal from "../hooks/useScrollReveal";
import { projects, categories } from "../data/projects";
import { social } from "../data/site";
import "./Projects.css";

function isLive(url) {
  return Boolean(url) && url !== "#";
}

function ProjectCard({ project, index }) {
  const ref = useScrollReveal();
  const live = isLive(project.demo);

  return (
    <article
      ref={ref}
      className="project glass reveal"
      style={{ transitionDelay: `${(index % 3) * 0.07}s` }}
    >
      <div
        className="project__cover"
        style={{ background: project.image ? undefined : project.gradient }}
      >
        {project.image && (
          <img src={project.image} alt={project.title} loading="lazy" />
        )}
        {project.featured && <span className="project__badge">Featured</span>}
      </div>

      <div className="project__body">
        <div className="project__head">
          <h3 className="project__title">{project.title}</h3>
          <span className="project__category">{project.category}</span>
        </div>

        <p className="project__desc">{project.description}</p>

        <div className="project__tech">
          {project.tech.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>

        <div className="project__links">
          {live ? (
            <a
              className="project__link project__link--primary"
              href={project.demo}
              target="_blank"
              rel="noreferrer"
            >
              Live demo
              <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <span className="project__link project__link--soon">Demo soon</span>
          )}

          {project.github && (
            <a
              className="project__link"
              href={project.github}
              target="_blank"
              rel="noreferrer"
            >
              Code
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export default function Projects() {
  const [filter, setFilter] = useState("All");

  const visible = useMemo(
    () =>
      filter === "All"
        ? projects
        : projects.filter((project) => project.category === filter),
    [filter]
  );

  const available = categories.filter(
    (category) =>
      category === "All" || projects.some((p) => p.category === category)
  );

  return (
    <section id="projects" className="section projects">
      <div className="container">
        <div className="projects__head">
          <div className="section__head projects__intro">
            <p className="section-label">Projects</p>
            <h2 className="section__title">
              Selected <span className="text-gradient">work</span>.
            </h2>
            <p className="section__lead">
              Client builds, full-stack apps and experiments — each one deployed
              and running.
            </p>
          </div>

          <div
            className="projects__filters"
            role="tablist"
            aria-label="Filter projects"
          >
            {available.map((category) => (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={filter === category}
                className={`projects__filter ${filter === category ? "is-active" : ""}`}
                onClick={() => setFilter(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="projects__grid">
          {visible.map((project, i) => (
            <ProjectCard key={project.title} project={project} index={i} />
          ))}
        </div>

        <p className="projects__more">
          More work on{" "}
          <a href={social.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </p>
      </div>
    </section>
  );
}
