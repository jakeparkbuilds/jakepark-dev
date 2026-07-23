import HeroFigure from "./hero-figure";

const LINKS = [
  { label: "github", href: "https://github.com/jakeparkbuilds" },
  { label: "linkedin", href: "https://linkedin.com/in/jkeprk" },
  { label: "instagram", href: "https://www.instagram.com/jakeprkusr/" },
  { label: "email", href: "mailto:jp2282@georgetown.edu" },
];

export default function Hero() {
  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="relative flex min-h-svh w-full flex-col border-t-[0.5px] border-ink"
    >
      <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-section p-section md:flex-row md:items-center">
        <div className="flex max-w-col flex-1 flex-col gap-8 md:justify-center">
          <p className="font-mono text-mono-label-sm uppercase text-label sm:text-mono-label">
            CS + Math @ Georgetown
          </p>

          <h1 id="hero-heading" className="font-display text-display text-ink">
            <span className="block">Jake</span>
            <span className="block">Park</span>
          </h1>

          <p className="max-w-col font-display text-body text-body">
            I&apos;m an undergraduate at Georgetown University studying Computer
            Science and Mathematics, with a particular interest in how data, ML,
            and AI systems drive civic and social impact.
          </p>

          <nav aria-label="social links">
            <ul className="flex flex-wrap gap-x-6 gap-y-2 font-display text-small">
              {LINKS.map((link) => {
                const isExternal = link.href.startsWith("http");
                return (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      {...(isExternal
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="text-body underline decoration-accent decoration-[1px] underline-offset-4 hover:text-accent"
                    >
                      {link.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="flex flex-1 items-center md:justify-end">
          <div className="w-full md:max-w-[480px]">
            <HeroFigure />
          </div>
        </div>
      </div>
    </section>
  );
}
