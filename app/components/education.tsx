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
  // Explicit row count (rather than relying on grid auto-flow to guess) is
  // what makes the 2-column course list fill column-first: item 1..N goes
  // down the left column, then wraps to the right at exactly the midpoint,
  // regardless of how many items a given entry has.
  const courseRows = Math.ceil(entry.coursework.length / 2);

  return (
    <div tabIndex={0} className="edu-row py-[clamp(40px,5vh,64px)]">
      <div
        className="edu-logo h-10 w-auto shrink-0 sm:h-[52px]"
        role="img"
        aria-label={entry.logoAlt}
        dangerouslySetInnerHTML={{ __html: readLogo(entry.logoFile) }}
      />

      <div className="edu-body max-w-[620px]">
        <p className="font-display text-h2 text-ink">{entry.institution}</p>
        <p className="mt-[10px] font-display text-body text-body">{entry.degree}</p>
        <p className="mt-[14px] font-mono text-mono-micro uppercase text-muted">
          {entry.location}
        </p>

        <div className="mt-6">
          <p className="mb-3 font-mono text-mono-micro uppercase text-muted">
            coursework
          </p>
          {/* --course-rows drives the column-first fill at >=1100px (see
              .edu-course-list); below that it's ignored since the list is a
              single column. clip-path never changes this box's size, so the
              reveal can't shift anything below it. */}
          <div
            className="edu-course-list font-mono text-small text-muted"
            style={{ "--course-rows": courseRows } as CSSProperties}
          >
            {entry.coursework.map((course) => (
              <p key={course}>{course}</p>
            ))}
          </div>
        </div>
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
        {ENTRIES.map((entry) => (
          <EntryRow key={entry.institution} entry={entry} />
        ))}
        <div aria-hidden="true" className="h-[0.5px] w-full bg-muted" />
      </div>
    </SectionShell>
  );
}
