"use client";

import About from "../components/About";
import Contact from "../components/Contact";
import Experience from "../components/Experience";
import Hero from "../components/Hero";
import Projects from "../components/Projects";
import Services from "../components/Services";
import Skills from "../components/Skills";
import { useContent } from "../context/content";
import { visibleSections } from "../lib/sections";

const SECTIONS = { projects: Projects, services: Services, about: About, experience: Experience, skills: Skills, contact: Contact };

/**
 * The one-page portfolio. Work comes first: it's what clients came to see.
 * Sections can be hidden in Admin → Settings; numbering follows what's shown.
 */
export default function HomePage() {
  const visible = visibleSections(useContent()).map((link) => link.id);

  return (
    <>
      <Hero />
      {visible.map((id, i) => {
        const Section = SECTIONS[id];
        return <Section key={id} index={i + 1} />;
      })}
    </>
  );
}
