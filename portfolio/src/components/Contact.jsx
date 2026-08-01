import React, { useState } from "react";
import useScrollReveal from "../hooks/useScrollReveal";
import "./Contact.css";

export default function Contact() {
  const ref = useScrollReveal();
  const [sent, setSent] = useState(false);

  // Yahan apna form-handling logic laga sakte ho (EmailJS, Formspree,
  // apna backend, waghera). Abhi ye sirf UI hai.
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

        <form ref={ref} className="contact__form clay reveal" onSubmit={handleSubmit}>
          <input className="clay-inset" type="text" placeholder="Your Name" required />
          <input className="clay-inset" type="email" placeholder="Your Email" required />
          <textarea className="clay-inset" rows="4" placeholder="Your Message" required></textarea>

          <button type="submit" className="btn">
            {sent ? "Message Sent ✓" : "Send Message"}
          </button>
        </form>
      </div>
    </section>
  );
}
