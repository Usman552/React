import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import useActiveSection from "../hooks/useActiveSection";
import { navLinks } from "../data/site";
import "./Navbar.css";

const sectionIds = navLinks.map((link) => link.id);

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const active = useActiveSection(sectionIds);

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
        <a href="#home" className="navbar__logo" onClick={() => setOpen(false)}>
          Usman<span className="text-gradient">.</span>
        </a>

        <nav className={`navbar__links ${open ? "is-open" : ""}`} aria-label="Main">
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className={active === link.id ? "is-active" : ""}
              aria-current={active === link.id ? "true" : undefined}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}

          <a href="#contact" className="navbar__cta" onClick={() => setOpen(false)}>
            Hire Me
          </a>
        </nav>

        <div className="navbar__actions">
          <ThemeToggle />

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
