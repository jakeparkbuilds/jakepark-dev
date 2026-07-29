import About from "./components/about";
import Connect from "./components/connect";
import Education from "./components/education";
import Experience from "./components/experience";
import Hero from "./components/hero";
import Nav from "./components/nav";
import Projects from "./components/projects";
import Section from "./components/section";
import Skills from "./components/skills";
import { CONTENT_SECTIONS } from "./lib/sections";

export default function Home() {
  return (
    <main>
      <Nav />
      <Hero />
      {CONTENT_SECTIONS.map(({ number, id, label }) =>
        id === "about" ? (
          <About key={id} number={number} id={id} label={label} />
        ) : id === "experience" ? (
          <Experience key={id} number={number} id={id} label={label} />
        ) : id === "education" ? (
          <Education key={id} number={number} id={id} label={label} />
        ) : id === "projects" ? (
          <Projects key={id} number={number} id={id} label={label} />
        ) : id === "skills" ? (
          <Skills key={id} number={number} id={id} label={label} />
        ) : id === "connect" ? (
          <Connect key={id} id={id} />
        ) : (
          <Section key={id} number={number} id={id} label={label} />
        )
      )}
    </main>
  );
}
