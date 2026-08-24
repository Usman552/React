import useTypewriter from "../hooks/useTypewriter";
import { resumeUrl } from "../data/site";
import "./Hero.css";

const stack = [
  "React",
  "Next.js",
  "TypeScript",
  "Redux Toolkit",
  "Firebase Auth",
  "REST APIs",
  "Tailwind CSS",
  "Laravel",
  "MySQL",
  "Git",
];

const roles = [
  "React Developer",
  "Next.js Developer",
  "TypeScript Engineer",
  "API Integration Specialist",
];

export default function Hero() {
  const role = useTypewriter(roles);

  return (
    <section id="home" className="hero">
      <div className="container hero__inner">
        <div className="hero__text">
          <span className="hero__badge glass">
            <span className="hero__dot"></span>
            Available for freelance &amp; full-time work
          </span>

          <h1 className="hero__title">
            Hi, I&apos;m Usman Qasim —<br />I build{" "}
            <span className="text-gradient">fast, modern</span> web apps.
          </h1>

          <p className="hero__role" aria-label={roles.join(", ")}>
            <span className="hero__role-prefix">&gt;</span>
            <span className="hero__role-text">{role}</span>
            <span className="hero__caret" aria-hidden="true"></span>
          </p>

          <p className="hero__subtitle">
            Front-End Developer from Multan, Pakistan. I turn designs into
            production-ready React and Next.js interfaces — typed with
            TypeScript, wired to real REST APIs, secured with Firebase
            Authentication, and responsive on every screen.
          </p>

          <div className="hero__actions">
            <a href="#projects" className="btn btn--primary">
              View Projects
            </a>
            <a href="#contact" className="btn btn--ghost">
              Get in Touch
            </a>
            <a
              href={resumeUrl}
              className="btn btn--ghost"
              target="_blank"
              rel="noreferrer"
              type="application/pdf"
            >
              View Resume
              <span aria-hidden="true">↗</span>
            </a>
          </div>

          <ul className="hero__quickfacts">
            <li>
              <strong>10+</strong>
              <span>Projects shipped</span>
            </li>
            <li>
              <strong>100%</strong>
              <span>Responsive builds</span>
            </li>
            <li>
              <strong>&lt; 24h</strong>
              <span>Reply time</span>
            </li>
          </ul>
        </div>

        <div className="hero__visual">
          <div className="hero__ring"></div>
          <div className="hero__photo glass">
            <img src="/profile.png" alt="Usman Qasim" width="360" height="360" />
          </div>

          <span className="hero__float hero__float--1 glass">React</span>
          <span className="hero__float hero__float--2 glass">Next.js</span>
          <span className="hero__float hero__float--3 glass">TypeScript</span>
          <span className="hero__float hero__float--4 glass">Firebase</span>
        </div>
      </div>

      <div className="hero__marquee" aria-hidden="true">
        <div className="hero__marquee-track">
          {[...stack, ...stack].map((item, i) => (
            <span key={i} className="hero__marquee-item">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
