# jakepark.dev — project instructions

Personal portfolio for Jake Park. Sophomore at Georgetown, B.S. Computer Science +
A.B. Mathematics, class of 2029. Builds ML and data systems.

The art direction below is **locked**. It was designed deliberately. Do not
"improve" it, do not substitute fonts, do not add colors. If something in this
file seems to prevent a good solution, say so and ask — do not silently deviate.

**§ 9 (Decisions already made) is not optional reading.** Several ideas in it
look attractive from a cold start and have already been tried and rejected.
Re-proposing them wastes a session.

---

## 1. Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS **v3** — deliberately downgraded so `tailwind.config.ts` is the
  real active config. v4's CSS-based `@theme` did not match the token approach.
  Do not upgrade.
- Tokens live in `tailwind.config.ts` — never arbitrary hex values in JSX
- Lenis for smooth scroll
- anime.js v4 for set pieces, imported **modularly** (named submodule imports
  only, never the whole bundle)
- Fonts self-hosted as woff2 via `next/font/local`. Never `<link>` to Google Fonts.
- Deployed on Vercel

Do not add: Framer Motion, GSAP, three.js, a UI component library, a mapping
library, a text-splitting library, or any icon package. Ask first.

---

## 2. Palette — 4 colors + 1 softened ink + 1 single-use mark

```
paper    #F5F1E8   base surface
ink      #1A1815   primary type, strong hairlines
muted    #9B9382   decorative hairlines, frames, quiet rules
accent   #22384F   ink blue — section marks + link underlines ONLY
body     #2E2A24   softened ink for body copy (same hue, not a 5th color)
mark     #C8952E   warm ochre — the Georgetown star, hero map ONLY
```

Legibility variants: `#6B6455` for any mono text a user must read (nav labels,
section markers, gutter annotations, captions, coursework). `#0A0908` for the
cursor dot and active nav label — the two darkest objects on the page.

Rules:
- Accent appears on **~3% of any viewport**. Reaching for it a third time in one
  section means the composition is wrong, not that it needs more accent.
- `mark` #C8952E appears in **exactly one place on the entire site**: the filled
  Georgetown star on the hero map. No other element, in any section, ever. If a
  future section wants ochre, the answer is no — it is the one warm point on a
  cool paper field precisely because it appears once.
- `#9B9382` is ~2.4:1 on paper and is **decorative only**. Never use it for text
  a user must read. On § 03's ink ground the same value is ~7:1 and *is* legible
  — the rule is about the pairing, not the hex.

**Role palette — § 03 only.** Harmonized, deliberately NOT brand-accurate; never
substitute a real brand hex. These five tokens appear nowhere else on the site,
and only on § 03's spine segments and its role-title mono labels.

```
role-01  #C87F4A  warm rust       Better Futures Institute
role-02  #6B8F71  sage            Break Through Tech
role-03  #C8952E  ochre           Georgetown Ventures
role-04  #7B6FA8  muted violet    Hoyalytics
role-05  #4A7C94  slate blue      George Mason
```

`role-03` is the same value as `mark` #C8952E. That is a collision of hex, not
of meaning: `mark` remains hero-only and this remains § 03-only. Neither may
reference the other's token.

**Brand color.** The palette rules otherwise assume no external color at all.
Amend: **§ 03 displays five third-party logos at their native brand colors,
contained within paper tiles.** Brand color is quarantined to those tiles and
appears nowhere else on the site.
- Never pure white, never pure black, never a gray with blue in it.
- No dark mode. **The site is paper, with one exception: § 03 experience is an
  inverted plate — ink ground, paper type.** It is the only inverted section and
  no other may become one. This is not a theme: there is still no toggle, and
  nothing about it responds to a system preference.
- **Never double-soften.** `body` #2E2A24 is already the softened ink. Applying
  an opacity utility on top of it is a bug — this caused a site-wide washed-out
  contrast problem that took a full pass to correct.

---

## 3. Typography — exactly 2 families

- **Bricolage Grotesque** (variable, `opsz 12..96`, weights 400/500) — display + body
- **IBM Plex Mono** (400/500) — labels, metadata, section numbers, coordinates

| token | family | size | weight | line-height | tracking |
|---|---|---|---|---|---|
| display | Bricolage | 138px | 400 | 0.90 | -0.03em |
| h1 | Bricolage | 64px | 500 | 1.05 | -0.02em |
| h2 | Bricolage | 40px | 500 | 1.10 | -0.015em |
| body | Bricolage | 21px (hero) / 19px | 400 | 1.55 / 1.58 | 0 |
| small | Bricolage | 15px | 400 | 1.45 | 0 |
| mono-label | Plex Mono | 12–13px | 500 | — | 0.22–0.24em, uppercase |
| mono-micro | Plex Mono | 11px | 400 | — | 0.16em, uppercase |

