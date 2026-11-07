"use client";

import CategoryTabs from "../components/projects/CategoryTabs";
import ProjectCard from "../components/projects/ProjectCard";
import { categoryCounts } from "../components/projects/projectUtils";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useContent } from "../context/content";
import "../components/projects/Projects.css";
import "./ProjectsPage.css";

/** Every published project, browsable by category (?category=… in the URL). */
export default function ProjectsPage() {
  const { projects, settings } = useContent();
  const router = useRouter();
  const pathname = usePathname();
  const requested = useSearchParams().get("category");

  const selectCategory = (name) => {
    const query = name ? `?category=${encodeURIComponent(name)}` : "";
    router.replace(`${pathname}${query}`, { scroll: false });
  };

  const categories = categoryCounts(projects);
  const active = categories.some((c) => c.name === requested) ? requested : null;
  const visible = active ? projects.filter((p) => p.category === active) : projects;

  return (
    <section className="section page projects-page">
      <div className="container">
        <Link href="/#projects" className="back-link">
          <span aria-hidden="true">←</span> Back to home
        </Link>

        <div className="projects-page__head">
          <div className="section__head">
            <p className="section-label">Projects</p>
            <h1 className="section__title">
              {active ? (
                active
              ) : (
                <>
                  All <span className="text-gradient">projects</span>
                </>
              )}
            </h1>
            <p className="section__lead">
              {visible.length} {visible.length === 1 ? "project" : "projects"}. Open any project to see it running live.
            </p>
          </div>

          {settings.project_display.show_filters && categories.length > 1 && (
            <CategoryTabs
              categories={categories}
              total={projects.length}
              active={active}
              onChange={selectCategory}
            />
          )}
        </div>

        {visible.length > 0 ? (
          <div className="projects__grid" key={active || "all"}>
            {visible.map((project, i) => (
              <ProjectCard key={project.id} project={project} index={i} />
            ))}
          </div>
        ) : (
          <p className="projects__empty">No projects here yet.</p>
        )}
      </div>
    </section>
  );
}
