import { coverGradients } from "../../data/site";
import { safeUrl } from "../../lib/url";

/** Screenshot, or a gradient with the project's initial when there is none. */
export default function ProjectCover({ project, eager = false, className = "" }) {
  const thumb = safeUrl(project.thumbnail_url);
  return (
    <div
      className={`project__cover ${className}`}
      style={{ background: thumb ? undefined : coverGradients[project.cover] || coverGradients["violet-cyan"] }}
    >
      {thumb ? (
        <img src={thumb} alt="" loading={eager ? "eager" : "lazy"} decoding="async" />
      ) : (
        <span className="project__monogram" aria-hidden="true">
          {project.title.slice(0, 1)}
        </span>
      )}
      {project.featured && <span className="project__badge">Featured</span>}
    </div>
  );
}
