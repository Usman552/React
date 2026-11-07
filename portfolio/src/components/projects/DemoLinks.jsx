"use client";

import { useContent } from "../../context/content";
import { safeUrl } from "../../lib/url";

/**
 * "Live demo" button, plus "Code" only when enabled in Settings
 * (off by default: the portfolio shows demos, not source code).
 */
export default function DemoLinks({ project, large = false }) {
  const { settings } = useContent();
  const demo = safeUrl(project.demo_url);
  const repo = settings.project_display.show_code_links ? safeUrl(project.repo_url) : null;

  return (
    <>
      {demo ? (
        <a
          className={large ? "btn btn--primary" : "project__link project__link--primary"}
          href={demo}
          target="_blank"
          rel="noreferrer"
        >
          {large ? "View live demo" : "Live demo"}
          <span aria-hidden="true">↗</span>
        </a>
      ) : (
        <span className={large ? "btn btn--ghost project__soon" : "project__link project__link--soon"}>
          Demo coming soon
        </span>
      )}

      {repo && (
        <a className={large ? "btn btn--ghost" : "project__link"} href={repo} target="_blank" rel="noreferrer">
          Code
        </a>
      )}
    </>
  );
}
