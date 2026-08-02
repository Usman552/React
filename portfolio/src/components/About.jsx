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

export default function About() {
  const ref = useScrollReveal();

  return (
    <section id="about" className="about">
      <div className="container">
        <p className="section-label">About Me</p>

        <div ref={ref} className="about__card glass reveal">
          <p className="about__text">
            I'm <strong>Usman Qasim</strong>, a Front-End Developer based in
            Multan, Pakistan. My background is in PHP, Laravel and CodeIgniter,
            and I now focus on building modern, animated and premium-feel
            interfaces with React.
          </p>

          <div className="about__stats">
            <Stat target={1} suffix="+" label="Year Experience" />
            <Stat target={10} suffix="+" label="Projects Built" />
            <Stat target={2026} suffix="" label="Graduating" />
          </div>
        </div>
      </div>
    </section>
  );
}
