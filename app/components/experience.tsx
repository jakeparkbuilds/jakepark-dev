import { ROLES } from "../lib/experience";
import ExperienceMotion from "./experience-motion";

// § 03 experience — the inverted plate.
//
// The only inverted section on the site: ink ground, paper type, full-bleed
// horizontally so it breaks out of every other section's measure. CLAUDE.md's
// four sanctioned exceptions for it are recorded in § 2 and § 4 — the inversion
// itself, the role palette, brand color inside the logo tiles, and the 6px
// spine.
//
// The spine's segments are grid items in the same rows as the entries, so a
// segment's height IS its entry's row height — matched by construction, with no
// measurement and no chance of drift. The 40px between entries is padding
// INSIDE each row rather than a row gap, because a gap would show as a break in
// the spine and the spine must be continuous.
//
// data-entry is wired by ExperienceMotion: each entry arrives on its own
// IntersectionObserver as it is scrolled to, once. data-role remains the
// spine's hook and belongs to the margin trace — the motion pass does not
// touch it.

export default function Experience({
  number,
  id,
  label,
}: {
  number: string;
  id: string;
  label: string;
}) {
  const headingId = `${id}-heading`;

  return (
    <section id={id} aria-labelledby={headingId} className="exp">
      <ExperienceMotion sectionId={id} />
      <div className="exp-inner">
        <p className="exp-mark font-mono">
          {number} <span aria-hidden="true">/</span> {label}
        </p>
        <h2 id={headingId} className="exp-h2 font-display">
          {label}
        </h2>
        <div aria-hidden="true" className="exp-rule" />

        {/* The caps are not list items, so the entries live in their own <ol>
            set to display: contents — its rows join the body grid directly.
            role="list" is belt and braces: display: contents has historically
            dropped list semantics in some engines. */}
        <div className="exp-body">
          <span aria-hidden="true" className="exp-cap font-mono">
            now
          </span>

          <ol role="list" className="exp-list">
            {ROLES.map((role) => (
              <li key={role.no} className="exp-entry" data-entry={role.no}>
              {/* The spine segment for this role. Same grid row as the entry,
                  so its height is the entry's height by construction. */}
              <span
                aria-hidden="true"
                className="exp-seg"
                data-role={role.no}
                style={{ backgroundColor: role.color }}
              />

              {/* The paper tile. Opaque #F5F1E8 so a logo is legible whatever
                  its own colors are, with the artwork inset 8px and rendered at
                  its NATIVE brand colors — no filter, no tint, no duotone. */}
              <span aria-hidden="true" className="exp-tile">
                {/* A plain <img>, not an inlined SVG: inlining the five put
                    355KB of markup (128KB gzipped) into the document on every
                    load. As files they are separate, cacheable and parallel.
                    Native colors, so no next/image processing either. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/logos/${role.logo}.svg`}
                  alt=""
                  className="exp-logo"
                  loading="lazy"
                  decoding="async"
                />
              </span>

              <div className="exp-text">
                <div className="exp-head">
                  <h3 className="exp-org font-display">{role.org}</h3>
                  <p className="exp-dates font-mono">{role.dates}</p>
                </div>
                <p className="exp-role font-mono" style={{ color: role.color }}>
                  {role.title}
                </p>
                <p className="exp-desc font-display">{role.description}</p>
              </div>
            </li>
            ))}

          </ol>

          <span aria-hidden="true" className="exp-cap exp-cap--end font-mono">
            2024
          </span>
        </div>
      </div>
    </section>
  );
}