Rules:
- **Lowercase / sentence case everywhere.** Never Title Case a heading.
- Proper nouns capitalize normally: names, institutions (Georgetown), companies
  (DrivePulse, Hoyalytics), technologies (Python, PyTorch, AWS). Everything else
  stays lowercase — section headings, nav labels, link text, captions.
- Mono labels are uppercased via CSS `text-transform`, not in the source string.
- No third family. No italic. No weights other than 400 and 500.
- `text-wrap: pretty` on paragraphs, `text-wrap: balance` on headings.

---

## 4. Structure

- Hairlines **0.5px** everywhere except § 03, whose spine is **6px** (4px below
  900px) — a bar, not a hairline, and the one place a rule carries color.
  `vector-effect="non-scaling-stroke"` on all SVG strokes.
  Exception: the DC map's outer District boundary is **0.9px** so it dominates
  the 0.5px / 0.28-opacity neighborhood lines.
- `border-radius: 0` on everything, with exactly two exceptions: `.cursor-dot`
  uses `border-radius: 50%` because it is a literal circle, and § 05's field
  nodes are hairline `<circle>` elements — SVG geometry, not a rounded box. No
  other exceptions, and in particular no rounded rectangles anywhere.
- **No box-shadows anywhere.** Cards are defined by rules and space. Nothing on
  this site is enclosed by its own complete border.
- Grain: SVG fractalNoise, `opacity: 0.05`, `mix-blend-mode: multiply`,
  `pointer-events: none`. One instance, fixed to the page, not per-section.
- Nav gutter: ~180px reserved on the right of every section. Collapses to 0
  below 900px. The connect section overrides this and centers on the full
  viewport.
- Section markers are `02 / about` format. The `§` symbol was removed.
- `::selection` is accent #22384F at 0.18 alpha with color #0A0908. The browser
  default blue must never appear.

---

## 5. Sections

