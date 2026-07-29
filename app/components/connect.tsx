import Magnet from "./magnet";
import RevealText from "./reveal-text";
import TypeBands from "./type-bands";

const SOCIAL_LINKS = [
  { label: "github", href: "https://github.com/jakeparkbuilds" },
  { label: "linkedin", href: "https://linkedin.com/in/jkeprk" },
  { label: "instagram", href: "https://www.instagram.com/jakeprkusr/" },
];

// Deliberately does not use SectionShell: this section breaks the page's
// left-aligned marker/h2/hairline rhythm on purpose (docs/motion-spec.md
// §07). No heading text exists to label the section, so the accessible
// name comes from aria-label instead of aria-labelledby.
export default function Connect({ id }: { id: string }) {
  return (
    <section
      id={id}
      aria-label="connect"
      // --nav-gutter is scoped to this element: above 1280px the centered
      // column clears the nav by 80px+, so the gutter this section would
      // otherwise inherit is zeroed out and it centers on the full
      // viewport. Below 1280px (nav labels sit closer in) every other
      // section's gutter is kept.
      // The section must fit ONE viewport at 1440x900 with nothing scrolled —
      // it measured 966.5px against 900 once the bands went in. Every vertical
      // gap below is reduced in proportion rather than any element being cut:
      // pad 108/90 -> 72/63, the footer rule's lead-in 64 -> 40, the coordinate
      // line's 40 -> 24.
      className="section-pad flex w-full flex-col items-center pt-[clamp(64px,8vh,120px)] pb-[clamp(56px,7vh,110px)] min-[1280px]:[--nav-gutter:0px]"
    >
      <div className="flex w-full max-w-[720px] flex-col items-center gap-14 text-center">
        <div className="flex flex-col items-center gap-6">
          <p className="font-mono text-mono-micro uppercase text-label">
            you&apos;ve reached the end
          </p>

          <p className="font-display text-[clamp(40px,9vw,64px)] font-medium leading-[1.05] tracking-[-0.02em] text-ink">
            <span className="block">let&apos;s build</span>
            <span className="block">something</span>
          </p>

          {/* Full strength: it sits alone with clear space on every side. */}
          <Magnet>
            <a
              href="mailto:jp2282@georgetown.edu"
              className="font-display text-[22px] text-ink underline decoration-accent decoration-[1px] underline-offset-8 transition-colors duration-150 ease-in-out hover:text-accent sm:text-[28px]"
            >
              jp2282@georgetown.edu
            </a>
          </Magnet>
        </div>

        {/* Real body copy, not a caption — full-strength body color
            (#2E2A24), same text-body-twice pattern used wherever this
            token needs to carry both its size and its color (see
            hero.tsx, about.tsx, education.tsx). */}
        <RevealText className="max-w-[520px] font-display text-body text-body">
          {"I'm always up for talking about ML systems, civic tech, or where to find a decent slice in D.C."}
        </RevealText>

        <nav aria-label="social links">
          <ul className="flex flex-wrap items-center justify-center gap-3 font-mono text-small uppercase tracking-[0.2em] text-body">
            {SOCIAL_LINKS.map((link, i) => (
              <li key={link.label} className="contents">
                {i > 0 && (
                  <span aria-hidden="true" className="text-muted">
                    ·
                  </span>
                )}
                {/* Divisor 5, not 3: the three sit close together and at full
                    strength the words reach each other. The middot between them
                    is outside the Magnet and never moves — the separator is
                    structure, and structure holding still is what makes the
                    words read as moving. */}
                <Magnet divisor={5}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-transparent decoration-[1px] underline-offset-4 transition-colors duration-150 ease-in-out hover:text-accent hover:decoration-accent"
                  >
                    {link.label}
                  </a>
                </Magnet>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Set piece 6. Sits in the lower third, between the social row and the
          footer rule, and runs edge to edge. */}
      <div className="mt-[clamp(56px,8vh,96px)] w-full">
        <TypeBands />
      </div>

      <div
        aria-hidden="true"
        className="mt-10 w-full max-w-[720px] border-t-[0.5px] border-muted"
      />

      <p className="mt-6 text-center font-mono text-mono-micro uppercase text-label">
        washington, d.c. · 38.9076°n 77.0723°w
      </p>
    </section>
  );
}
