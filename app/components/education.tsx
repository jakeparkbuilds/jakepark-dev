import fs from "node:fs";
import path from "node:path";
import type { CSSProperties } from "react";
import EduPhotoTrigger, { EduPlate, type EduPhoto as EduPhotoData } from "./edu-photo";
import SectionShell from "./section-shell";

type EducationEntry = {
  institution: string;
  degree: string;
  location: string;
  logoFile: string;
  logoAlt: string;
  /** Rendered crest height in px, [base, >=640px]. Set by perceived weight,
      not by bounding box — see .edu-logo in globals.css. */
  logoHeight: [number, number];
  coursework: string[];
  photo: EduPhotoData;
};

const ENTRIES: EducationEntry[] = [
  {
    institution: "Georgetown University",
    degree: "B.S. Computer Science · A.B. Mathematics",
    location: "Washington, D.C.",
    logoFile: "georgetown.svg",
    logoAlt: "Georgetown University shield",
    logoHeight: [40, 52],
    coursework: [
      "computer science i & ii",
      "data structures",
      "advanced programming",
      "discrete math",
      "multivariable calculus",
      "intro to math statistics",
    ],
    photo: {
      src: "/georgetown.jpg",
      alt: "An outdoor convocation on the Georgetown campus: two people standing together in front of a Gothic stone hall, one in an academic gown holding a ceremony program, with white tents and gowned faculty behind them",
      caption: "washington, d.c. · 2026",
      width: 4284,
      height: 5712,
    },
  },
  {
    institution: "Thomas Jefferson High School for Science and Technology",
    degree: "Advanced Studies Diploma",
    location: "Alexandria, Virginia",
    logoFile: "tjhsst.svg",
    logoAlt: "Thomas Jefferson High School for Science and Technology crest",
    // 1.20x Georgetown: ~1.10 because a circular mark reads smaller than a
    // squarish one at equal height, and ~1.09 more because this one is drawn
    // in hairlines rather than filled.
    logoHeight: [48, 62],
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
    photo: {
      src: "/tjhsst.jpg",
      alt: "Graduates in caps and gowns waiting together beneath a Thomas Jefferson High School for Science and Technology banner at commencement",
      caption: "alexandria, virginia · 2025",
      width: 2870,
      height: 3826,
    },
  },
];

// Read once per render from the repo's own static asset — not user input,
// so injecting the raw markup is safe. Inline (rather than <Image>) is what
// lets these render at their own baked-in brand-color fills.
function readLogo(file: string) {
  return fs.readFileSync(path.join(process.cwd(), "public/logos", file), "utf8");
}

function EntryRow({ entry, index }: { entry: EducationEntry; index: number }) {
  return (
    <div tabIndex={0} className="edu-row py-[clamp(40px,5vh,64px)]">
      <div
        className="edu-logo shrink-0"
        style={
          {
            "--edu-logo-h": `${entry.logoHeight[0]}px`,
            "--edu-logo-h-sm": `${entry.logoHeight[1]}px`,
          } as CSSProperties
        }
        role="img"
        aria-label={entry.logoAlt}
        dangerouslySetInnerHTML={{ __html: readLogo(entry.logoFile) }}
      />

      <div className="edu-body">
        {/* The contact print is appended to the school name so it sits on the
            name's last line, 14px past its last character. It is out of flow
            inside a 1em anchor, so nothing else in the left block moves and the
            row's height is unchanged at every width. */}
        <p className="font-display text-h2 text-ink">
          {entry.institution}
          <EduPhotoTrigger photo={entry.photo} index={index} />
        </p>
        <p className="mt-[10px] font-display text-body text-body">{entry.degree}</p>
        <p className="mt-[14px] font-mono text-mono-micro uppercase text-label">
          {entry.location}
        </p>
      </div>

      <div className="edu-course">
        <ul className="edu-course-list">
          {entry.coursework.map((course) => (
            <li key={course}>{course}</li>
          ))}
        </ul>
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
          {ENTRIES.map((entry, i) => (
            <EntryRow key={entry.institution} entry={entry} index={i} />
          ))}

          {/* ONE plate for the section, positioned against this grid — not
              inside either trigger. Both rows therefore stage the photo to the
              same coordinates by construction; only the image and caption
              change. */}
          <EduPlate photos={ENTRIES.map((e) => e.photo)} />
        </div>
        <div aria-hidden="true" className="h-[0.5px] w-full bg-muted" />
      </div>
    </SectionShell>
  );
}
