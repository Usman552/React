"use client";

import Link from "next/link";
import useScrollReveal from "../../hooks/useScrollReveal";
import { isExternal, safeUrl } from "../../lib/url";
import DemoLinks from "./DemoLinks";
import ProjectCover from "./ProjectCover";
import { projectPath, yearOf } from "./projectUtils";

function hostOf(url) {
  const safe = safeUrl(url);
  return safe && isExternal(safe) ? new URL(safe).host : null;
}

/**
 * Home page project card. The `lead` card spans the full grid width and
 * shows a little more (features); the rest are compact two-up cards.
 */
export default function WorkCard({ project, index, lead = false }) {
  const ref = useScrollReveal();
  const href = projectPath(project);
  const year = yearOf(project.completed_at);
  const features = lead ? (project.features || []).slice(0, 2) : [];

  return (
    <article
      ref={ref}
      className={`work-card reveal ${lead ? "work-card--lead" : ""}`}
      style={{ transitionDelay: `${(index % 2) * 0.08}s` }}
    >
      <Link href={href} className="work-card__media" tabIndex={-1} aria-hidden="true">
        <div className="browser">
          <div className="browser__bar">
            <span className="browser__dots">
              <i />
              <i />
              <i />
            </span>
            <span className="browser__url">{hostOf(project.demo_url) || project.slug}</span>
          </div>
          <ProjectCover project={project} eager={index < 2} />
        </div>
      </Link>

      <div className="work-card__body">
        <p className="work-card__meta">
          <span className="work-card__index">{String(index + 1).padStart(2, "0")}</span>
          <span>{project.category}</span>
          {year && <span>{year}</span>}
        </p>

        <h3 className="work-card__title">
          <Link href={href}>{project.title}</Link>
        </h3>

        {project.summary && <p className="work-card__summary">{project.summary}</p>}

        {features.length > 0 && (
          <ul className="work-card__features">
            {features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        )}

        {project.tech.length > 0 && (
          <ul className="work-card__tech" aria-label="Built with">
            {project.tech.slice(0, lead ? 5 : 4).map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}

        <div className="work-card__actions">
          <DemoLinks project={project} />
          <Link href={href} className="link-underline work-card__more">
            Case study <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
