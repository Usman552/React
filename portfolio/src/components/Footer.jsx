"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { visibleSections } from "../lib/sections";
import { useContent } from "../context/content";
import RichText from "./RichText";
import HirePlatforms from "./HirePlatforms";
import SocialLinks from "./SocialLinks";
import "./Footer.css";

export default function Footer() {
  const content = useContent();
  const { profile, settings } = content;
  const pathname = usePathname();
  const links = visibleSections(content);
  const contactVisible = settings.sections.contact?.visible !== false;
  // The home page ends with the contact section, so the call to action would repeat.
  const showCta = contactVisible && pathname !== "/";

  return (
    <footer className="footer">
      {showCta && (
        <div className="container footer__cta">
          <p className="footer__cta-label">
            <span className={`pulse-dot ${profile.availability_open ? "" : "pulse-dot--off"}`} aria-hidden="true" />
            {profile.availability_label || "Available for new projects"}
          </p>
          <h2 className="footer__cta-title">
            Have a project in mind? <span className="hl">Let&apos;s talk.</span>
          </h2>
          <Link href="/#contact" className="btn btn--primary">
            Start a project
            <span className="btn__arrow" aria-hidden="true">
              →
            </span>
          </Link>
          <HirePlatforms socials={profile.socials} variant="inline" label="or order on" />
        </div>
      )}

      <div className="container footer__main">
        <div className="footer__brand">
          <Link href="/#home" className="footer__logo">
            {profile.logo_text}
            <span className="text-gradient">.</span>
          </Link>
          {settings.footer_tagline && (
            <p className="footer__tagline">
              <RichText text={settings.footer_tagline} />
            </p>
          )}
        </div>

        <nav className="footer__col" aria-label="Footer">
          <p className="footer__heading">Explore</p>
          {links.map((item) => (
            <Link key={item.id} href={`/#${item.id}`}>
              {item.label}
            </Link>
          ))}
          <Link href="/projects">All projects</Link>
        </nav>

        <div className="footer__col">
          <p className="footer__heading">Connect</p>
          <SocialLinks email={profile.email} socials={profile.socials} className="footer__socials" />
        </div>
      </div>

      <div className="container footer__bottom">
        <p>
          © {new Date().getFullYear()} {profile.name}. All rights reserved.
        </p>
        {settings.footer_note && <p>{settings.footer_note}</p>}
      </div>
    </footer>
  );
}
