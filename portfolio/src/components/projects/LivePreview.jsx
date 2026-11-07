"use client";

import { useState } from "react";
import { isExternal, safeUrl } from "../../lib/url";
import ProjectCover from "./ProjectCover";

/**
 * The demo inside a browser-style frame. Shows the screenshot first and only
 * loads the live site when asked, so heavy demos never slow the page down.
 */
export default function LivePreview({ project }) {
  const demo = safeUrl(project.demo_url);
  const [live, setLive] = useState(false);
  // Absolute demo URLs show their host; site-relative ones show the path.
  const host = demo ? (isExternal(demo) ? new URL(demo).host : demo) : null;

  return (
    <figure className="preview">
      <div className="preview__bar">
        <span className="preview__dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="preview__url">{host || "Preview"}</span>
        {demo && (
          <a className="preview__open" href={demo} target="_blank" rel="noreferrer">
            Open in new tab <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>

      <div className="preview__screen">
        {live ? (
          <iframe
            className="preview__frame"
            src={demo}
            title={`${project.title} live demo`}
            loading="lazy"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        ) : (
          <>
            <ProjectCover project={project} eager className="preview__cover" />
            {demo && (
              <button type="button" className="preview__play btn btn--primary" onClick={() => setLive(true)}>
                <span aria-hidden="true">▶</span> Try the live demo here
              </button>
            )}
          </>
        )}
      </div>

      {live && (
        <figcaption className="preview__note">
          Some sites can't run inside a frame. If it stays blank, use “Open in new tab”.
        </figcaption>
      )}
    </figure>
  );
}
