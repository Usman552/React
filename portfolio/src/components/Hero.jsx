import React from "react";
import "./Hero.css";

const stack = ["React", "JavaScript", "Laravel", "PHP", "Bootstrap", "MySQL", "Git"];

export default function Hero() {
  return (
    <section id="home" className="hero">
      <div className="container hero__inner">
        <div className="hero__text">
          <span className="hero__badge glass">
            <span className="hero__dot"></span>
            Available for freelance work
          </span>

          <h1 className="hero__title">
            Hi, I'm Usman Qasim —<br />
            I build <span className="text-gradient">animated</span> web experiences.
          </h1>

          <p className="hero__subtitle">
            A Front-End Developer based in Multan, Pakistan, crafting fast,
            clean and premium-feel interfaces with React and Laravel.
          </p>

          <div className="hero__actions">
            <a href="#projects" className="btn btn--primary">View Projects</a>
            <a href="#contact" className="btn btn--ghost">Get in Touch</a>
          </div>
        </div>

        <div className="hero__visual">
          <div className="hero__ring"></div>
          <div className="hero__photo glass">
            <img src="/profile.png" alt="Usman Qasim" />
          </div>

          <span className="hero__float hero__float--1 glass">React</span>
          <span className="hero__float hero__float--2 glass">Laravel</span>
          <span className="hero__float hero__float--3 glass">UI Design</span>
        </div>
      </div>

      <div className="hero__marquee">
        <div className="hero__marquee-track">
          {[...stack, ...stack].map((item, i) => (
            <span key={i} className="hero__marquee-item">{item}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
