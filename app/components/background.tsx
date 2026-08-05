import fs from "node:fs";
import path from "node:path";
import type { CSSProperties } from "react";
import Image from "next/image";
import EduPhotoTrigger, { EduPlate, type EduPhoto as EduPhotoData } from "./edu-photo";
import RevealText from "./reveal-text";
import SectionShell from "./section-shell";

// § 04 background — the route.
//
// about + education, merged. The four markers that used to label the about
// paragraphs are now STATIONS on a route, and the two schools hang off the two
// stations where they happened: TJ at alexandria, Georgetown at washington.
// Nothing here is new copy — every sentence, degree line, course and caption is
// the string it was in about.tsx or education.tsx.
//
// THE SPINE. One continuous 0.5px muted hairline for the whole route,
// absolutely positioned against .bg-route and full height, so no wrapper, row
// gap or station box can break it. § 03's spine is the opposite construction: a
// 6px bar assembled from one colour-carrying segment per employer, where the
// rule itself is the data. This one carries nothing — it is quiet, hairline and
// unsegmented, and the stations are marked on it by 12px ink ticks. A route
// with stops, not a stack of blocks.
//
// THE TWO PHOTO MECHANISMS. The Kyoto portrait is always visible and lives in
// station 01's aside. The staged plate is anchored to .bg-plates, a wrapper
// holding exactly the two stations that carry a school — so the portrait is
// outside the plate's containing block and no value of `top` can put one over
// the other. See CLAUDE.md § 5 / §04.

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
  /** [lat, lon], displayed one per line. Lowercase in source, uppercased by
      CSS — the same treatment § 05's footer coordinates take. */
  coords: [string, string] | null;
  beat: string;
  school: School | null;
};

const TJHSST: School = {
  institution: "Thomas Jefferson High School for Science and Technology",
  degree: "Advanced Studies Diploma",
  logoFile: "tjhsst.svg",
  logoAlt: "Thomas Jefferson High School for Science and Technology crest",
  // 1.20x Georgetown: ~1.10 because a circular mark reads smaller than a
  // squarish one at equal height, and ~1.09 more because this one is drawn in
  // hairlines rather than filled.
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
};

const GEORGETOWN: School = {
  institution: "Georgetown University",
  degree: "B.S. Computer Science · A.B. Mathematics",
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
};

const STATIONS: Station[] = [
  {
    place: "seoul",
    coords: ["37.5665°n", "126.9780°e"],
    beat: "I grew up in Northern Virginia, after my family immigrated from Seoul when I was in elementary school.",
    school: null,
  },
  {
    place: "alexandria",
    coords: ["38.8048°n", "77.0469°w"],
    beat: "I went to Thomas Jefferson High School for Science and Technology, where I learned how to build things.",
    school: TJHSST,
  },
  {
    place: "washington, d.c.",
    coords: ["38.9076°n", "77.0723°w"],
    beat: "Now I'm at Georgetown, where being in the middle of D.C. made it obvious how much of public life runs on infrastructure most people never see.",
    school: GEORGETOWN,
  },
  {
    place: "what for",
    coords: null,
    beat: "I want to use math and CS for the communities that took my family in, building technology that serves actual people.",
    school: null,
  },
];

// The plate's photos, in the order the two school stations appear. The index a
// trigger reports is an index into THIS array, so it has to be derived from the
// stations rather than written down beside them.
const SCHOOL_STATIONS = STATIONS.filter((s) => s.school !== null);
const PHOTOS = SCHOOL_STATIONS.map((s) => s.school!.photo);
const PHOTO_INDEX = new Map(SCHOOL_STATIONS.map((s, i) => [s.place, i]));

const INTERESTS = [
  "long-distance running",
  "golf",
  "dollar slice pizza",
  "country music",
  "sudoku",
  "basketball",
  "weightlifting",
];

// Read once per render from the repo's own static asset — not user input, so
// injecting the raw markup is safe. Inline (rather than <Image>) is what lets
// these render at their own baked-in brand-color fills.
function readLogo(file: string) {
  return fs.readFileSync(path.join(process.cwd(), "public/logos", file), "utf8");
}

