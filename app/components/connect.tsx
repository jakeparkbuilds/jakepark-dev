import Magnet from "./magnet";
import PizzaRain from "./pizza-rain";
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
      {/* Three elements, and the EMAIL is the monument — it takes the place the
          display headline used to hold, which is why the headline demotes to a
          mono label above it. `you've reached the end` is gone: the bands and
          the end of the page already say that, and a label announcing it was
          the fourth thing competing for the same centre. */}
      <div className="connect-center">
        <p className="connect-label font-mono">
          <Magnet divisor={4} field={140}>
            let&apos;s connect
          </Magnet>
        </p>

        {/* The href carries the real address, so the mailto works; the bracket
            notation is display only, and the brackets are #6B6455 so they read
            as annotation rather than as part of the address.

            Divisor 6, down from the email's old 3: it is far bigger now and
            full strength on a 58px line reads as sloppy rather than as pull. */}
        <p className="connect-email-line">
          <Magnet divisor={6} field={200}>
            <a href="mailto:jp2282@georgetown.edu" className="connect-email font-mono">
              jp2282
              <span className="connect-email-br"> [at] </span>
              georgetown
              <span className="connect-email-br"> [dot] </span>
              edu
            </a>
          </Magnet>
        </p>

        {/* No magnetism here: it carries the character reveal, and two systems
            writing to one element fight. */}
        <RevealText className="connect-blurb font-display">
          always up for a conversation about ML, civic tech, or pizza
        </RevealText>
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

      {/* Three tracks so the coordinate line stays centred on the section while
          the pizza trigger sits at the left content edge on the same baseline —
          rather than the trigger being absolutely positioned and having to be
          kept in agreement with the line by hand. */}
      <div className="mt-7 flex w-full items-baseline gap-4">
        <div className="flex flex-1 justify-start">
          <PizzaRain />
        </div>
        <p className="text-center font-mono text-mono-micro uppercase text-label">
          washington, d.c. · 38.9076°n 77.0723°w
        </p>
        <div aria-hidden="true" className="flex-1" />
      </div>

      {/* Out of the centre. Item 5 folds this into the footer row proper; for
          now it sits on its own centred line beneath it. */}
      <nav aria-label="social links" className="social-row mt-4">
        <ul className="flex items-center justify-center gap-3 font-mono text-mono-micro uppercase tracking-[0.16em] text-label">
            {SOCIAL_LINKS.map((link, i) => (
              <li key={link.label} className="contents">
                {i > 0 && (
                  <span aria-hidden="true" className="social-sep text-muted">
                    ·
                  </span>
                )}
                {/* The middot between them is outside the Magnet and never
                    moves — the separator is structure, and structure holding
                    still is what makes the words read as moving. */}
                <Magnet divisor={5}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-transparent decoration-[1px] underline-offset-4 transition-colors duration-150 ease-in-out hover:text-ink hover:decoration-ink"
                  >
                    {link.label}
                  </a>
                </Magnet>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
