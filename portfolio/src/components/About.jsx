"use client";

import useScrollReveal from "../hooks/useScrollReveal";
import useCountUp from "../hooks/useCountUp";
import { useContent } from "../context/content";
import RichText from "./RichText";
import SectionHead from "./SectionHead";
import "./About.css";

function Stat({ target, suffix, label }) {
  const { ref, value } = useCountUp(target);
  return (
    <div className="about__stat">
      <span ref={ref} className="about__value">
        {value}
        <span className="about__suffix">{suffix}</span>
      </span>
      <span className="about__label">{label}</span>
    </div>
  );
}

export default function About({ index }) {
  const { profile, settings } = useContent();
  const storyRef = useScrollReveal();
  const asideRef = useScrollReveal();
  const statsRef = useScrollReveal();
  const [lead, ...rest] = profile.bio;

  const meta = [
    { key: "Based in", value: profile.location },
    {
      key: "Experience",
      value: Number.isFinite(profile.experience_years) ? `${profile.experience_years}+ years` : "",
    },
    { key: "Status", value: profile.availability_label, open: profile.availability_open },
    { key: "Languages", value: profile.languages },
  ].filter((item) => item.value);

  return (
    <section id="about" className="section about">
      <div className="container">
        <SectionHead section={settings.sections.about} index={index} />

        <div className="about__grid">
          <div ref={storyRef} className="about__story reveal">
            {lead && (
              <p className="about__lead">
                <RichText text={lead} />
              </p>
            )}
            {rest.map((paragraph, i) => (
              <p key={i} className="about__text">
                <RichText text={paragraph} />
              </p>
            ))}
          </div>

          <aside ref={asideRef} className="about__aside reveal">
            {meta.length > 0 && (
              <dl className="about__meta">
                {meta.map((item) => (
                  <div key={item.key} className="about__meta-row">
                    <dt>{item.key}</dt>
                    <dd>
                      {item.open !== undefined && (
                        <span className={`pulse-dot ${item.open ? "" : "pulse-dot--off"}`} aria-hidden="true" />
                      )}
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {profile.focus.length > 0 && (
              <div className="about__focus">
                <h3 className="about__focus-title">What I focus on</h3>
                <ul>
                  {profile.focus.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>

        {profile.stats.length > 0 && (
          <div ref={statsRef} className="about__stats reveal">
            {profile.stats.map((stat) => (
              <Stat key={stat.label} target={Number(stat.value) || 0} suffix={stat.suffix || ""} label={stat.label} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
