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
      // The section must fit ONE viewport at 1440x900 with nothing scrolled.
      // It measured 966.5px against 900 once the bands went in, so every
      // vertical gap was cut in proportion rather than any element being
      // dropped. Losing the headline's second line then freed 67px, which is
      // given back to the same gaps in the same proportion rather than left as
      // a hole: pad 72/63 -> 90/76, the column gap 56 -> 64, the bands' lead-in
      // 72 -> 81, the rule's 40 -> 48, the coordinate line's 24 -> 28.
      className="section-pad flex w-full flex-col items-center pt-[clamp(80px,10vh,140px)] pb-[clamp(68px,8.5vh,124px)] min-[1280px]:[--nav-gutter:0px]"
    >
      <div className="flex w-full max-w-[720px] flex-col items-center gap-16 text-center">
        <div className="flex flex-col items-center gap-6">
          {/* Strength is set by weight: the heavier the type, the less it
              moves. The display lines are divided by 8 against the mono
              label's 4, so the section reads as having mass rather than as
              uniformly springy. */}
          <p className="font-mono text-mono-micro uppercase text-label">
            <Magnet divisor={4} field={140}>
              you&apos;ve reached the end
            </Magnet>
          </p>

          {/* One line now, so one magnetic unit. The two-line collision
              constraint is retired with the second line: there is nothing left
              for it to collide with, and the ink-gap measurement that justified
              divisor 8 no longer applies. Strength stays 8 because it is the
              weight rule, not the clearance, that sets it. */}
          <p className="font-display text-[clamp(40px,9vw,64px)] font-medium leading-[1.05] tracking-[-0.02em] text-ink">
            <Magnet divisor={8} field={220}>
              let&apos;s connect
            </Magnet>
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

        {/* The row never wraps mid-list. It was `flex-wrap` over `display:
            contents` items, which let the browser break between any link and
            its own separator and leave a middot alone on a line.

            Now: nowrap while the three fit, and a centered vertical stack
            below that — with the middots REMOVED, not merely hidden, because a
            separator between stacked lines separates nothing. The switch is a
            container query on the row itself rather than a viewport
            breakpoint, so it happens at the width where the three actually
            stop fitting instead of at a number that has to be re-guessed
            whenever the type changes. */}
        <nav aria-label="social links" className="social-row">
          <ul className="flex items-center justify-center gap-3 font-mono text-small uppercase tracking-[0.2em] text-body">
            {SOCIAL_LINKS.map((link, i) => (
              <li key={link.label} className="contents">
                {i > 0 && (
                  <span aria-hidden="true" className="social-sep text-muted">
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
      <div className="mt-[clamp(64px,9vh,104px)] w-full">
        <TypeBands />
      </div>

      <div
        aria-hidden="true"
        className="mt-12 w-full max-w-[720px] border-t-[0.5px] border-muted"
      />

      <p className="mt-7 text-center font-mono text-mono-micro uppercase text-label">
        washington, d.c. · 38.9076°n 77.0723°w
      </p>
    </section>
  );
}
