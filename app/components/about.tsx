import Image from "next/image";
import SectionShell from "./section-shell";

const BACKGROUND_LINES = [
  "I grew up in Northern Virginia, after my family immigrated from Seoul when I was in elementary school.",
  "I went to Thomas Jefferson High School for Science and Technology in Alexandria, where I learned how to build things.",
  "Now I'm at Georgetown, where being in the middle of D.C. made it obvious how much of public life runs on infrastructure most people never see.",
  "I want to use math and CS for the communities that took my family in — technology that serves actual people.",
];

const INTERESTS = [
  "long-distance running",
  "dollar slice pizza",
  "country music",
  "applied AI & data",
  "sudoku",
  "basketball",
  "weightlifting",
];

export default function About({
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
      <div className="flex flex-col gap-12 md:flex-row md:items-start md:gap-16">
        <div className="flex w-full flex-col gap-4 md:order-2 md:w-[clamp(400px,30vw,480px)] md:flex-none">
          <Image
            src="/portrait.jpg"
            alt="Jake Park"
            width={5712}
            height={4284}
            quality={90}
            sizes="(min-width: 900px) 480px, 400px"
            className="h-auto w-full max-w-[400px] saturate-[.85] md:max-w-none"
          />
          <p className="font-mono text-mono-micro uppercase text-muted">
            washington, d.c. · 2026
          </p>
        </div>

        <div className="flex flex-1 flex-col gap-14 md:order-1">
          <div className="flex max-w-[620px] flex-col gap-10">
            {BACKGROUND_LINES.map((line) => (
              <p key={line} className="font-display text-body text-body">
                {line}
              </p>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <p className="font-mono text-mono-label-sm uppercase text-label sm:text-mono-label">
              elsewhere in my life
            </p>
            <p className="font-mono text-small text-body">
              {INTERESTS.join(" · ")}
            </p>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
