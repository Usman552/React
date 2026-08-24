import { useState } from "react";
import useScrollReveal from "../hooks/useScrollReveal";
import { social } from "../data/site";
import "./Contact.css";

const details = [
  { key: "Email", value: social.email, href: `mailto:${social.email}` },
  { key: "Location", value: "Multan, Pakistan", href: null },
  { key: "Response time", value: "Usually within 24 hours", href: null },
];

export default function Contact() {
  const ref = useScrollReveal();
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    const form = new FormData(e.target);
    const name = form.get("name");
    const email = form.get("email");
    const message = form.get("message");

    // No backend on a static host — hand the message to the visitor's mail client.
    const subject = encodeURIComponent(`Project enquiry from ${name}`);
    const body = encodeURIComponent(`${message}\n\n—\n${name}\n${email}`);
    window.location.href = `mailto:${social.email}?subject=${subject}&body=${body}`;

    setSent(true);
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <section id="contact" className="section contact">
      <div className="container">
        <div className="section__head">
          <p className="section-label">Contact</p>
          <h2 className="section__title">
            Let&apos;s build{" "}
            <span className="text-gradient">something great</span>.
          </h2>
          <p className="section__lead">
            Have a project, a role, or just a question? Send a message and
            I&apos;ll get back to you.
          </p>
        </div>

        <div ref={ref} className="contact__box glass reveal">
          <div className="contact__intro">
            <h3 className="contact__heading">Get in touch</h3>
            <p className="contact__text">
              I&apos;m currently open to freelance projects and full-time
              front-end roles. Tell me what you&apos;re building and what you
              need from the front end.
            </p>

            <ul className="contact__details">
              {details.map((item) => (
                <li key={item.key}>
                  <span className="contact__key">{item.key}</span>
                  {item.href ? (
                    <a className="contact__val" href={item.href}>
                      {item.value}
                    </a>
                  ) : (
                    <span className="contact__val">{item.value}</span>
                  )}
                </li>
              ))}
            </ul>

            <div className="contact__socials">
              <a href={`mailto:${social.email}`}>Email</a>
              <a href={social.github} target="_blank" rel="noreferrer">
                GitHub
              </a>
              <a href={social.linkedin} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
            </div>
          </div>

          <form className="contact__form" onSubmit={handleSubmit}>
            <label>
              <span>Name</span>
              <input type="text" name="name" placeholder="Your name" required />
            </label>

            <label>
              <span>Email</span>
              <input type="email" name="email" placeholder="you@company.com" required />
            </label>

            <label>
              <span>Message</span>
              <textarea
                name="message"
                rows="5"
                placeholder="What would you like to build?"
                required
              ></textarea>
            </label>

            <button type="submit" className="btn btn--primary">
              {sent ? "Opening your mail app ✓" : "Send Message"}
            </button>

            <p className="contact__note">
              This opens your email app with the message ready to send.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