| § | section | status |
|---|---|---|
| 01 | hero (no number shown — it's the cover) | done |
| 02 | about + portrait | done, copy rewrite pending |
| 03 | experience | done — the inverted plate; motion pass outstanding |
| 04 | projects | done |
| 05 | skills | done |
| 06 | education | done |
| 07 | connect | done |

**Content still owed by Jake** before §03 can be built: a decision on how much
prose each of the five roles gets. Never write placeholder copy. If content is
missing, stop and ask.

Still outstanding for §04: the GitHub repo URLs for My 5 and CapitolCast. Each
is a one-line addition to that project's `links` array in `app/lib/projects.ts`.
Row 03 has no repo and no deployment and is **not** to be padded with a
disabled link — that asymmetry is honest.

**§05 skills is the quality bar.** Match its level of composition when building
§03.

### §04 projects
A drawing register, vertically composed — §05 holds the site's one axis break.
A column header that appears once (never repeats, never sticks), then one 68px
ruled row per project on a 12-column grid: NO. / PROJECT / STACK / YEAR.
Clicking a row unfolds it in place.

- All content lives in one typed array, `app/lib/projects.ts`. **Adding a
  project is one entry and no layout work.** `figure` is optional: an entry
  without one spans its text across cols 2–10 and the gap drops to its content
  height instead of holding open an empty well.
- Figures are generated from real path math behind a **fixed integer seed**
  (mulberry32) evaluated at module scope, so SSR and client agree byte for byte.
  Never `Math.random()` at render time.
- The unfold's marker and gap must be driven as **one** gesture: same duration,
  same curve, and the wrapper's overflow clips the marker so the drawn tip and
  the gap's edge are literally the same edge. Verify frame-by-frame; the
  measured divergence is 0.01px.
- Dash lengths are in **CSS pixels**, never user units — the marker's viewBox is
  1×100 but it renders at the gap's full height, so `getTotalLength()`
  understates it ~3.6× and paints the marker as a dashed line. See §7.
- An accordion that pushes content down requires per-frame reflow; that is
  inherent, and its cost is independent of figure complexity (measured: rows
  with 4, 51 and 40 paths cost the same). Do not go looking for it in the
  figures.

### Hero
Two-column. Left: mono label `CS + MATH @ GEORGETOWN`, "Jake" / "Park" at display
scale, blurb, four text links with 10px inline brand glyphs. Right: the DC map.

The map is real GeoJSON from DC Open Data, converted at build time by a script in
`scripts/` that projects, simplifies, and emits hardcoded SVG path strings to a
`.ts` file. Script and output both committed. No runtime fetch, no mapping
dependency, zero client JS. **The projection bounds are exported from that
generated file — anything positioned on the map must be derived through them,
never eyeballed.**

The map's concave western edge nests against the ragged right edge of the text
column with a **48–72px gap at every width ≥1200px**. This interlock is the
composition's load-bearing relationship. Any change to map scale or blurb width
must preserve it — verify at 1440, 1600, 1920 and report the measured gaps.

Georgetown star: 9px filled `mark`, projected from 38.9076°N / 77.0723°W. Label
sits **outside** the boundary in the paper to the left, connected by a 0.5px
muted leader with at most one 90° elbow. No arrowhead, no dot, no knockout where
the leader crosses the boundary.

### §05 skills — the drifting field
A fixed **readout panel** (cols 1–4) and a **field of 17 dials** (cols 5–12,
620px tall at ≥1440px), one per tool. Radius and mono size encode tier: primary
r62/15px, secondary r44/12px @0.55, tertiary r32/11px @0.35.

**A node is a dial, not a bubble** — a word in a circle reads as a bubble, so
each carries: the hairline ring; 12 circumference ticks at 30° (5px at rest,
8px on hover, staggered 12ms clockwise, with a primary's 12 o'clock tick fixed
at 9px as an index mark); an inner arc at r−7 whose sweep is the value it
carries (270/180/90° by tier); the name; and a 9px plate index `01`–`17`
assigned by tier then alphabetically. Ticks are trimmed at the FAR end by a dash
offset so a tick never detaches from its ring.

**The arc is the one piece of state the field accumulates.** It renders at 0
sweep, sweeps on first visit, and stays swept — so a visitor who has explored
can see which dials they opened. Under reduced motion every arc renders at full
sweep, and that override lives in **CSS, not in render**: `reduced` is a
client-only value, and branching on it during render is a hydration mismatch
React does not patch up, which would leave the arcs hidden from exactly the
people the rule serves.

Four axis labels — `LANGUAGES` / `ML & DATA` / `INFRASTRUCTURE` / `INTERFACES` —
13px/500/0.24em at #4A4438, each with an L-shaped corner mark (16px arms, 22px
when its region is addressed) whose corner points outward, and a 64px muted
leader running toward the field centre. **Never box them**: no border, no fill,
no background. They are type, a registration mark and a leader.

Every node is a **labeled data object**: name, domain, and one concrete evidence
line from the résumé. The evidence is what makes this section content rather
than decoration, and it is the basis of the § 8 particle exemption — remove any
node and information is lost. Never soften an evidence line to make it fit;
change the layout or ask.

- All content and the whole arrangement live in `app/lib/skills.ts` behind a
  **fixed integer seed** (mulberry32) at module scope. `drift(seed, 0)` is
  rendered inline by the server, so the SSR HTML *is* frame 0 — hydration
  matches and the reduced-motion path needs no JS at all.
- **Bounds are structural, not tested.** A node's base is expressed in CSS as
  `inset + fraction × (100% − 2·inset)` where inset = radius + amplitude, and
  the two sine components are weighted 0.62/0.38 so |offset| ≤ amplitude. There
  is no boundary test, no bounce, no collision resolution and no physics at
  runtime.
- The seed-time **relaxation must include the amplitudes**. Clearance at rest is
  not enough: measured without the travel term, two nodes seeded 38px apart
  drifted into an 11px label overlap within 20s. Rings are meant to cross;
  names are not.
- **Every constraint must budget for the depth scale.** A node renders at up to
  1.12× its own box, and keep-out is about rendered ink, not layout boxes.
  Omitting it left a 4px zone incursion and an 11px label overlap.
- **The keep-out zones are solved in the SAME relaxation loop as the label
  separation, never as a later pass.** Pushing nodes out of the labels
  afterwards moved them back into each other — at 900px it closed the tightest
  label gap to 2.4px, which the drift then shut completely.
- **The fraction conversion must be lossless.** `bx`/`by` are fractions of a
  span inset by radius + tick reach + amplitude; clamping an out-of-span node
  back into [0,1] silently undoes every separation just computed. Shrink the
  node's travel until the span reaches it instead of moving the node. This bug
  has now appeared twice — once via a fraction-space stretch, once via the
  clamp itself. **Any new pass that runs after the fractions are computed is
  almost certainly wrong.**
