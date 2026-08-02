import React, { useState } from "react";
import useScrollReveal from "../hooks/useScrollReveal";
import "./Contact.css";

export default function Contact() {
  const ref = useScrollReveal();
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    e.target.reset();
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <section id="contact" className="contact">
      <div className="container">
        <p className="section-label">Contact</p>

        <div ref={ref} className="contact__box glass reveal">
          <div className="contact__intro">
            <h2 className="contact__heading">
              Let's build{" "}
              <span className="text-gradient">something great.</span>
            </h2>
            <p className="contact__text">
              Have a project in mind, or just want to say hi? Send a message.
            </p>
            <div className="contact__socials">
              <a href="mailto:usmanaa552@gmail.com">Email</a>
              <a href="https://github.com/Usman552" target="_blank" rel="noreferrer">
                GitHub
              </a>
              <a
                href="www.linkedin.com/in/usman-qasim-808326282"
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>
            </div>
          </div>

          <form className="contact__form" onSubmit={handleSubmit}>
            <input type="text" placeholder="Your Name" required />
            <input type="email" placeholder="Your Email" required />
            <textarea rows="4" placeholder="Your Message" required></textarea>
            <button type="submit" className="btn btn--primary">
              {sent ? "Message Sent ✓" : "Send Message"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
