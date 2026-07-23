import Image from "next/image";
import SectionShell from "./section-shell";

const BACKGROUND_ENTRIES = [
  {
    marker: "seoul → nova",
    text: "I grew up in Northern Virginia, after my family immigrated from Seoul when I was in elementary school.",
  },
  {
    marker: "alexandria",
    text: "I went to Thomas Jefferson High School for Science and Technology, where I learned how to build things.",
  },
  {
    marker: "washington",
    text: "Now I'm at Georgetown, where being in the middle of D.C. made it obvious how much of public life runs on infrastructure most people never see.",
  },
  {
    marker: "what for",
    text: "I want to use math and CS for the communities that took my family in, building technology that serves actual people.",
  },
];

const INTERESTS = [
  "long-distance running",
  "golf",
  "dollar slice pizza",
  "country music",
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
      <div className="flex flex-col gap-12 md:flex-row md:items-start md:gap-10">
        {/* Portrait's top edge is nudged down from the row's top so it meets
            the cap-height of the first line below, not the top of its (much
            looser) 1.58 line-height box — derived from Bricolage Grotesque's
            own hhea/capHeight metrics, not a guess.

            Width floor dropped from 400 to 280: with the 180px nav gutter and
            the 100px marker column both now taken out of the row, a rigid
            400px floor left the text column under 160px wide (unreadable) at
            1024-1280px viewports. This still reaches ~460-480px at 1440px+. */}
        <div className="flex w-full flex-col gap-4 md:order-2 md:mt-[9px] md:w-[clamp(280px,32vw,480px)] md:flex-none">
          <Image
            src="/portrait.jpg"
            alt="Jake Park"
            width={5712}
            height={4284}
            quality={90}
            sizes="(min-width: 900px) 32vw, 400px"
            className="h-auto w-full max-w-[400px] saturate-[.85] md:max-w-none"
          />
          <p className="font-mono text-mono-micro uppercase text-muted">
            kyoto, japan · 2025
          </p>
        </div>

        <div className="flex flex-1 flex-col md:order-1">
          <div className="flex flex-col gap-9">
            {BACKGROUND_ENTRIES.map((entry) => (
              <div key={entry.marker} className="flex items-start">
                <p className="w-[100px] shrink-0 font-mono text-mono-micro uppercase text-muted">
                  {entry.marker}
                </p>
                <p className="max-w-[560px] flex-1 font-display text-body text-body">
                  {entry.text}
                </p>
              </div>
            ))}
          </div>

          <div className="ml-[100px] mt-12 flex max-w-[560px] flex-col gap-3 border-t-[0.5px] border-muted pt-8">
            <p className="font-mono text-mono-label-sm uppercase text-label sm:text-mono-label">
              elsewhere
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