- Order is load-bearing: fit (px) → relaxation with zones → amplitude clamp vs
  zones → amplitude clamp vs label pairs → lossless conversion. Verified with a
  dev-only keep-out overlay (`?keepout=1`, gated on NODE_ENV): 90s at 1440px,
  zero incursions, closest approach 10.1px.
- The arrangement is composed in a **narrow nominal field (720×600)**, not a
  wide one. Radii are fixed px while the field's width is not, so a layout
  composed at the 1920 width collapses into label collisions at the 1024 width.
- The rAF loop performs **zero DOM reads** and writes only `transform`,
  `zIndex`, and an inner-wrapper `opacity`. One loop for all 17 nodes, zero
  React re-renders per frame — only one per hover change. It runs **only while
  the section intersects the viewport** (see § 6).
- Depth opacity is applied to the **circle only**. The label keeps its full
  #6B6455 — dimming type a reader must read would break § 11.
- Below **1360px** the readout stacks above the field and the field takes all 12
  columns; beside a cols-1–4 readout the field falls to 573px at 1200 and 400px
  at 900, where the labels cannot be kept apart. Below **900px** the field does
  not mount at all — the static four-column list is the section there.

AWS is one entry. Never expand it to Lambda / S3 / SQS / DynamoDB.

### §06 education
The left side of both rows — crests, school names, degree lines, location lines,
row heights, hairline rules — is **final**. Do not touch it.

Coursework column: two-column grid, column-first flow, one course per cell, no
separators of any kind. Items must never wrap; reduce mono size at a breakpoint
rather than allowing a wrap or truncating.

Photo per row — **the contact print and the plate.** Two sizes, not one.

**There is no room in the row for a mounted photograph, and this is measured,
not opinion.** At 1440px the body column is a locked 620px, the coursework
starts 32px after it, and the clear space right of the body's ink is 74px
(Georgetown) / 52px (TJHSST); the row is 260px tall at ≥1440px. A photo obeying
those numbers is ~119px wide, which is too small to read as a photograph at all.
Any attempt to mount a usefully-sized photo in the row grows the row. Do not
re-derive this — it has been measured twice.

- **the contact print** — the image itself at 28px, inline, 14px past the school
  name's last character, optically aligned to its cap height. It is the
  affordance: you can see it is a photograph and that there is more of it. Two
  micro crop marks (top-left, bottom-right only, 5px arms, 3px outside) tie it
  to the plate's language — without them a 28px photo beside a heading reads as
  a sticker. On hover/focus they step 2px further out along their diagonals and
  go to ink. That is the entire interaction on the print.
- **the anchor's height must be `0`, never `1em`.** An inline-block whose content
  is all out of flow takes its baseline from its bottom margin edge, so at `1em`
  it is a 40px box sitting entirely above the text baseline — taller than the
  name's own ascent. Measured: that grew the ≥1600px rows from 260px to 265px.
  At `height: 0` the row heights are byte-identical with and without the print.
- **the plate** — the full photograph. There is exactly **one** for the whole
  section, rendered by Education inside `.edu-grid` rather than inside either
  trigger, which is what makes "both rows stage it to the same coordinates"
  structural rather than two numbers kept in agreement. `position: absolute`
  against the grid — never fixed, never computed from scroll — with `top: 50%`
  (the equal-height grid puts the divider there) and `right: 0` (the content
  edge). Absolutely positioned children are out of flow, so it never becomes a
  grid item, reserves no space, contributes **0** to CLS, and cannot move a row
  height. Four crop marks, 0.5px ink, 14px arms, vertices 8px diagonally outside
  the corners, arms running back along the edges — never touching the photo,
  never closing into a rectangle. Real crop marks stay small whatever the sheet
  size, so they do **not** scale with the plate. Caption on one line beneath the
  bottom-left mark. No frame, no fill, no border box, no radius, no shadow, no
  filter, no grayscale.
- **Only the divider between the two rows retracts**, from its RIGHT end
  (`transform-origin: left`), stopping ≥48px clear of the plate's left crop
  mark. The rules above the Georgetown row never change length in any state.
  The scale is derived from the plate's measured width — reading `--plate-w`
  via `getPropertyValue` returns the unresolved `min(72vw, 300px)` token below
  1360px and `parseFloat` makes it NaN, which left the retraction silently
  holding its previous value.
- A pointer press focuses the trigger **before** it clicks it, so focus must not
  open the plate when the focus came from a pointer — otherwise one tap toggles
  twice and nothing appears.
