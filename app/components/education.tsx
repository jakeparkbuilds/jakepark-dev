import fs from "node:fs";
import path from "node:path";
import type { CSSProperties } from "react";
import SectionShell from "./section-shell";

type EducationEntry = {
  institution: string;
  degree: string;
  location: string;
  logoFile: string;
  logoAlt: string;
  coursework: string[];
};

const ENTRIES: EducationEntry[] = [
  {
    institution: "Georgetown University",
    degree: "B.S. Computer Science · A.B. Mathematics",
    location: "Washington, D.C.",
    logoFile: "georgetown.svg",
    logoAlt: "Georgetown University shield",
    coursework: [
      "computer science i & ii",
      "data structures",
      "advanced programming",
      "discrete math",
      "multivariable calculus",
      "intro to math statistics",
    ],
  },
  {
    institution: "Thomas Jefferson High School for Science and Technology",
    degree: "Advanced Studies Diploma",
    location: "Alexandria, Virginia",
    logoFile: "tjhsst.svg",
    logoAlt: "Thomas Jefferson High School for Science and Technology crest",
    coursework: [
      "computer science principles",
      "data structures",
      "web app development",
      "mobile app development",
      "engineering research lab",
      "calculus bc",
      "multivariable calculus",
      "linear algebra",
      "ap statistics",
      "statistical modeling",
    ],
  },
];

// Read once per render from the repo's own static asset — not user input,
// so injecting the raw markup is safe. Inline (rather than <Image>) is what
// lets these render at their own baked-in brand-color fills.
function readLogo(file: string) {
  return fs.readFileSync(path.join(process.cwd(), "public/logos", file), "utf8");
}

function EntryRow({ entry }: { entry: EducationEntry }) {
  return (
    <div tabIndex={0} className="edu-row py-[clamp(40px,5vh,64px)]">
      <div
        className="edu-logo h-10 w-auto shrink-0 sm:h-[52px]"
        role="img"
        aria-label={entry.logoAlt}
        dangerouslySetInnerHTML={{ __html: readLogo(entry.logoFile) }}
      />

      <div className="edu-body">
        <p className="font-display text-h2 text-ink">{entry.institution}</p>
        <p className="mt-[10px] font-display text-body text-body">{entry.degree}</p>
        <p className="mt-[14px] font-mono text-mono-micro uppercase text-label">
          {entry.location}
        </p>
      </div>

      <div className="edu-course font-mono text-[12px] leading-[1.7] text-label">
        <p>{entry.coursework.join(" · ")}</p>
      </div>
    </div>
  );
}

export default function Education({
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
      <div>
        {/* Equal-height rows: at >=1100px this becomes a CSS grid with
            grid-template-rows: repeat(N, 1fr) on an auto-height container —
            per the grid spec, intrinsically-sized fr row tracks are each
            sized to the tallest fr track's content, so every row ends up as
            tall as whichever entry's coursework run wraps the most. Each
            .edu-row keeps align-items: start internally, so the shorter
            entry's extra height shows up as empty space below its content,
            not as stretched/centered text. */}
        <div
          className="edu-grid"
          style={{ "--entry-count": ENTRIES.length } as CSSProperties}
        >
          {ENTRIES.map((entry) => (
            <EntryRow key={entry.institution} entry={entry} />
          ))}
        </div>
        <div aria-hidden="true" className="h-[0.5px] w-full bg-muted" />
      </div>
    </SectionShell>
  );
}
