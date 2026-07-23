import SectionShell from "./section-shell";

export default function Section({
  number,
  id,
  label,
}: {
  number: string;
  id: string;
  label: string;
}) {
  return (
    <SectionShell number={number} id={id} label={label}>
      <p className="font-mono text-mono-micro uppercase text-muted">
        awaiting content
      </p>
    </SectionShell>
  );
}