function StationRow({
  station,
  index,
  aside,
}: {
  station: Station;
  index: number;
  aside?: React.ReactNode;
}) {
  const { place, coords, beat, school } = station;
  const no = String(index + 1).padStart(2, "0");

  return (
    // The focus stop exists only where there is something to reveal: the
    // coursework opens on :focus-within, so a keyboard reaches it without a
    // pointer. Stations with no list get no tab stop.
    <div className="bg-station" tabIndex={school ? 0 : undefined}>
      {/* The station's mark on the spine. 12px of ink crossing a 0.5px muted
          rule, centred on it by the route's own indent — so the tick never has
          to know where the spine is in page coordinates. */}
      <span aria-hidden="true" className="bg-tick" />

      <div className="bg-meta">
        <p className="bg-index">{no}</p>
        <p className="bg-place">{place}</p>
        {coords && (
          <p className="bg-coords">
            {coords[0]}
            <br />
            {coords[1]}
          </p>
        )}
        {school && (
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
        )}
      </div>

      <div className="edu-body">
        {school && (
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
        )}
        {/* Each beat runs its OWN progress window — separate elements with
            separate rects, so the fourth is not already inked by the time it
            arrives. */}
        <RevealText className="block max-w-[560px] font-display text-body text-body">
          {beat}
        </RevealText>
      </div>

      {aside ?? (school ? <Coursework school={school} /> : null)}
    </div>
  );
}

function Coursework({ school }: { school: School }) {
  return (
    <div className="edu-course">
      <ul className="edu-course-list">
        {school.coursework.map((course) => (
          <li key={course}>{course}</li>
        ))}
      </ul>
    </div>
  );
}

// Always visible, never staged, never a trigger — the same crop-mark language
// as the plate so the section's rasters read as one family, but with no hover
// response, because the portrait is not an affordance and must not suggest it
// is. It sits in station 01's aside, which is what keeps it outside .bg-plates.
function Portrait() {
  return (
    <div className="bg-portrait">
      <span className="about-plate">
        <Image
          src="/portrait.jpg"
          alt="Jake Park"
          width={5712}
          height={4284}
          // 72, not 90 — the heaviest optimized raster on the page.
          quality={72}
          sizes="(min-width: 1440px) 30vw, 400px"
          className="h-auto w-full saturate-[.85]"
        />
        <span aria-hidden="true" className="about-plate-reg" data-c="tl" />
        <span aria-hidden="true" className="about-plate-reg" data-c="tr" />
        <span aria-hidden="true" className="about-plate-reg" data-c="bl" />
        <span aria-hidden="true" className="about-plate-reg" data-c="br" />
      </span>
      <p className="mt-4 font-mono text-mono-micro uppercase text-muted">
        kyoto, japan · 2025
      </p>
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
            change — and the portrait, being outside this wrapper, can never be
            reached by it. */}
        <div className="bg-plates">
          <StationRow station={STATIONS[1]} index={1} />
          <StationRow station={STATIONS[2]} index={2} />
          <EduPlate photos={PHOTOS} />
        </div>

        <StationRow station={STATIONS[3]} index={3} />
      </div>

      {/* Off the route: not a station, so the spine stops above it. The
          portrait lives here rather than in a station's aside — in station 01
          it drove that station to 463px for two lines of copy, which opened a
          250px hole in the middle of the route. Here it closes the section and
          takes the same aside track the coursework does, so the right column
          reads as one column all the way down. */}
      <div className="bg-elsewhere">
        <div className="bg-elsewhere-grid">
          <p className="bg-marker">elsewhere</p>
          {/* grid-flow-col + grid-rows-4 fills column-first (items 1-4 left
              column, 5-7 right) instead of the default row-first order, so
              reading order runs down then over. */}
          <div className="bg-interests grid grid-cols-1 gap-x-12 gap-y-3.5 sm:grid-flow-col sm:grid-cols-2 sm:grid-rows-4">
            {INTERESTS.map((interest) => (
              <p key={interest} className="font-mono text-small text-body">
                {interest}
              </p>
            ))}
          </div>
          <Portrait />
        </div>
      </div>
    </SectionShell>
  );
}