- Opening: the photo uncovers top to bottom (420ms `reveal`), the crop marks
  arrive behind it at 120ms, the caption at 280ms. Leaving: the caption goes
  first (160ms), then the photo wipes back up (320ms, its OWN
  `cubic-bezier(0.4, 0, 0.2, 1)` — never the enter reversed) with the corners
  alongside it. Both runs are 480ms. clip-path and opacity only.
- **The photo must outlive the stage.** A conditionally rendered image unmounts
  the instant the stage ends and there is nothing left for the exit to animate,
  and it mounts with `data-open` already set so the enter has no state to travel
  from. `shown` (in the DOM) and `open` (revealed) are therefore separate: mount
  closed, open on the next frame, and hold the photo for the full exit before
  dropping it. Switching rows waits out the exit before mounting the incoming
  photo, so two are never visible at once.
- **At ≥1360px the plate is anchored to the content's right edge and sized so
  its left edge never reaches the body column** — measured clearance 41px
  (1360) to 308px (1920). It covers the coursework, never type being read, and
  *that* is what makes hover-to-open safe there. Below 1360px the coursework is
  already a full-width row under the body, leaving no clear space at any width,
  so the plate centres as a lightbox and opens on **click**, not hover. Tie the
  breakpoint to that layout change, not to a number.
- The print is the **only** pointer target. The plate is `pointer-events: none`,
  so it can never steal or trap a hover. Hovering the row or the coursework
  still does only what it already did.
- The two photos are **3:4** (4284×5712 and 2870×3826), not the 9:19.5 they are
  repeatedly assumed to be. They are **never** cropped — 9:19.5 would mean
  cutting ~57% of each image's width away.

---

## 6. Interaction systems

### Custom cursor
Native cursor fully hidden (`cursor: none`), scoped to
`@media (pointer: fine) and (hover: hover)`. Does not mount at all on coarse
pointers or below 900px.

- Default: one filled 7px dot, `#0A0908`, opacity 1.0.
- Hover on interactive: 7px → 4px. Nothing else.
- Click: scale 1.0 → 0.8 → 1.0 over 160ms.
- **Two nested elements.** The position layer carries `translate3d(x, y, 0)` and
  has **no transition, no tween, no easing, ever**. The scale layer carries
  `translate(-50%, -50%) scale(s)` and owns all transitions. Collapsing these
  into one element causes the dot to lag and dart sideways on click. This has
  already been fixed once — do not undo it.
- Exactly one writer to the position layer: the `pointermove` handler. No React
  state updates on pointer events.

### Ink canvas
Dragging draws a 0.5px ink stroke that fades over ~3.2s. Click drops a 2px ink
dot that fades over 1.4s.

- The canvas is portalled to `document.body` and must **not** descend from the
  Lenis wrapper, the grain layer, or anything with transform / filter /
  will-change / contain. Any of those break `position: fixed` and the ink draws
  offset from the pointer.
- Draw from `clientX` / `clientY` only. Never pageX/pageY, never add scrollY,
  never offset by a bounding rect.
- Ink draws over the map like anything else. There is no exclusion zone.
- `user-select: none` on pointerdown (via a class on `<html>` with
  `scrollbar-gutter: stable` so the document width does not change).
- rAF runs only between pointerdown and the end of the fade, then is cancelled.

### Glyph roll on "Jake Park"
A character rolls on one axis and lands on **itself**. The glyph never changes.
Identical copies inside a clip box; the stack translates by exactly one box
dimension so the outgoing copy exits as an identical copy arrives.

- 1500ms, `cubic-bezier(0.12, 0.9, 0.08, 1)`. Something viscous being pulled:
  a fast initial pull, then a long slow drag into place. The curve front-loads
  almost all the distance into the first ~25% of the time and spends the
  remaining 75% on the last sliver — **the extreme asymmetry is the effect.** A
  "smoother" curve reads as a flip again. No overshoot, bounce, elastic, spring,
  or secondary settle: it drags and it stops.
- Cadence is **clustered, not metronomic**. A uniform random interval reads as a
  metronome with jitter, so the gap after every event is re-rolled from three
  weighted modes: 30% CLUSTER (100–320ms), 45% NORMAL (700–1400ms), 25% PAUSE
  (2200–3600ms). A rest must read as a rest, so a CLUSTER may never follow a
  PAUSE directly — force at least one NORMAL between them. That demotion
  necessarily shifts the realized mix a few points from CLUSTER to NORMAL; that
  is the rule working, not drift.
- Max **four** concurrent. A character already mid-roll is skipped, never
  restarted — pick a different one. Repeat guard: no character twice within
  three consecutive events.
