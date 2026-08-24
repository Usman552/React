import useScrollReveal from "../hooks/useScrollReveal";
import useCountUp from "../hooks/useCountUp";
import "./About.css";

function Stat({ target, suffix, label }) {
  const { ref, value } = useCountUp(target);
  return (
    <div className="about__stat">
      <span ref={ref} className="about__value">
        {value}
        {suffix}
      </span>
      <span className="about__label">{label}</span>
    </div>
  );
}

const focus = [
  "React & Next.js applications",
  "TypeScript-first codebases",
  "REST API integration",
  "Firebase Auth & Firestore",
  "Responsive, accessible UI",
  "Performance & clean code",
];

export default function About() {
  const cardRef = useScrollReveal();
  const asideRef = useScrollReveal();

  return (
    <section id="about" className="section about">
      <div className="container">
        <div className="section__head">
          <p className="section-label">About Me</p>
          <h2 className="section__title">
            Developer who cares about{" "}
            <span className="text-gradient">how it feels</span>, not just how it looks.
          </h2>
        </div>

        <div className="about__grid">
          <div ref={cardRef} className="about__card glass reveal">
            <p className="about__text">
              I&apos;m <strong>Usman Qasim</strong>, a Front-End Developer based in
              Multan, Pakistan. I started out writing PHP, Laravel and CodeIgniter
              backends, which taught me how data actually moves through an
              application — and that perspective now shapes every interface I build.
            </p>

            <p className="about__text">
              Today I work mainly in <strong>React</strong> and{" "}
              <strong>Next.js</strong> with <strong>TypeScript</strong>. I integrate
              REST APIs with proper loading, empty and error states, secure apps with{" "}
              <strong>Firebase Authentication</strong>, and manage state with Redux
              Toolkit. Every build ships responsive, keyboard-accessible and with a
              dark/light theme — because those aren&apos;t extras, they&apos;re the baseline.
            </p>

            <p className="about__text">
              I&apos;m currently completing my BS in Computer Science (graduating 2026)
              and taking on freelance and remote front-end work.
            </p>

            <div className="about__stats">
              <Stat target={1} suffix="+" label="Years Experience" />
              <Stat target={10} suffix="+" label="Projects Built" />
              <Stat target={5} suffix="+" label="Core Technologies" />
              <Stat target={2026} suffix="" label="Graduating" />
            </div>
          </div>

          <aside ref={asideRef} className="about__aside glass reveal">
            <h3 className="about__aside-title">What I focus on</h3>
            <ul className="about__focus">
              {focus.map((item) => (
                <li key={item}>
                  <span className="about__tick" aria-hidden="true">✓</span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="about__meta">
              <div>
                <span className="about__meta-key">Location</span>
                <span className="about__meta-val">Multan, Pakistan</span>
              </div>
              <div>
                <span className="about__meta-key">Availability</span>
                <span className="about__meta-val about__meta-val--open">
                  Open to work
                </span>
              </div>
              <div>
                <span className="about__meta-key">Languages</span>
                <span className="about__meta-val">English, Urdu</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
