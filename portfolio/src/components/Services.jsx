"use client";

import useScrollReveal from "../hooks/useScrollReveal";
import { useContent } from "../context/content";
import SectionHead from "./SectionHead";
import "./Services.css";

function ServiceRow({ service, index }) {
  const ref = useScrollReveal();

  return (
    <li ref={ref} className="service reveal" style={{ transitionDelay: `${index * 0.06}s` }}>
      <span className="service__index">{String(index + 1).padStart(2, "0")}</span>

      <div className="service__main">
        <h3 className="service__title">{service.title}</h3>
        {service.tags.length > 0 && (
          <ul className="service__tags" aria-label="Technologies">
            {service.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        )}
      </div>

      <p className="service__text">{service.description}</p>

      <span className="service__icon" aria-hidden="true">
        {service.icon}
      </span>
    </li>
  );
}

export default function Services({ index }) {
  const { services, settings } = useContent();

  return (
    <section id="services" className="section services">
      <div className="container">
        <SectionHead section={settings.sections.services} index={index} split />

        <ol className="services__list">
          {services.map((service, i) => (
            <ServiceRow key={service.id} service={service} index={i} />
          ))}
        </ol>
      </div>
    </section>
  );
}
