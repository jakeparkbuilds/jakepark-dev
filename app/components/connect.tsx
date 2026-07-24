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
      className="section-pad flex w-full flex-col items-center pt-[clamp(100px,12vh,160px)] pb-[clamp(72px,10vh,140px)] min-[1280px]:[--nav-gutter:0px]"
    >
      <div className="flex w-full max-w-[720px] flex-col items-center gap-14 text-center">
        <div className="flex flex-col items-center gap-6">
          <p className="font-mono text-mono-micro uppercase text-muted">
            you&apos;ve reached the end
          </p>

          <p className="font-display text-[clamp(40px,9vw,64px)] font-medium leading-[1.05] tracking-[-0.02em] text-ink">
            <span className="block">let&apos;s build</span>
            <span className="block">something</span>
          </p>

          <a
            href="mailto:jp2282@georgetown.edu"
            className="font-display text-[22px] text-ink underline decoration-accent decoration-[1px] underline-offset-8 transition-colors duration-150 ease-in-out hover:text-accent sm:text-[28px]"
          >
            jp2282@georgetown.edu
          </a>
        </div>

        {/* Real body copy, not a caption — uses the label token (#7C7566),
            not muted (#9B9382, decorative-only per CLAUDE.md contrast rule). */}
        <p className="max-w-[520px] font-display text-body text-label">
          I&apos;m always up for talking about ML systems, civic tech, or
          where to find a decent slice in D.C.
        </p>

        <nav aria-label="social links">
          <ul className="flex flex-wrap items-center justify-center gap-3 font-mono text-small uppercase tracking-[0.2em] text-body">
            {SOCIAL_LINKS.map((link, i) => (
              <li key={link.label} className="contents">
                {i > 0 && (
                  <span aria-hidden="true" className="text-muted">
                    ·
                  </span>
                )}
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-transparent decoration-[1px] underline-offset-4 transition-colors duration-150 ease-in-out hover:text-accent hover:decoration-accent"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div
        aria-hidden="true"
        className="mt-16 w-full max-w-[720px] border-t-[0.5px] border-muted"
      />

      <p className="mt-10 text-center font-mono text-mono-micro uppercase text-muted">
        washington, d.c. · 38.9076°n 77.0723°w
      </p>
    </section>
  );
}
