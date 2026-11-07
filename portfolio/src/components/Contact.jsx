"use client";

import { useEffect, useRef, useState } from "react";
import useScrollReveal from "../hooks/useScrollReveal";
import { useContent } from "../context/content";
import { backendConfigured, submitContact } from "../lib/publicContent";
import SectionHead from "./SectionHead";
import HirePlatforms from "./HirePlatforms";
import SocialLinks from "./SocialLinks";
import { otherSocials } from "../lib/platforms";
import "./Contact.css";

export default function Contact({ index }) {
  const { profile, settings } = useContent();
  const ref = useScrollReveal();
  // When the form appeared; the server rejects submissions that are too fast to be human.
  const startedAt = useRef(0);
  const [state, setState] = useState({ status: "idle", error: "", fields: {} });

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const details = [
    profile.response_time && { key: "Response time", value: profile.response_time },
    profile.location && { key: "Based in", value: profile.location },
  ].filter(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      message: form.get("message"),
      company: form.get("company"),
      startedAt: startedAt.current,
    };

    if (!backendConfigured) {
      // Static build without a backend: hand the message to the mail client.
      const subject = encodeURIComponent(`Project enquiry from ${payload.name}`);
      const body = encodeURIComponent(`${payload.message}\n\n—\n${payload.name}\n${payload.email}`);
      window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
      setState({ status: "sent", error: "", fields: {} });
      return;
    }

    setState({ status: "sending", error: "", fields: {} });
    const result = await submitContact(payload);

    if (result.ok) {
      formEl.reset();
      setState({ status: "sent", error: "", fields: {} });
    } else {
      setState({ status: "error", error: result.error, fields: result.fields });
    }
  };

  const { status, error, fields } = state;
  const fieldProps = (name) => ({
    name,
    "aria-invalid": fields[name] ? true : undefined,
    "aria-describedby": fields[name] ? `contact-${name}-error` : undefined,
  });
  const fieldError = (name) =>
    fields[name] && (
      <span id={`contact-${name}-error`} className="contact__error">
        {fields[name]}
      </span>
    );

  return (
    <section id="contact" className="section contact">
      <div className="container">
        <SectionHead section={settings.sections.contact} index={index} split />

        <div ref={ref} className="contact__grid reveal">
          <div className="contact__info">
            {profile.contact_intro && <p className="contact__text">{profile.contact_intro}</p>}

            {profile.email && (
              <a className="contact__email" href={`mailto:${profile.email}`}>
                <span className="contact__email-label">Email me directly</span>
                <span className="contact__email-address">
                  {profile.email}
                  <span className="contact__email-arrow" aria-hidden="true">
                    ↗
                  </span>
                </span>
              </a>
            )}

            {details.length > 0 && (
              <dl className="contact__details">
                {details.map((item) => (
                  <div key={item.key}>
                    <dt>{item.key}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            <HirePlatforms socials={profile.socials} label="Prefer to hire through a platform?" />

            <SocialLinks socials={otherSocials(profile.socials)} className="contact__socials" />
          </div>

          <form className="contact__form" onSubmit={handleSubmit} noValidate={backendConfigured}>
            <p className="contact__form-title">Tell me about your project</p>
            <label>
              <span>Name</span>
              <input type="text" placeholder="Your name" required maxLength={100} autoComplete="name" {...fieldProps("name")} />
              {fieldError("name")}
            </label>

            <label>
              <span>Email</span>
              <input
                type="email"
                placeholder="you@company.com"
                required
                maxLength={254}
                autoComplete="email"
                {...fieldProps("email")}
              />
              {fieldError("email")}
            </label>

            <label>
              <span>Message</span>
              <textarea
                rows="5"
                placeholder="What would you like to build?"
                required
                minLength={10}
                maxLength={5000}
                {...fieldProps("message")}
              ></textarea>
              {fieldError("message")}
            </label>

            {/* Honeypot: hidden from people and screen readers, bots fill it in. */}
            <label className="contact__trap" aria-hidden="true">
              <span>Company</span>
              <input type="text" name="company" tabIndex={-1} autoComplete="off" />
            </label>

            <button type="submit" className="btn btn--primary" disabled={status === "sending"}>
              {status === "sending" ? "Sending…" : status === "sent" ? "Message sent ✓" : "Send message"}
              {status === "idle" && (
                <span className="btn__arrow" aria-hidden="true">
                  →
                </span>
              )}
            </button>

            <p className="contact__note" role="status" aria-live="polite">
              {status === "error" && <span className="contact__error">{error}</span>}
              {status === "sent" &&
                (backendConfigured
                  ? "Thanks! Your message is in. I'll reply by email."
                  : "Your email app should open with the message ready to send.")}
              {(status === "idle" || status === "sending") &&
                (backendConfigured
                  ? "Your details are only used to reply to you."
                  : "This opens your email app with the message ready to send.")}
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
