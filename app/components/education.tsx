import fs from "node:fs";
import path from "node:path";
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
      "machine learning",
      "ai i & ii",
      "linear algebra",
      "discrete math",
      "multivariable calculus",
      "differential equations",
      "statistical modeling",
      "data structures",
    ],
  },
  {
    institution: "Thomas Jefferson High School for Science and Technology",
    degree: "Advanced Studies Diploma",
    location: "Alexandria, Virginia",
    logoFile: "tjhsst.svg",
    logoAlt: "Thomas Jefferson High School for Science and Technology crest",
    coursework: ["advanced placement", "research statistics", "computer systems"],
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
    <div>
      <div aria-hidden="true" className="edu-hairline h-[0.5px] w-full bg-muted" />
      <div
        tabIndex={0}
        className="edu-row py-[clamp(40px,5vh,64px)]"
      >
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
        </div>

        <p className="edu-course font-mono text-small text-muted">
          {entry.coursework.join(" · ")}
        </p>
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