- **Direction is chosen once per CLUSTER, not per character.** Every roll that
  starts inside one cluster window travels the same axis and the same sign;
  independent per-character directions are what made a burst read as arbitrary.
  A new direction is picked after any NORMAL or PAUSE gap. Cluster starts are
  staggered by their natural 100–320ms interval — near-simultaneous, never
  synchronised to one frame.
- 60% vertical / 40% horizontal. Characters whose advance width is under 55% of
  the clip height are **vertical-only** — a short horizontal travel reads as a
  twitch. If a cluster's direction is horizontal they are simply not eligible
  for it; they sit that cluster out rather than being forced onto the axis.
- **All box dimensions and travel distances must be integer pixels.** Fractional
  values from the variable font cause the glyph to shiver against its own mask.
- Measure only after `document.fonts.ready`, and **with the roll's own armed
  markup already in place** — measuring while the characters are still plain
  inline text reads a different layout than the one the roll runs in, and the
  clip is not even positioned yet. Re-measure on resize, debounced.
- `overflow: hidden` on an `inline-block` with explicit width and height. Clip
  height from font ascent + descent + 8% headroom, not from a letter's ink.
  Nothing may ever render outside a character's own box.
- Clip **width**, unlike height, must come from the glyph's **ink**, not its
  advance. At display size the h1's -0.03em tracking and pair kerning shrink the
  laid-out advance while the ink stays put, so a box sized to the advance slices
  the glyph for the whole roll — measured at 129.6px, the k in "Jake" lost 3.9%
  of its ink, P 1.6%, r 1.5%. Size the cell so the centred glyph's ink clears
  both edges (`W ≥ 2·inkEnd − advance` and `W ≥ advance − 2·inkStart`, over a
  +8% floor), keep `W − advance` even so the centring offset stays a whole
  pixel, and pull the clip back by that offset so the resting line does not
  move. The clip box, the grid cell and the travel distance are then one number
  per axis — assert it.
- `<h1>` carries `aria-label="Jake Park"`; the glyph copies are `aria-hidden`.
- Compositor-only. If Layout or Paint appears in a profile during a roll, it is
  broken.

### Scroll
Lenis (`lerp: 0.09`, `duration: 1.1`), disabled under reduced motion and on
touch. **One shared rAF loop** for the whole page exposing normalized scroll
progress globally and per-section. Components subscribe; nothing runs its own
loop; everything unsubscribes on unmount.

**Zero persistent rAF loops and zero pending timers once the page settles, with
one exception: § 05's drifting field runs a single rAF loop ONLY while the
section is intersecting the viewport.** It starts on enter and is fully
cancelled on exit, on `document.hidden`, and under reduced motion. Everywhere
else the rule is absolute. Verify with a 5s Performance recording after settle,
and a second one with § 05 scrolled out of view.

---

## 7. Motion

Governing principle: **motion must encode a claim.** If you cannot say in one
sentence what a piece of motion is asserting, delete it.

Vocabulary — drawn, not faded. Pen plotter on paper: strokes appear by being
drawn along their length, elements arrive by being uncovered. Nothing slides in
from offscreen or scales up from nothing.

```
draw    cubic-bezier(0.22, 1, 0.36, 1)   700–1400ms
reveal  cubic-bezier(0.33, 1, 0.68, 1)   520ms
micro   cubic-bezier(0.4, 0, 0.2, 1)     140–180ms
settle  cubic-bezier(0.12, 0.9, 0.08, 1) 1500ms — the glyph roll only
```

Animate only `transform`, `opacity`, `stroke-dashoffset`, `clip-path`. Reveals
travel **max 14px**. Stagger 34ms, capped at 8 items.

**Banned motion:** parallax on images, typewriter on body copy, counting or
animating numbers, marquee, hover-lift with shadow, scroll-jacking, card flips,
magnetic buttons anywhere except the outro links.

**Cursor followers are banned** — an element lagging behind the pointer. The
custom pointer itself is exempt: it tracks with zero lag and *is* the pointer.
Only deliberate ink residue may lag.

**Glyph substitution is exempt from "drawn, not faded"** — but only as the
same-character roll described above, and only on the hero display type.

### Set pieces — max 3
1. **Hero / loader** — the DC map draws itself on a paper field, then travels to
   its hero position as the page arrives. One continuous event; the loader *is*
   this set piece, not a fourth.
2. **Projects** — each card carries a small SVG figure generated in-browser from
   what the project actually did. Draws once on entry, then stops.
