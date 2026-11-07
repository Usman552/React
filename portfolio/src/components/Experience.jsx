"use client";

import useScrollReveal from "../hooks/useScrollReveal";
import { useContent } from "../context/content";
import SectionHead from "./SectionHead";
import "./Experience.css";

// Fixed locale and UTC so the server and the browser print the same text.
const monthYear = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

function period({ kind, start_date, end_date, is_current }) {
  const start = start_date ? monthYear.format(new Date(start_date)) : null;
  if (kind === "certification") {
    if (!start) return "";
    return end_date ? `${start} — expires ${monthYear.format(new Date(end_date))}` : `Issued ${start}`;
  }
  const end = is_current ? "Present" : end_date ? monthYear.format(new Date(end_date)) : null;
  return start && end ? `${start} — ${end}` : start || end || "";
}

function Entry({ item, index }) {
  const ref = useScrollReveal();
  const meta = [item.organization, item.employment_type, item.location].filter(Boolean);
  const isCert = item.kind === "certification";

  return (
    <li
      ref={ref}
      className={`xp__item reveal ${item.is_current ? "is-current" : ""}`}
      style={{ transitionDelay: `${index * 0.08}s` }}
    >
      <span className="xp__marker" aria-hidden="true" />
      <div className="xp__top">
        <p className="xp__period">{period(item)}</p>
        {item.is_current && <span className="xp__now">Now</span>}
      </div>
      <div className="xp__head">
        {item.logo_url && <img className="xp__logo" src={item.logo_url} alt="" loading="lazy" />}
        <div>
          <h3 className="xp__title">{item.title}</h3>
          {meta.length > 0 && <p className="xp__meta">{meta.join(" · ")}</p>}
        </div>
      </div>
      {item.description && <p className="xp__text">{item.description}</p>}
      {item.highlights?.length > 0 && (
        <ul className="xp__highlights">
          {item.highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      )}
      {(item.url || item.credential_id) && (
        <p className="xp__links">
          {item.credential_id && <span className="xp__credential">ID {item.credential_id}</span>}
          {item.url && (
            <a href={item.url} target="_blank" rel="noreferrer" className="xp__link">
              {isCert ? "View credential" : "Visit"} <span aria-hidden="true">↗</span>
            </a>
          )}
        </p>
      )}
    </li>
  );
}

function Column({ title, items }) {
  if (!items.length) return null;
  return (
    <div className="xp__col">
      <h3 className="xp__col-title">
        {title} <span>{String(items.length).padStart(2, "0")}</span>
      </h3>
      <ol className="xp__list">
        {items.map((item, i) => (
          <Entry key={item.id} item={item} index={i} />
        ))}
      </ol>
    </div>
  );
}

/** Work on one side, education and certifications on the other. Newest first. */
export default function Experience({ index }) {
  const { experience, settings } = useContent();
  const work = experience.filter((e) => e.kind === "work");
  const learning = experience.filter((e) => e.kind !== "work");
  const single = !work.length || !learning.length;

  return (
    <section id="experience" className="section xp">
      <div className="container">
        <SectionHead section={settings.sections.experience} index={index} split />
        <div className={`xp__grid ${single ? "xp__grid--single" : ""}`}>
          <Column title="Work" items={work} />
          <Column title="Education & certifications" items={learning} />
        </div>
      </div>
    </section>
  );
}
