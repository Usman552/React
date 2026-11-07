"use client";

import Link from "next/link";
import { useContent } from "../context/content";
import { safeUrl } from "../lib/url";
import SectionHead from "./SectionHead";
import WorkCard from "./projects/WorkCard";
import { categoryCounts, categoryPath } from "./projects/projectUtils";
import "./projects/Projects.css";

/** Home page "Selected work": a lead project, a two-up grid, the rest one click away. */
export default function Projects({ index }) {
  const { projects, profile, settings } = useContent();
  const display = settings.project_display;

  const limit = Number(display.initial_count) > 0 ? Number(display.initial_count) : Infinity;
  const selection = projects.filter((p) => p.show_on_home !== false).slice(0, limit);
  const categories = categoryCounts(projects);

  const github = profile.socials.find((s) => /github\.com/i.test(s.url || ""));
  const githubUrl = display.show_github_link && github ? safeUrl(github.url) : null;

  return (
    <section id="projects" className="section projects">
      <div className="container">
        <SectionHead section={settings.sections.projects} index={index} split />

        {selection.length > 0 ? (
          <div className="work-grid">
            {selection.map((project, i) => (
              <WorkCard key={project.id} project={project} index={i} lead={i === 0 && selection.length > 1} />
            ))}
          </div>
        ) : (
          <p className="projects__empty">New projects are on the way.</p>
        )}

        {projects.length > 0 && (
          <div className="projects__more-work">
            <div className="projects__more-text">
              <h3 className="projects__more-title">
                {projects.length > selection.length
                  ? `${projects.length - selection.length} more ${projects.length - selection.length === 1 ? "project" : "projects"} to explore`
                  : "Browse all projects"}
              </h3>
              {categories.length > 1 && (
                <nav className="projects__browse" aria-label="Browse projects by category">
                  {categories.map((c) => (
                    <Link key={c.name} href={categoryPath(c.name)} className="projects__chip">
                      {c.name}
                      <span className="projects__filter-count">{c.count}</span>
                    </Link>
                  ))}
                </nav>
              )}
            </div>
            <Link href="/projects" className="btn btn--primary">
              View all projects
              <span className="btn__arrow" aria-hidden="true">
                →
              </span>
            </Link>
          </div>
        )}

        {githubUrl && (
          <p className="projects__github">
            More experiments on{" "}
            <a className="link-underline" href={githubUrl} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </p>
        )}
      </div>
    </section>
  );
}
