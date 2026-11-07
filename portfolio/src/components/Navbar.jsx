"use client";

import { useEffect, useMemo, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import useActiveSection from "../hooks/useActiveSection";
import { visibleSections } from "../lib/sections";
import { useContent } from "../context/content";
import { usePathname } from "next/navigation";
import Link from "next/link";
import "./Navbar.css";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const content = useContent();
  const { profile, settings } = content;
  const links = useMemo(() => visibleSections(content), [content]);
  const pathname = usePathname();
  const isHome = pathname === "/";
  // Section tracking only applies on the home page; sub-pages highlight "Projects".
  const sectionIds = useMemo(() => (isHome ? links.map((link) => link.id) : []), [isHome, links]);
  const tracked = useActiveSection(sectionIds);
  const active = isHome ? tracked : pathname.startsWith("/projects") ? "projects" : null;
  const contactVisible = settings.sections.contact?.visible !== false;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
      <div className="container navbar__inner">
        <Link href="/#home" className="navbar__logo" onClick={() => setOpen(false)}>
          {profile.logo_text}
          <span className="text-gradient">.</span>
        </Link>

        <nav className={`navbar__links ${open ? "is-open" : ""}`} aria-label="Main">
          {links.map((link) => (
            <Link
              key={link.id}
              href={`/#${link.id}`}
              className={active === link.id ? "is-active" : ""}
              aria-current={active === link.id ? "true" : undefined}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="navbar__actions">
          {settings.theme?.allow_toggle !== false && <ThemeToggle />}

          {contactVisible && (
            <Link href="/#contact" className="navbar__cta" onClick={() => setOpen(false)}>
              Let&apos;s talk
              <span className="navbar__cta-dot" aria-hidden="true" />
            </Link>
          )}

          <button
            type="button"
            className={`navbar__toggle ${open ? "is-open" : ""}`}
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      {open && <div className="navbar__scrim" onClick={() => setOpen(false)} />}
    </header>
  );
}
