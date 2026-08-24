import ThemeProvider from "./context/ThemeProvider";
import ScrollProgress from "./components/ScrollProgress";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import Services from "./components/Services";
import Skills from "./components/Skills";
import Projects from "./components/Projects";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import BackToTop from "./components/BackToTop";
import "./index.css";

export default function App() {
  return (
    <ThemeProvider>
      <div className="aurora" aria-hidden="true">
        <div className="aurora__grid"></div>
        <div className="aurora__blob aurora__blob--1"></div>
        <div className="aurora__blob aurora__blob--2"></div>
      </div>

      <ScrollProgress />
      <Navbar />

      <main>
        <Hero />
        <About />
        <Services />
        <Skills />
        <Projects />
        <Contact />
      </main>

      <Footer />
      <BackToTop />
    </ThemeProvider>
  );
}
