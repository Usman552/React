import React from "react";
import "./Hero.css";

export default function Hero() {
  return (
    <section id="home" className="hero">
      <div className="container hero__inner">
        <div className="hero__avatar clay">UQ</div>

        <h1 className="hero__title">
          Hi, I'm <span className="hero__name">Usman Qasim</span>
        </h1>
        <p className="hero__role">Front-End Developer</p>

        <p className="hero__subtitle">
          Multan, Pakistan se front-end developer — React, JavaScript aur
          Laravel ke saath clean aur simple web interfaces banata hoon.
        </p>

        <div className="hero__actions">
          <a href="#projects" className="btn">View Projects</a>
          <a href="#contact" className="btn">Get in Touch</a>
        </div>
      </div>
    </section>
  );
}
