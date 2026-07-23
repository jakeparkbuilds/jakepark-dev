import SectionMark from "./section-mark";

export default function Section({
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
    <section
      id={id}
      aria-labelledby={headingId}
      className="flex min-h-[80svh] w-full flex-col justify-center gap-10 p-section"
    >
      <div className="flex flex-col gap-4">
        <SectionMark mark={`§ ${number}`} label={label} />
        <h2 id={headingId} className="font-display text-h2 text-ink">
          {label}
        </h2>
      </div>

      <div className="border-t-[0.5px] border-ink pt-10">
        <p className="font-mono text-mono-micro uppercase text-muted">
          awaiting content
        </p>
      </div>
    </section>
  );
}
