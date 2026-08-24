import { navLinks, social } from "../data/site";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <a href="#home" className="footer__logo">
            Usman<span className="text-gradient">.</span>
          </a>
          <p className="footer__tagline">
            Front-End Developer — React, Next.js &amp; TypeScript.
            <br />
            Building fast, accessible interfaces from Multan, Pakistan.
          </p>
        </div>

        <nav className="footer__nav" aria-label="Footer">
          {navLinks.map((item) => (
            <a key={item.id} href={`#${item.id}`}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="footer__socials">
          <a href={`mailto:${social.email}`}>Email</a>
          <a href={social.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href={social.linkedin} target="_blank" rel="noreferrer">
            LinkedIn
          </a>
        </div>
      </div>

      <div className="container footer__bottom">
        <p>© {new Date().getFullYear()} Usman Qasim. All rights reserved.</p>
        <p className="footer__built">Built with React &amp; Vite.</p>
      </div>
    </footer>
  );
}
