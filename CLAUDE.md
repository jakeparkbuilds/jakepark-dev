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
  a user must read.
- Never pure white, never pure black, never a gray with blue in it.
- No dark mode. This site is paper. Do not add a theme toggle.
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

- Hairlines **0.5px**, `vector-effect="non-scaling-stroke"` on all SVG strokes.
  Exception: the DC map's outer District boundary is **0.9px** so it dominates
  the 0.5px / 0.28-opacity neighborhood lines.
- `border-radius: 0` on everything, with exactly one exception: `.cursor-dot`
  uses `border-radius: 50%` because it is a literal circle. No other exceptions.
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
| 03 | experience | **not built** |
| 04 | projects | **not built** |
| 05 | skills | done |
| 06 | education | done |
| 07 | connect | done |

**Content still owed by Jake** before §03 and §04 can be built: project
descriptions (2–3 sentences each for My 5, CapitolCast, transit/APC) and a
decision on how much prose each of the five roles gets. Never write placeholder
copy. If content is missing, stop and ask.

**§05 skills is the quality bar.** Match its level of composition when building
§03 and §04.

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

### §05 skills
Four stations staged on a **stepped hairline** that descends left to right in
40px drops (32px at 1024–1200, 24px at 900–1024). One continuous SVG `<path>`,
hard 90° corners, four 16px ticks pointing **down** into the content. Below
900px the spine rotates vertical with ticks pointing right.

Stations: `languages` / `ml & data` / `infrastructure` / `interfaces`. Each is
index → domain (46px) → one primary tool (24px, Bricolage) → supporting tools
(mono 12px, inline, middot-separated, max 2 lines). All four stations must bottom
out at the **same offset** from their own spine run — enforce with a fixed
min-height computed from the tallest.

AWS is one entry. Never expand it to Lambda / S3 / SQS / DynamoDB.

### §06 education
The left side of both rows — crests, school names, degree lines, location lines,
row heights, hairline rules — is **final**. Do not touch it.

Coursework column: two-column grid, column-first flow, one course per cell, no
separators of any kind. Items must never wrap; reduce mono size at a breakpoint
rather than allowing a wrap or truncating.

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

- 1150ms, `cubic-bezier(0.16, 1, 0.3, 1)`. Long, soft, dragging. No overshoot.
- Fires every 900–1800ms, randomized. Max three concurrent, starts ≥250ms apart.
  Repeat guard: no character twice within three consecutive events.
- 60% vertical / 40% horizontal. Characters whose advance width is under 55% of
  the clip height are **vertical-only** — a short horizontal travel reads as a
  twitch.
- **All box dimensions and travel distances must be integer pixels.** Fractional
  values from the variable font cause the glyph to shiver against its own mask.
- Measure only after `document.fonts.ready`. Re-measure on resize, debounced.
- `overflow: hidden` on an `inline-block` with explicit width and height. Clip
  height from font ascent + descent + 8% headroom, not from a letter's ink.
  Nothing may ever render outside a character's own box.
- `<h1>` carries `aria-label="Jake Park"`; the glyph copies are `aria-hidden`.
- Compositor-only. If Layout or Paint appears in a profile during a roll, it is
  broken.

### Scroll
Lenis (`lerp: 0.09`, `duration: 1.1`), disabled under reduced motion and on
touch. **One shared rAF loop** for the whole page exposing normalized scroll
progress globally and per-section. Components subscribe; nothing runs its own
loop; everything unsubscribes on unmount.

**Zero persistent rAF loops and zero pending timers once the page settles.**
Verify with a 5s Performance recording after settle.

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
settle  cubic-bezier(0.16, 1, 0.3, 1)    1150ms — the glyph roll only
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

Candidate, not committed: the §05 spine drawing itself along its length. This
would be a 4th set piece and requires dropping or merging an existing one.

### The loader
Empty paper → boundary draws via `stroke-dashoffset` (900ms) → neighborhood
group fades in as **one unit** (not 46 staggered instances) → star and label fade
→ whole map transits to its hero position while the loader background fades
transparent → hero elements arrive staggered 34ms.

- ≤2400ms total. Never gates on a network or font event. Global failsafe at
  3000ms force-unmounts and snaps to final state.
- **First visit per session only** — sessionStorage flag.
- The loader map and the hero map are the **same DOM node**. If you find yourself
  writing a cross-fade between two maps, the architecture is wrong.
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
- Floating particles, blobs, aurora, star fields
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
- **Skills took the site's one axis break.** §04 projects therefore stays
  vertically composed. One rule-break reads as intentional; two read as a tic.
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
- Zero persistent rAF loops and zero pending timers once the page settles
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