3. **Experience timeline** — a single vertical hairline draws downward,
   scroll-linked, each role revealing as the line passes.

The §05 field is deliberately NOT a set piece: it has no entrance, draws
nothing, and asserts nothing by arriving. It is a standing state, not an event,
which is why it does not count against the max of 3.

### The loader
Empty paper → the boundary's two halves draw via `stroke-dashoffset` (1000ms,
both started in the same frame) → neighborhood group fades in as **one unit**
(not 46 staggered instances) → star and label fade → whole map transits to its
hero position while the loader background fades transparent → hero elements
arrive staggered 34ms.

- ≤2400ms total. Never gates on a network or font event. Global failsafe at
  3000ms force-unmounts and snaps to final state.
- **First visit per session only** — sessionStorage flag.
- The loader map and the hero map are the **same DOM node**. If you find yourself
  writing a cross-fade between two maps, the architecture is wrong.
- The boundary is **two paths**, `DC_BOUNDARY_WEST` and `DC_BOUNDARY_EAST`, cut
  from the same ring at the north corner and the south point, so the outline
  unzips from the north and closes at the south rather than tracing one vertex
  to the other. Their easing is `cubic-bezier(0.4, 0, 0.6, 1)` — near-linear, so
  pen speed stays constant across the ragged shoreline and the straight survey
  lines. Everything else in the loader keeps its own easing. `DC_OUTLINE` stays
  as the unpainted `[data-dc-boundary]` hit-test ring for the cursor.
- **`stroke-dasharray` on a `vector-effect="non-scaling-stroke"` path is measured
  in the SVG's viewBox→CSS space** — not in user units, and *not* including a CSS
  transform on the `<svg>` itself, even though `getScreenCTM()` reports that
  transform. So the dash length is `getTotalLength() * getScreenCTM().a` read
  **before** the loader's opening transform is applied. Getting this wrong does
  not fail loudly, it silently puts part of the path in the dash pattern's gap:
  measuring in user units dropped the two north edges for the whole transit, and
  measuring after the 0.46 transform made the pattern repeat inside the path.
- **Strip the dash properties entirely on the draw's `complete`** — set them to
  nothing, before the transit starts. A path that still carries dash geometry
  will re-evaluate it against any later scale change.
- Hero text must be in the server-rendered HTML, visually masked. Do not defer
  its render — LCP target is <1.8s.

### Reduced motion
A first-class path, not a fallback. Lenis off, reveals instant, loader never
mounts, glyph roll never starts and creates no timers, all set pieces render
their **final frame immediately**. Content is never lost, only the drawing of it.
Implemented as a `useReducedMotion()` hook checked before any anime.js call, not
a CSS override.

---

## 8. Banned — the "AI-generated UI" list

Never produce these, even if asked indirectly:

- Gradients of any kind, gradient text, mesh backgrounds
- Glassmorphism, backdrop-blur, frosted panels
- Glow, neon, bloom, colored shadows
- Floating particles, blobs, aurora, star fields — banned as **decorative
  background**. § 05's field is exempt: every element is a labeled data object
  carrying content, nothing is ambient, and there is no background layer. The
  test is whether removing an element loses information. If it does not, it is a
  particle and it is banned.
- Rounded pill badges in a row (the shadcn tag-chip look) — tech stacks are mono
  text separated by `·`
- Proficiency bars, percentages-as-progress, star ratings, dots-out-of-five
- Animated stat counters
- Emoji, 3D icons, icon fonts, logo packs. Links are text.
- Centered hero with headline + subhead + two side-by-side CTA buttons
- Card grids with hover-lift + shadow
- Inter / Poppins / Montserrat / Space Grotesk as display

---

## 9. Decisions already made — do not re-propose

