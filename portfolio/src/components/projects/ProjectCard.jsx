"use client";

import useScrollReveal from "../../hooks/useScrollReveal";
import Link from "next/link";
import DemoLinks from "./DemoLinks";
import ProjectCover from "./ProjectCover";
import { projectPath, yearOf } from "./projectUtils";

export default function ProjectCard({ project, index = 0 }) {
  const ref = useScrollReveal();
  const href = projectPath(project);
  const year = yearOf(project.completed_at);

  return (
    <article
      ref={ref}
      className={`project glass reveal ${project.featured ? "project--featured" : ""}`}
      style={{ transitionDelay: `${(index % 3) * 0.07}s` }}
    >
      {/* The title link is the accessible one; the cover is a mouse shortcut. */}
      <Link href={href} className="project__cover-link" tabIndex={-1} aria-hidden="true">
        <ProjectCover project={project} />
      </Link>

      <div className="project__body">
        <div className="project__head">
          <h3 className="project__title">
            <Link href={href}>{project.title}</Link>
          </h3>
          <span className="project__category">{project.category}</span>
        </div>

        {year && <p className="project__year">{year}</p>}
        <p className="project__desc">{project.summary}</p>

        {project.tech.length > 0 && (
          <div className="project__tech">
            {project.tech.slice(0, 4).map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        )}

        <div className="project__links">
          <DemoLinks project={project} />
          <Link href={href} className="project__link project__link--more">
            Details <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
