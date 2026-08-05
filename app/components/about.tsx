import Image from "next/image";
import RevealText from "./reveal-text";
import SectionShell from "./section-shell";

const BACKGROUND_ENTRIES = [
  {
    marker: "seoul / nova",
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
          {/* The same crop-mark language as the two education plates, so all
              three raster images on the site read as one family. Additive
              only: the photo's size, position and ratio are untouched, the
              marks sit outside it, and unlike the education plates this one is
              NOT interactive — no hover response, because the portrait is not
              a trigger and must not suggest it is. */}
          <span className="about-plate">
            <Image
              src="/portrait.jpg"
              alt="Jake Park"
              width={5712}
              height={4284}
              // 72, not 90 — the same figure the § 04 thumbnails take. This is
              // the heaviest optimized raster on the page (95KB of AVIF at
              // w=640 against the thumbnails' 4.5-69KB), so it is where the
              // drop is worth the most. Nothing else about § 02 changes: the
              // sizes hint, the crop marks, the saturation and the layout are
              // untouched.
              quality={72}
              sizes="(min-width: 900px) 32vw, 400px"
              className="h-auto w-full max-w-[400px] saturate-[.85] md:max-w-none"
            />
            <span aria-hidden="true" className="about-plate-reg" data-c="tl" />
            <span aria-hidden="true" className="about-plate-reg" data-c="tr" />
            <span aria-hidden="true" className="about-plate-reg" data-c="bl" />
            <span aria-hidden="true" className="about-plate-reg" data-c="br" />
          </span>
          <p className="font-mono text-mono-micro uppercase text-muted">
            kyoto, japan · 2025
          </p>
        </div>

        <div className="flex flex-1 flex-col md:order-1">
          <div className="flex flex-col gap-9">
            {BACKGROUND_ENTRIES.map((entry) => (
              // items-baseline (not items-start): the mono marker (11px) and
              // body text (19px/1.58) have different first-line baselines.
              // Flexbox baseline alignment reads each item's actual first-line
              // baseline from the browser's font metrics, so the two line up
              // correctly without a hand-tuned margin.
              <div key={entry.marker} className="flex items-baseline gap-6">
                <p className="w-[130px] shrink-0 whitespace-nowrap font-mono text-mono-micro uppercase text-label">
                  {entry.marker}
                </p>
                {/* Each of the four runs its OWN progress window — they are
                    separate elements with separate rects, so the fourth is not
                    already inked by the time it arrives. */}
                <RevealText className="max-w-[560px] flex-1 font-display text-body text-body">
                  {entry.text}
                </RevealText>
              </div>
            ))}
          </div>

          {/* Full-width hairline: spans gutter + text column (130 + 24 + 560),
              not indented like the entry rows, so it reads as a section
              divider rather than a continuation of the text column. */}
          <div className="mt-12 max-w-[714px] border-t-[0.5px] border-muted pt-8">
            <div className="flex items-baseline gap-6">
              <p className="w-[130px] shrink-0 whitespace-nowrap font-mono text-mono-micro uppercase text-label">
                elsewhere
              </p>
              {/* grid-flow-col + grid-rows-4 fills column-first (items 1-4
                  left column, 5-7 right) instead of the default row-first
                  order, so reading order runs down then over. */}
              <div className="grid flex-1 grid-cols-1 gap-x-12 gap-y-3.5 sm:grid-cols-2 sm:grid-flow-col sm:grid-rows-4">
                {INTERESTS.map((interest) => (
                  <p key={interest} className="font-mono text-small text-body">
                    {interest}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
