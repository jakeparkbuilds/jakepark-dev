import About from "./components/about";
import Connect from "./components/connect";
import Hero from "./components/hero";
import Nav from "./components/nav";
import Section from "./components/section";
import { CONTENT_SECTIONS } from "./lib/sections";

export default function Home() {
  return (
    <main>
      <Nav />
      <Hero />
      {CONTENT_SECTIONS.map(({ number, id, label }) =>
        id === "about" ? (
          <About key={id} number={number} id={id} label={label} />
        ) : id === "connect" ? (
          <Connect key={id} id={id} />
        ) : (
          <Section key={id} number={number} id={id} label={label} />
        )
      )}
    </main>
  );
}
