"use client";

import Link from "next/link";
import DemoLinks from "../components/projects/DemoLinks";
import LivePreview from "../components/projects/LivePreview";
import { categoryPath, projectPath, yearOf } from "../components/projects/projectUtils";
import { useContent } from "../context/content";
import { safeUrl } from "../lib/url";
import "../components/projects/Projects.css";
import "./ProjectsPage.css";
import "./ProjectPage.css";

/**
 * One project: live demo preview, features, screenshots and details.
 * The route only renders this for slugs that exist (otherwise it 404s).
 */
export default function ProjectPage({ slug }) {
  const { projects } = useContent();
  const index = projects.findIndex((p) => p.slug === slug);
  const project = projects[index];
  if (!project) return null;

  const year = yearOf(project.completed_at);
  const features = project.features || [];
  const gallery = (project.gallery || [])
    .map((item) => ({ src: safeUrl(item?.url), alt: item?.alt || "" }))
    .filter((item) => item.src);
  const previous = projects[index - 1];
  const next = projects[index + 1];

  return (
    <article className="section page project-page">
      <div className="container">
        <Link href="/projects" className="back-link">
          <span aria-hidden="true">←</span> All projects
        </Link>

        <header className="project-page__head">
          <p className="section-label">
            <Link href={categoryPath(project.category)}>{project.category}</Link>
            {year && <span> · {year}</span>}
          </p>
          <h1 className="project-page__title">{project.title}</h1>
          {project.summary && <p className="project-page__summary">{project.summary}</p>}
          <div className="project-page__actions">
            <DemoLinks project={project} large />
          </div>
          {project.tech.length > 0 && (
            <ul className="project-page__tech" aria-label="Built with">
              {project.tech.map((t) => (
                <li key={t} className="pill">
                  {t}
                </li>
              ))}
            </ul>
          )}
        </header>

        <LivePreview project={project} />

        {(features.length > 0 || project.details) && (
          <div className={`project-page__body ${features.length && project.details ? "" : "is-single"}`}>
            {features.length > 0 && (
              <section className="project-page__card glass" aria-labelledby="features-title">
                <h2 id="features-title" className="project-page__h2">
                  Key features
                </h2>
                <ul className="project-page__features">
                  {features.map((feature) => (
                    <li key={feature}>
                      <span className="project-page__tick" aria-hidden="true">
                        ✓
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {project.details && (
              <section className="project-page__card glass" aria-labelledby="about-title">
                <h2 id="about-title" className="project-page__h2">
                  About this project
                </h2>
                {project.details.split(/\n{2,}/).map((para, i) => (
                  <p key={i} className="project-page__text">
                    {para}
                  </p>
                ))}
              </section>
            )}
          </div>
        )}

        {gallery.length > 0 && (
          <section className="project-page__gallery-wrap" aria-labelledby="gallery-title">
            <h2 id="gallery-title" className="project-page__h2">
              Screenshots
            </h2>
            <div className="project-page__gallery">
              {gallery.map((img) => (
                <a key={img.src} href={img.src} target="_blank" rel="noreferrer" className="project-page__shot">
                  <img src={img.src} alt={img.alt || `${project.title} screenshot`} loading="lazy" decoding="async" />
                </a>
              ))}
            </div>
          </section>
        )}

        <nav className="project-page__pager" aria-label="More projects">
          {previous ? (
            <Link href={projectPath(previous)} className="project-page__pager-link">
              <small>← Previous</small>
              {previous.title}
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={projectPath(next)} className="project-page__pager-link project-page__pager-link--next">
              <small>Next →</small>
              {next.title}
            </Link>
          )}
        </nav>
      </div>
    </article>
  );
}
