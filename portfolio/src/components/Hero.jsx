"use client";

import useTypewriter from "../hooks/useTypewriter";
import { useContent } from "../context/content";
import HirePlatforms from "./HirePlatforms";
import RichText from "./RichText";
import { isExternal, safeUrl } from "../lib/url";
import "./Hero.css";

function CtaLink({ cta, primary }) {
  const href = safeUrl(cta?.href);
  if (!href || !cta.label) return null;
  const external = isExternal(href);
  return (
    <a
      href={href}
      className={`btn ${primary ? "btn--primary" : "btn--ghost"}`}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      {cta.label}
      {primary && (
        <span className="btn__arrow" aria-hidden="true">
          →
        </span>
      )}
    </a>
  );
}

const FALLBACK_ROLES = ["Developer"];

export default function Hero() {
  const { profile } = useContent();
  const roles = profile.roles.length ? profile.roles : FALLBACK_ROLES;
  const role = useTypewriter(roles);
  const resume = profile.show_resume ? safeUrl(profile.resume_url) : null;
  const photo = safeUrl(profile.photo_url);

  return (
    <section id="home" className="hero">
      <div className="container hero__grid">
        <div className="hero__copy">
          <div className="hero__meta">
            {profile.hero_badge && (
              <span className="hero__status">
                <span className={`pulse-dot ${profile.availability_open ? "" : "pulse-dot--off"}`} aria-hidden="true" />
                {profile.hero_badge}
              </span>
            )}
            {profile.location && <span className="hero__location">{profile.location}</span>}
          </div>

          <h1 className="hero__title">
            <RichText text={profile.hero_heading} />
          </h1>

          <div className="hero__intro">
            <p className="hero__role" aria-label={roles.join(", ")}>
              <span className="hero__role-prefix" aria-hidden="true">
                ↳
              </span>
              <span className="hero__role-text">{role}</span>
              <span className="hero__caret" aria-hidden="true"></span>
            </p>
            {profile.hero_subtitle && <p className="hero__subtitle">{profile.hero_subtitle}</p>}
          </div>

          <div className="hero__actions">
            <CtaLink cta={profile.cta_primary} primary />
            <CtaLink cta={profile.cta_secondary} />
            {resume && (
              <a href={resume} className="link-underline hero__resume" target="_blank" rel="noreferrer">
                Résumé <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>

          <HirePlatforms socials={profile.socials} variant="inline" label="Also hire me on" />
        </div>

        <div className="hero__portrait">
          <div className="portrait">
            <div className="portrait__frame">
              {photo && (
                <img
                  src={photo}
                  alt={profile.name}
                  width="480"
                  height="600"
                  fetchPriority="high"
                  decoding="async"
                />
              )}
            </div>

            <div className="portrait__card">
              <span className="portrait__name">{profile.name}</span>
              {profile.title && <span className="portrait__title">{profile.title}</span>}
            </div>

            {profile.hero_tags.slice(0, 4).map((tag, i) => (
              <span key={tag} className={`portrait__tag portrait__tag--${i + 1}`}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {profile.quick_facts.length > 0 && (
        <div className="container">
          <ul className="hero__facts">
            {profile.quick_facts.map((fact) => (
              <li key={`${fact.value}-${fact.label}`}>
                <strong>{fact.value}</strong>
                <span>{fact.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {profile.hero_stack.length > 0 && (
        <div className="hero__marquee" aria-hidden="true">
          <div className="hero__marquee-track">
            {[...profile.hero_stack, ...profile.hero_stack].map((item, i) => (
              <span key={i} className="hero__marquee-item">
                {item}
                <span className="hero__marquee-star">✦</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