- **The DC map** went through four iterations. A geometric Brownian walk (killed
  — too close to ethwang.com, a friend's site); a hand-authored DC outline
  (failed — the model cannot draw a coastline from memory, it came out as a
  lightning bolt); tracing a stock doodle PNG (rejected — licensing, plus lumpy
  vectorized edges next to 0.5px hairlines). Current approach is real GeoJSON
  converted at build time. **Lesson: for anything geometric and real-world, use
  real data converted at build time. Never ask the model to draw it from memory.**
- **The cursor was a crosshair.** Rejected — read as a videogame reticle. It is a
  dot. Do not add a ring, halo, outline, label, blend mode, or magnetic snap.
- **Skills took the site's one axis break** when it was a stepped spine. It is
  now the drifting field, which breaks the grid in a different way but is still
  the site's one non-linear composition. §04 projects therefore stays
  vertically composed. One rule-break reads as intentional; two read as a tic.
- **The stepped-spine skills section was deleted and rebuilt as the field.**
  The spine, the four stations, the ticks and the min-height logic are gone. Do
  not reintroduce them or adapt the field back toward them.
- **Skills had large metric figures** (2M+, 0.86, 43×, 16K) under each station.
  Removed — they made the section too tall. If the section ever reads thin, the
  cheapest fix is a mono-micro caption line per station, not the big figures.
- **Skills had an engineering title block** (PLATE / DOMAINS / SCALE grid) and a
  separate ADDITIONAL row. Both deleted. Everything lives in the four stations.
- **Skills was once a straight horizontal spine with ticks pointing up.** It
  connected nothing and read as decoration. The spine must touch what it
  connects.
- **RAW / SHIPPED terminals** were removed when the stations became categories
  rather than pipeline stages. The spine is composition now, not an argument.
- **The ink trail once had a map exclusion zone.** Reversed — draw anywhere.
- **A text-scramble effect** (characters cycling through substitute glyphs) was
  built and rejected as glitchy. The roll replaced it. Do not reintroduce glyph
  substitution.
- **Education rows once reserved their own heights individually.** Wrong — both
  rows reserve the taller.
- **A signal board** (GitHub commit graph, DC sports records, a "now" block) and
  an AI chatbot were both cut. The page was too long.

Reference sites, for tone only: animejs.com (every animation demonstrates the
thing it sells — nothing is decorative) and wodniack.dev (craft level, enormous
care per element on very little content). **ethwang.com is off-limits as a
source** — his live-drawn stochastic hero path is his signature, Jake knows him
personally, and borrowing from it already caused one revert.

---

## 10. Responsive

- Display type: `clamp(56px, 9vw, 138px)`
- Section padding: `clamp(24px, 6vw, 96px)`
- Text column: `min(632px, 100%)`
- Hero: `min-height: 100svh` (svh, not vh)
- Below 900px: nav hides, nav gutter goes to 0, cursor and ink systems do not
  mount, reserved drawing zones move **below** text rather than beside it
- Below 640px: plate frame inset drops to 16px, mono labels to 11px / 0.16em

Mobile is not an afterthought — assume half of recruiter traffic is a phone.

---

## 11. Accessibility

- Every interactive element reachable and visible on keyboard focus. Focus ring
  is a 1px accent outline with 2px offset — not a browser default, not removed.
- All external links: `target="_blank" rel="noopener noreferrer"`.
- Any text a user must read uses `#6B6455` minimum, ideally `#2E2A24`.
- One `<h1>`. Sections as `<section>` with `aria-labelledby`.
- Decorative SVG gets `aria-hidden`; meaningful SVG gets a `<title>`.

---

## 12. Performance budget

- **Total route JS < 150KB gzipped — hard ceiling.** Report the gzipped figure
  and the delta on every build, with remaining headroom stated.
- LCP < 1.8s on 4G, CLS < 0.05, Lighthouse ≥ 95 all four
- 60fps under 6× CPU throttle through a full page scroll
- Zero persistent rAF loops and zero pending timers once the page settles —
  except § 05's field loop, which runs only while that section is on screen and
  is fully cancelled on exit, on `document.hidden`, and under reduced motion
  (see § 6 Scroll)
- anime.js imported modularly, never the whole bundle
- Raster images are limited to three — the about-section portrait and one photo
  per education row. Everything else is SVG or type.

---

## 13. Working rules

- **Build static and correct first.** Motion is layered afterward, one section at
  a time. Never animate a section that is not content-complete — motion designed
  against incomplete content gets thrown away, and once things move it becomes
  easy to ship weak copy that "feels fine because it animates."
- Never write placeholder copy. If content is missing, stop and ask.
- **When a bug's cause is not obvious, instrument and report before editing.**
  State which measured value diverges. Do not fix a symptom by shortening a
  duration or hiding an artifact with CSS.
- **When this file turns out to be wrong, say so plainly and amend it** in the
  same session. Do not silently work around it. If a session reveals a gap in
  the spec, the fix is to amend the spec, not to remember it in chat.
- Commit per section, conventional messages, small diffs. Never commit a failing
  build — `npm run build` passes first.
- Claude Code does not push. Jake handles remotes manually.
- Before any public push: grep history for secrets.
- After each section: verify at 1920, 1440, 1280, 1024, 900, 768, 390; confirm
  nothing runs under the fixed nav at ≥900px; confirm the cursor and ink systems
  still behave; report the bundle delta.