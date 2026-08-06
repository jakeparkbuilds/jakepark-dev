import Image from "next/image";
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
      // THE NAV GUTTER IS BACK. This element used to zero it above 1280px so
      // the section could centre a text column on the full viewport. It is two
      // columns now and the right one has to END on the section's content edge
      // like every other section on the site — which, without the gutter,
      // would put the email and the blurb under the fixed nav. Measured with
      // the gutter zeroed: the right column's edge landed 104px inside the nav
      // at 1440. So § 05 uses the same content box as everything else, and the
      // symmetric 256px inset .connect-center carried to dodge the nav is gone
      // with the reason for it.
      // The section fills exactly one viewport and distributes itself rather
      // than being padded into place — see .connect in globals.css.
      className="connect section-pad"
    >
      {/* TWO COLUMNS, and they read as one unit: the portrait on the left,
          everything that used to be centred left-aligned beside it and
          vertically centred against it. Three centred blocks stacked in a
          column of dead space is what this replaced. */}
      <div className="connect-stage">
        <div className="connect-columns">
          {/* The Kyoto portrait, moved here from § 04's coda. Same registration
              corners it has always had, and still NOT a trigger — no hover
              response, because a plate that opens is a different object. */}
          <figure className="connect-portrait">
            <span className="cn-plate">
              <Image
                src="/portrait.jpg"
                alt="Jake Park"
                // 4284x5712, NOT the 5712x4284 the raw pixel matrix reports.
                // The file carries an EXIF rotation, so `sips` reads it
                // landscape while every browser and next/image's own pipeline
                // render it portrait. Declaring the raw matrix reserved
                // 480x360 for an image that arrived 480x640 — a 280px shift
                // under the caption every time it loaded in view.
                width={4284}
                height={5712}
                // 72, not 90 — the heaviest optimized raster on the page.
                quality={72}
                sizes="(min-width: 1600px) 320px, (min-width: 1440px) 280px, (min-width: 900px) 240px, 92vw"
                className="cn-portrait-img saturate-[.85]"
              />
              <span aria-hidden="true" className="cn-plate-reg" data-c="tl" />
              <span aria-hidden="true" className="cn-plate-reg" data-c="tr" />
              <span aria-hidden="true" className="cn-plate-reg" data-c="bl" />
              <span aria-hidden="true" className="cn-plate-reg" data-c="br" />
            </span>
            <figcaption className="cn-portrait-cap font-mono">
              kyoto, japan · 2025
            </figcaption>
          </figure>

          <div className="connect-center">
            <p className="connect-label font-mono">
              <Magnet divisor={4} field={140} max={24}>
                let&apos;s connect
              </Magnet>
            </p>

            {/* The href carries the real address, so the mailto works; the
                bracket notation is display only, and the brackets are #6B6455
                so they read as annotation rather than as part of the address.

                IT WRAPS NOW, and only where a space already is. The address is
                three nowrap segments — `jp2282`, `[at] georgetown`,
                `[dot] edu` — with real spaces between them, so the only break
                opportunities on the line are the ones the bracket notation put
                there. Never mid-word, never hyphenated. Each segment carries
                its own underline, so a wrapped address gets an underline per
                line rather than one bar under the last one. */}
            <p className="connect-email-line">
              <Magnet divisor={6} field={200} max={18}>
                {/* The accessible name is the REAL address, not the bracket
                    notation. Two reasons: the notation is a display device and
                    the href already publishes the address anyway, and the
                    spaces between the segments are inter-element whitespace,
                    which Chrome's accname computation drops — measured, the
                    link announced as `jp2282[at] georgetown[dot] edu`. */}
                <a
                  href="mailto:jp2282@georgetown.edu"
                  aria-label="jp2282@georgetown.edu"
                  className="connect-email font-mono"
                >
                  <span className="ce-seg">jp2282</span>{" "}
                  <span className="ce-seg">
                    <span className="connect-email-br">[at]</span> georgetown
                  </span>{" "}
                  <span className="ce-seg">
                    <span className="connect-email-br">[dot]</span> edu
                  </span>
                </a>
              </Magnet>
            </p>

            {/* No magnetism here: it carries the character reveal, and two
                systems writing to one element fight. */}
            <RevealText className="connect-blurb font-display">
              always up for a conversation about ML, civic tech, or pizza
            </RevealText>
          </div>
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
                {/* NOT magnetic. The footer is the page's last row and it is
                    structure, not composition — the coordinates and the middots
                    hold still, and links that drifted out of a line everything
                    else keeps read as loose rather than as alive. Magnetism in
                    § 07 is now the centre block only: the email and its label. */}
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-transparent decoration-[1px] underline-offset-4 transition-colors duration-150 ease-in-out hover:text-ink hover:decoration-ink"
                >
                  {link.label}
                </a>
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
