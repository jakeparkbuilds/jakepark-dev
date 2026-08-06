import fs from "node:fs";
import path from "node:path";
import type { CSSProperties } from "react";
import EduPhotoTrigger, { EduPlate, type EduPhoto as EduPhotoData } from "./edu-photo";
import SectionShell from "./section-shell";

// § 04 background — the route, stripped.
//
// THREE stations and nothing else on them. Every sentence of prose is deleted:
// the immigration beat, the TJ beat, the Georgetown beat, and station 04 "what
// for" along with the whole station. The coordinates are deleted with them —
// every °N/°W line and the data behind them. What is left is a place, a date
// range on the first station, and a school on the other two.
//
// Nothing replaced any of it. A station says where and when; the schools say
// what; the coursework says how much. There is no standfirst and no
// transitional line, and none may be added.
//
// THE SPINE. One continuous 0.5px muted hairline for the whole route,
// absolutely positioned against .bg-route and full height, so no wrapper or
// station box can break it. § 03's is the opposite construction: a 6px bar
// assembled from one colour-carrying segment per employer, where the rule
// itself is the data. This one carries nothing and is marked by a 12px ink tick
// at each stop. With the prose gone it is doing MORE work than it was, not
// less: the tick sequence and the numbers are now the only thing saying these
// three places happened in an order.
//
// THE SECTION ENDS AT STATION 03. There is no coda: the `interests` label, the
// seven items and the Kyoto portrait that used to sit under a trailing hairline
// are all deleted, and the portrait is now § 05 connect's left column. So § 04
// carries exactly ONE photo mechanism — the staged plate, anchored to
// .bg-plates, a wrapper holding exactly the two stations that carry a school.
// Both therefore stage to the same coordinates by construction, and there is
// nothing below the wrapper but the section's own bottom padding.

type School = {
  institution: string;
  degree: string;
  logoFile: string;
  logoAlt: string;
  /** Rendered crest height in px, [base, >=640px]. Set by perceived weight,
      not by bounding box — the G is a solid glyph and the seal is drawn in
      hairlines, so at equal height the seal reads as the smaller mark. */
  logoHeight: [number, number];
  coursework: string[];
  photo: EduPhotoData;
};

type Station = {
  place: string;
  /** The station's only content where there is no school. Right-aligned to the
      section's content edge, on the place's own line — the same edge the
      coursework lists end on, so the section's right column reads as one
      column top to bottom. */
  note: string | null;
  school: School | null;
};

const TJHSST: School = {
  institution: "Thomas Jefferson High School for Science and Technology",
  degree: "Advanced Studies Diploma",
  logoFile: "tjhsst.svg",
  logoAlt: "Thomas Jefferson High School for Science and Technology crest",
  // 1.20x Georgetown, the measured ratio: ~1.10 because a circular mark reads
  // smaller than a squarish one at equal height, and ~1.09 more because this
  // one is drawn in hairlines rather than filled.
  logoHeight: [41, 53],
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
};

const GEORGETOWN: School = {
  institution: "Georgetown University",
  degree: "B.S. Computer Science · A.B. Mathematics · class of 2029",
  logoFile: "georgetown.svg",
  logoAlt: "Georgetown University shield",
  logoHeight: [34, 44],
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
};

const STATIONS: Station[] = [
  { place: "seoul, south korea", note: "2007—2014", school: null },
  { place: "alexandria, virginia", note: null, school: TJHSST },
  { place: "washington, d.c.", note: null, school: GEORGETOWN },
];

// The plate's photos, in the order the two school stations appear. The index a
// trigger reports is an index into THIS array, so it has to be derived from the
// stations rather than written down beside them.
const SCHOOL_STATIONS = STATIONS.filter((s) => s.school !== null);
const PHOTOS = SCHOOL_STATIONS.map((s) => s.school!.photo);
const PHOTO_INDEX = new Map(SCHOOL_STATIONS.map((s, i) => [s.place, i]));

// Read once per render from the repo's own static asset — not user input, so
// injecting the raw markup is safe. Inline (rather than <Image>) is what lets
// these render at their own baked-in brand-color fills.
function readLogo(file: string) {
  return fs.readFileSync(path.join(process.cwd(), "public/logos", file), "utf8");
}

function StationRow({ station, index }: { station: Station; index: number }) {
  const { place, note, school } = station;
  const no = String(index + 1).padStart(2, "0");

  return (
    // No tab stop and no role. The station used to be a focus stop because the
    // coursework opened on :focus-within; the coursework is always visible now,
    // so a focusable wrapper would be a stop that does nothing. The photo
    // trigger is the station's only control.
    <div className="bg-station">
      {/* The station's mark on the spine. 12px of ink crossing a 0.5px muted
          rule, centred on it by the route's own indent — so the tick never has
          to know where the spine is in page coordinates. */}
      <span aria-hidden="true" className="bg-tick" />

      <div className="bg-head">
        <p className="bg-index">{no}</p>
        <p className="bg-place">{place}</p>
        {note && <p className="bg-note">{note}</p>}
      </div>

      {school && (
        <>
          {/* The crest sits in the left rail, top-aligned to the cap band of
              the institution name beside it — not to its line box, which is
              looser by the font's own ascent. */}
          <div
            className="bg-crest"
            style={
              {
                "--edu-logo-h": `${school.logoHeight[0]}px`,
                "--edu-logo-h-sm": `${school.logoHeight[1]}px`,
              } as CSSProperties
            }
            role="img"
            aria-label={school.logoAlt}
            dangerouslySetInnerHTML={{ __html: readLogo(school.logoFile) }}
          />

          <div className="bg-school">
            {/* The contact print is appended to the school name so it sits on
                the name's last line, 14px past its last character. It is out of
                flow inside a zero-height anchor, so nothing else in the block
                moves and the station's height is unchanged. */}
            <p className="font-display text-h2 text-ink">
              {school.institution}
              <EduPhotoTrigger photo={school.photo} index={PHOTO_INDEX.get(place)!} />
            </p>
            <p className="mt-[10px] font-display text-body text-body">{school.degree}</p>
          </div>

          <div className="edu-course">
            <ul className="edu-course-list">
              {school.coursework.map((course) => (
                <li key={course}>{course}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default function Background({
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
      <div className="bg-route">
        <StationRow station={STATIONS[0]} index={0} />

        {/* The plate's containing block: exactly the two stations that carry a
            school. Both therefore stage the photo to the same coordinates by
            construction — there is one box and only its image and caption
            change. It is also the LAST thing in the section: what the plate
            borrows below it is now the section's own bottom padding rather than
            a coda's top margin. */}
        <div className="bg-plates">
          <StationRow station={STATIONS[1]} index={1} />
          <StationRow station={STATIONS[2]} index={2} />
          <EduPlate photos={PHOTOS} />
        </div>
      </div>
    </SectionShell>
  );
}
