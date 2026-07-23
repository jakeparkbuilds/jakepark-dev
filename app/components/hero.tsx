import HeroFigure from "./hero-figure";

type LinkKey = "github" | "linkedin" | "instagram" | "email";

const LINKS: { label: string; href: string; icon: LinkKey }[] = [
  { label: "github", href: "https://github.com/jakeparkbuilds", icon: "github" },
  { label: "linkedin", href: "https://linkedin.com/in/jkeprk", icon: "linkedin" },
  {
    label: "instagram",
    href: "https://www.instagram.com/jakeprkusr/",
    icon: "instagram",
  },
  { label: "email", href: "mailto:jp2282@georgetown.edu", icon: "email" },
];

// 11px, stroke-only, currentColor — quiet marks, not brand logos.
function LinkIcon({ type }: { type: LinkKey }) {
  const shared = {
    width: 11,
    height: 11,
    viewBox: "0 0 11 11",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 0.75,
    className: "shrink-0 translate-y-px",
    "aria-hidden": true,
  } as const;

  switch (type) {
    case "github":
      return (
        <svg {...shared}>
          <polyline points="4,3 1.5,5.5 4,8" />
          <polyline points="7,3 9.5,5.5 7,8" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...shared}>
          <polyline points="2,8 5.5,3 9,8" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...shared}>
          <rect x="2" y="2" width="7" height="7" />
          <circle cx="5.5" cy="5.5" r="1.6" />
        </svg>
      );
    case "email":
      return (
        <svg {...shared}>
          <rect x="1" y="3" width="9" height="6" />
          <polyline points="1,3 5.5,6.5 10,3" />
        </svg>
      );
  }
}

export default function Hero() {
  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="relative flex min-h-svh w-full flex-col border-t-[0.5px] border-ink"
    >
      <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-section p-section md:flex-row md:items-center md:gap-x-12">
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
                      className="inline-flex items-center gap-2 text-body hover:text-accent"
                    >
                      <LinkIcon type={link.icon} />
                      <span className="underline decoration-accent decoration-[1px] underline-offset-4">
                        {link.label}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="flex flex-[1.4] items-center md:justify-start">
          <div className="w-full">
            <HeroFigure />
          </div>
        </div>
      </div>
    </section>
  );
}
