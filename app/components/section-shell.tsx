import type { ReactNode } from "react";
import SectionMark from "./section-mark";

// Shared shell for every non-hero section: number/label mark, h2, hairline.
// Content below the hairline is section-specific (a placeholder for
// not-yet-written sections, real content once it's supplied).
export default function SectionShell({
  number,
  id,
  label,
  children,
}: {
  number: string;
  id: string;
  label: string;
  children: ReactNode;
}) {
  const headingId = `${id}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="section-pad flex w-full flex-col gap-10 py-section-y"
    >
      <div className="sec-head flex flex-col gap-4">
        <SectionMark mark={number} label={label} />
        <h2 id={headingId} className="font-display text-h2 text-ink">
          {label}
        </h2>
      </div>

      <div className="sec-body border-t-[0.5px] border-ink pt-10">{children}</div>
    </section>
  );
}
