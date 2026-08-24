import useScrollReveal from "../hooks/useScrollReveal";
import { services } from "../data/skills";
import "./Services.css";

function ServiceCard({ service, index }) {
  const ref = useScrollReveal();

  return (
    <article
      ref={ref}
      className="service-card glass reveal"
      style={{ transitionDelay: `${index * 0.08}s` }}
    >
      <span className="service-card__icon" aria-hidden="true">
        {service.icon}
      </span>

      <h3 className="service-card__title">{service.title}</h3>
      <p className="service-card__text">{service.text}</p>

      <div className="service-card__tags">
        {service.tags.map((tag) => (
          <span key={tag} className="pill">
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}

export default function Services() {
  return (
    <section id="services" className="section services">
      <div className="container">
        <div className="section__head">
          <p className="section-label">What I Do</p>
          <h2 className="section__title">
            Services built around a{" "}
            <span className="text-gradient">modern front-end stack</span>.
          </h2>
          <p className="section__lead">
            From a Figma file to a deployed, authenticated, API-connected app —
            here is where I add the most value.
          </p>
        </div>

        <div className="services__grid">
          {services.map((service, i) => (
            <ServiceCard key={service.title} service={service} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
