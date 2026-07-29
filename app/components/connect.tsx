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
      // The section fills exactly one viewport and distributes itself rather
      // than being padded into place — see .connect in globals.css.
      className="connect section-pad min-[1280px]:[--nav-gutter:0px]"
    >
      {/* Three elements, and the EMAIL is the monument — it takes the place the
          display headline used to hold, which is why the headline demotes to a
          mono label above it. `you've reached the end` is gone: the bands and
          the end of the page already say that, and a label announcing it was
          the fourth thing competing for the same centre. */}
      {/* A 76svh stage centres its content at 38svh — slightly high, so the
          bands and the footer have room below without the block being pushed
          off dead centre by a hand-tuned padding. */}
      <div className="connect-stage">
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
      </div>

      {/* Set piece 6. Runs edge to edge, unchanged in size and speed. */}
      <div className="connect-bands">
        <TypeBands />
      </div>

      <div aria-hidden="true" className="connect-rule" />

      {/* One row, three parts, one baseline: the pizza trigger at the left
          content edge, the socials centred, the coordinates at the right edge.
          The outer tracks are flex-1 with a zero basis, so they take equal
          width and the middle track is centred on the section rather than on
          whatever is left over.

          Below 1024 it stacks — socials, coordinates, then the trigger — and
          the middots go with the row: a separator between stacked lines
          separates nothing, and once they are gone the three names fit a 390px
          screen on one line with room to spare. */}
      <div className="connect-footer">
        <nav aria-label="social links" className="social-row cf-mid">
          <ul className="flex items-center justify-center gap-3 font-mono text-mono-micro uppercase tracking-[0.16em] text-label">
            {SOCIAL_LINKS.map((link, i) => (
              <li key={link.label} className="contents">
                {i > 0 && (
                  <span aria-hidden="true" className="social-sep text-muted">
                    ·
                  </span>
                )}
                {/* The middot is outside the Magnet and never moves — the
                    separator is structure, and structure holding still is what
                    makes the words read as moving. */}
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

        <p className="cf-right font-mono text-mono-micro uppercase text-label">
          washington, d.c. · 38.9076°n 77.0723°w
        </p>

        <div className="cf-left">
          <PizzaRain />
        </div>
      </div>
    </section>
  );
}
