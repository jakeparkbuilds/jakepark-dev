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
mark     #C8952E   warm ochre — the Georgetown star ONLY (hero map + its
                   ghost on connect; the same star, twice)
```

Legibility variants: `#6B6455` for any mono text a user must read (nav labels,
section markers, gutter annotations, captions, coursework). `#0A0908` for the
cursor dot and active nav label — the two darkest objects on the page.

Rules:
- Accent appears on **~3% of any viewport**. Reaching for it a third time in one
  section means the composition is wrong, not that it needs more accent.
- `mark` #C8952E appears as **exactly one object, in exactly two places**: the
  filled Georgetown star, on the hero map and again on the connect section's
  ghost map. It is the same star at the same coordinates on the same geometry,
  and connect's copy exists only to close the bookend the hero opened — the
  first and last saturated points on the page are the same mark. Nothing else,
  in any section, ever. If a future section wants ochre, the answer is no; and
  if a future element wants to be the star's third appearance, the answer is
  also no, because two is a bookend and three is a motif.
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
of meaning: `mark` remains the star's alone and this remains § 03-only. Neither may
reference the other's token.

**Brand color.** The palette rules otherwise assume no external color at all.
Amend: **§ 03 displays five third-party logos at their native brand colors,
contained within paper tiles.** Brand color is quarantined to those tiles and
appears nowhere else on the site.
- Never pure white, never pure black, never a gray with blue in it.
- No dark mode, and no theme of any kind: there is no toggle and nothing on the
  site responds to a system preference. **Exactly three grounds exist. There is
  no fourth.**

```
paper     #F5F1E8   the default — every section not named below
ink       #1A1815   § 03 experience ONLY — the inverted plate, paper type
drafting  #EDEBE4   § 04 projects ONLY — cooler and one step darker than
                    paper, carrying the blueprint ruling (§ 5 / §04)
```

  § 03 is the only inverted section and no other may become one. § 04 is the
  only ruled one. Both are full-bleed horizontally, breaking the plate frame.
  A third register is the point — three sections, three grounds, no repetition
  — so do not give a fourth section a ground of its own to match them.
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
- Mono is for labels and metadata **with one sanctioned exception**: § 07's email
  monument sets Plex Mono at up to 58px. See § 5 / §07 — the address is data, and
  that is the point. Nothing else may borrow it.
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
| 03 | experience | done — the inverted plate, entries arrive on scroll |
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

### §03 experience — the arrival
Each of the five entries animates in as it is scrolled to, once: translateX 28
→ 0 with opacity 0 → 1 over 620ms on `reveal`, staggered 60ms across tile → org
(the date stamp rides with it) → role title → description. It never reverses and
never replays.

- **Five independent triggers, never one section-level stagger.** A visitor
  landing mid-section would otherwise watch entries animate that they had
  already scrolled past. Measured: arriving at the top of § 03 animates 01–03
  while 04 and 05 sit untouched below the fold.
- **The hidden start state is applied by `[data-motion="armed"]`**, set by the
  client in a layout effect. Entries are hidden ONLY when something is
  guaranteed to reveal them — with no JS, failed JS, or reduced motion the
  section renders exactly as it always did. Never make the hidden state the CSS
  default.
- An observer reports a **change**, not a state. A reload that restores a scroll
  position below § 03 delivers the one initial callback with the entry already
  past, which strands it at opacity 0 — so that case lands instantly, with no
  animation. Jumping past the section cannot be covered (above → below is
  false → false, no callback) and needs no cover: those entries are off screen
  and animate normally on the way back up.
- **The spine is not part of this.** Its segments belong to the margin trace and
  keep their own scroll-driven draw; nothing here touches `[data-role]`.

### The nav — inversion, per element
The nav is fixed and passes over § 03's ink plate, where its ink labels collapse
to 3.02:1 and the active one to 1.12:1. It inverts with the ground — but **each
element decides for itself, from what is directly behind IT**, comparing its own
midpoint against § 03's edges on the shared Lenis loop.

- It was one observer for the whole nav, keyed to the plate crossing the nav's
  band, and that is wrong in a way that is easy to miss: a fixed column is
  ~200px tall, so a single verdict makes the top of it turn light while it is
  still sitting on paper. **Mid-transition the list is legitimately part ink and
  part paper**, the flip running up the column as the edge passes each item.
  That reads as intentional; a whole-nav flip reads as a bug.
- 200ms, so nothing snaps as the boundary crosses a midpoint.
- Rides the shared loop — never a second scroll listener. All reads happen
  before any write, so a frame costs one layout pass, and an attribute is only
  touched when its value changes.

### The nav — the persistent name
`Jake Park` sits 28px above `ME` in the fixed gutter. It is **visible from first
paint and never fades out**, including on the hero; on a first visit it arrives
with the loader stagger, immediately after the mono label. Clicking returns to
the top.

- **Document order is not the arrival order.** `<Nav />` precedes `<Hero />`, so
  the name would lead the stagger. `data-hero-reveal` carries an optional rank
  and HeroIntro sorts by it (stable, so anything unranked keeps document order):
  mono label 0, the name 1, Jake 2, Park 3, the discipline line 4, the blurb 5,
  the hero's social links 6.
- **No CSS opacity transition on it.** anime writes inline opacity every frame of
  the entrance, and a transition on the same property smears every one of those
  writes.

- It is a **name, not a nav label**: Bricolage 16/500 in sentence case, never
  uppercased and never mono. Everything around it is mono and uppercase, which
  is exactly why it reads as a signature rather than a seventh section.
- Right-aligned to the nav labels' **text** edge, which is also what keeps it
  clear of the active dash: every nav item is `dash + gap + label` with the dash
  hanging to the LEFT, so aligning to the flex container's right edge separates
  them by construction rather than by a number.
- The 28px is set as a **16px margin** — the nav column has a 12px flex gap that
  applies here too, and setting 28 directly measures 40.
- Inverts on its own midpoint like every other nav element. Not rendered below
  900px.

### §07 — pizza rain
70 hand-drawn slices fall across the viewport when the visitor reaches the bottom
of the page, once per session, then the layer unmounts. A button appears
afterwards to replay it. It is a joke and it is meant to read as one.

- **Drawn as inline SVG, never an emoji.** An emoji is a different picture on
  every platform and sits at the wrong weight beside this type — which is the
  reason emoji are banned at all. The exception in § 8 is for a drawing that
  happens to be a joke, not for the joke.
- One rAF for all 70, writing transform and opacity and reading nothing,
  cancelled when the last slice lands. Portalled to `<body>` so no transformed
  ancestor can break `position: fixed` — the same rule the ink canvas follows —
  at z-index 400: above every section, below the cursor's 9999.
- **The replay lockout's reference must start at `-Infinity`, never 0.**
  `performance.now()` is milliseconds since page load, so a 0 means "a rain just
  happened at load" and swallows every trigger in the first four seconds — which
  is exactly when a visitor deep-linked to the bottom would hit it. This cost a
  debugging pass: the trigger fired correctly at progress 1 and the burst
  returned immediately.
- The trigger wears the site's own affordance vocabulary — hollow square, gap,
  mono label — **because** what it does is off-theme. The joke is better for
  being announced in the same voice as everything else. It is 7px; § 06's photo
  reference is 12px, so they match in treatment, not in size.
- Reduced motion never rains: the button is present from load and scatters ~20
  slices statically for 1.2s. The joke survives, the motion does not.

### §02 about / §07 connect — the character reveal
Each character of a paragraph carries its own threshold along that paragraph's
progress through the viewport, so reading the page is what inks it in. § 02's
four gutter-annotated paragraphs (each its own window) and § 07's blurb. Nowhere
else — never a heading, a mono label, or the hero blurb.

- **Colour, never opacity.** Unread is #C4BDB0 and read is body #2E2A24. Fading
  from a low opacity, as the usual version of this effect does, would put unread
  type near 1.2:1 on paper — § 11 does not allow type a reader must read to go
  that quiet, and the paragraph would read as missing rather than as un-inked.
- **Thresholds pack into [0, 1 − RAMP], not [0, 1].** A last character whose
  threshold is (total−1)/total needs progress 1.048 to finish its own ramp, and
  progress stops at 1. Measured: five characters were left part-inked at the end
  of every window.
- Colours are written to the spans through refs. The component holds no
  per-frame state and there are **zero DOM structure or text mutations** across
  a 120-frame scroll — only style writes. Whitespace gets no span.
- The characters are `aria-hidden` and the real string follows once in an
  `.sr-only` span. `aria-label` on a `<p>` is not a reliable naming target, so
  the string is real text, not an attribute.
- Reduced motion: the spans **render** at the read colour and nothing ever
  subscribes, so the paragraph is fully legible with no JS and no scroll
  linkage. The branch is in the effect, never in render — branching on a
  client-only value during render is the § 05 hydration trap.

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

### §07 connect — the composition
**Three elements in the centre, and the EMAIL is the monument.** It holds the
position and the weight the display headline used to, which is why the headline
demotes to a 13px mono label above it. `you've reached the end` is deleted: the
bands and the end of the page already say that, and a label announcing it was a
fourth thing competing for one centre.

```
LET'S CONNECT                       mono label, 13px / 0.24em / #6B6455
        ↕ 32px
jp2282 [at] georgetown [dot] edu    IBM Plex Mono 500, ink, -0.01em, one line
        ↕ 28px
always up for a conversation …      Bricolage 19/400, #2E2A24, one line ≥1200px
```

- The `mailto:` href carries the **real address**; the bracket notation is
  display only, with `[at]` and `[dot]` in #6B6455 so they read as annotation
  rather than as part of the address.
- **This is the one place mono is used at display scale** (§ 3's table assigns it
  to labels and metadata). It is deliberate: the address is data, and setting the
  page's largest type in the data face is the joke of the section landing
  straight.
- **The email's size is the smaller of the specified size and what fits.**
  `clamp(28px, 4.2vw, 58px)` is a viewport measure and § 07's content box is not
  the viewport — below 1280px it also gives up 180px to the nav gutter. At 1200
  the spec asks for 50.4px, which lays the address out at 967px inside an 876px
  column; `nowrap` does not wrap that, it pushes a horizontal scrollbar onto the
  document. So `min(clamp(...), 5.1cqi)`: 32 characters at 0.6em advance less
  0.01em tracking is 18.88em, so it fits at container/18.88 (5.30cqi), taken with
  a 4% margin. Where the spec fits it wins unchanged.
- **§ 07 centres on the full viewport, so above 1280px nothing reserves the nav
  column** — safe while the centre was a 720px text column, not safe with a 58px
  monument in it. Measured, the email's right edge landed 48px inside the nav at
  1280 and 18px at 1440. The centre block insets by the nav's width (a constant
  104px) plus 24px, **symmetrically**, so it stays viewport-centred instead of
  being shoved off-centre by a one-sided gutter — and since that block is also
  the email's sizing container, the monument shrinks to match by itself.
- The underline **draws** left to right in 380ms and **retracts** right to left
  in 280ms, never the enter reversed. Switching `transform-origin` with the
  hover state is what buys the second direction.

**The section fills exactly one viewport and distributes itself.** `min-height:
100svh` with a stage that takes whatever the bands and the footer do not, so the
footer sits on the bottom edge. The stage's 5svh top padding is what puts the
block slightly high rather than dead centre — its content centres inside the
padding box, so the middle lands at ~38% and stays proportional at other heights
instead of drifting the way a fixed offset would. Measured 900.0px at 1440×900,
block midpoint 35.8%. **Do not go back to padding tuned to one viewport height;**
three passes in a row had to re-tune it.

**The footer is one row, three parts, one baseline**: trigger left, socials
centred, coordinates right, beneath a full-width rule. The outer tracks are
`flex: 1 1 0` so they take equal width whatever they contain and the middle is
centred on the section. Source order is socials → coordinates → trigger, which is
the stacking order below 1024, and `order` arranges them above it — neither
arrangement needs its own markup. Stacked, the middots are **removed, not
hidden**, and with them gone the three names fit 390px on one line, which is why
the row stays `nowrap` all the way down and can never orphan a separator.

Magnetism covers § 07's **text as well as its links**, each element with its own
independent field, and **strength is set by weight** — heavier type moves less,
so the section reads as having mass rather than as uniformly springy:

| element | divisor | field |
|---|---|---|
| the email — the monument | 6 | 200px |
| `LET'S CONNECT` | 4 | 140px |
| each social link | 5 | 150px |

Position only: no scale, no colour, no rotation. Pointer-fine only, never under
reduced motion, and § 07 only.

- **The blurb is deliberately excluded**, along with the footer coordinate line
  and the bands. The blurb carries the character reveal, and two systems writing
  to one element fight.
- The middots between the socials never move — the separator is structure, and
  structure holding still is what makes the words read as moving.

- **One pointermove listener for every magnet, not one per element.** Each
  magnet needs its rect on every move; four that each read and then wrote would
  force four layouts per event. The registry reads every rect first and writes
  every transform after. Rects are cached and invalidated by scroll and resize.
- **A magnet that only hears `pointermove` gets stranded.** Move the pointer out
  of the window in one gesture and no further move event arrives, so the link
  holds its offset until the pointer returns — measured, the email sat at 40px
  indefinitely. Release on `pointerleave` (document) and `blur` (window).
- The cursor dot is unaffected: measured sitting exactly on the true pointer
  while the link is displaced 70px away from it.

**The type bands** are two full-bleed rows of outlined display type drifting
against each other on a **continuous autoplay loop at 28px/s**, band 1 left to
right and band 2 right to left. Set piece 6, and the site's only autoplaying
motion. One rAF drives both, gated on § 07's intersection and on
`document.hidden`.

- **Full bleed by cancelling the section's own padding**, never the usual
  `left: 50%; width: 100vw; margin-left: -50vw`. That idiom assumes the parent
  is centred in the viewport and § 07's is not — it carries the 180px nav gutter
  as padding-right below 1280px, which puts the content box centre 90px left of
  the viewport centre. Measured: the bands started at −90px and left 90px of the
  right edge bare at 1200, 1024 and 900.
- The translate is wrapped modulo **one measured repetition width**, with three
  copies in the DOM, so it never exposes a gap at either end.
- Type is outlined at 0.75px ink, `clamp(38px, 4.4vw, 64px)`, 6px between the
  bands. The section must fit **one viewport at 1440×900 with no scrolling** —
  that constraint, not taste, is what sets the size.
- **The letterforms are filled with a hairline hatch, and the hatch is fixed to
  the viewport, not to the text.** As a band travels, the letters move across a
  stationary hatch field rather than carrying it along — that is the whole
  effect, and it is what makes the type read as engraved rather than hollow.
  Band 1 is 45° at 6px spacing / 0.30 alpha, band 2 vertical at 5px / 0.22.
  Straight ink hairlines only: no colour, no gradient, no noise.
- Two bands down to 900px, **one** below it at 30px.

### Hero
Two-column. Left: mono label `CS + MATH @ GEORGETOWN`, "Jake" / "Park" at display
scale, blurb, four text links with 10px inline brand glyphs, then the discipline
line. Right: the DC map.

**The discipline line** — `working in machine learning`, a THIRD LINE OF THE
NAME BLOCK: 24px under "Park", left-aligned to the display type's left edge, on
one baseline. `working in` is Bricolage 21px/400 #6B6455 and the phrase is
21px/500 ink. It is a continuation of the name, never a mono label and never a
separate UI element parked under the social links.

**The gesture is a WIPE, not a roll.** It was built as a roll first and that was
wrong: the name already owns the roll, so the hero performed one gesture twice
and the second read as a copy. A 0.5px ink rule crosses the slot left to right —
behind it the old phrase is gone, in front of it the new one has arrived. A pen
bar sweeping the line clean and re-inking it. 620ms,
`cubic-bezier(0.4, 0, 0.2, 1)`: brisk and mechanical, deliberately not the
name's settle. The rule fades over the last 80ms as it exits. **The text never
moves and never fades** — no vertical travel, no opacity on the type, no glyph
substitution. It is uncovered and covered.

- Two absolutely-stacked layers in one grid cell: the outgoing clipped
  `inset(0 0 0 0%→100%)`, the incoming `inset(0 100%→0% 0 0)`, the rule
  translating 0→slot width. All four animations are created in the same task so
  they share a start time; measured over 1072 mid-wipe frames the three edges
  are at an **identical x, spread 0.00px**. Layers carry an opaque paper
  background so they can never show through each other.
- **The slot is sized to the WIDEST phrase, and this is structural.** The slot
  is an `inline-grid` and all three phrases sit in the SAME cell as hidden
  ghosts, so the browser picks the maximum — true in the SSR HTML, before any
  script, and through a font swap. The measured `min-width` (ceil, after
  `document.fonts.ready`) is a second guarantee that can only prevent a clip.
  A slot sized to its current phrase clipped `software development` for its
  whole life on screen; that is the bug this shape exists to make impossible.
- Hold 3200ms, wipe 620ms, forever while the hero is on screen. setTimeout
  chaining and WAAPI; never a rAF loop. Paused with all timers cleared and all
  animations cancelled on viewport exit and on `document.hidden`.
- **The name roll and the discipline wipe may never fire within 400ms of each
  other.** Both go through `app/lib/roll-scheduler.ts`, which defers the
  colliding event rather than dropping it. The name's timestamp must be taken
  where its animation actually starts, not in `tick()` — `rollOne` defers
  `.animate()` one frame for layer promotion, and recording at tick time put the
  measured gap at 392ms against a 400ms rule.
- A visually-hidden span carries all three phrases; the slot is `aria-hidden`.

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

- **Drift speed lives in two numbers and the clamps own the rest.** Sine periods
  are 9–17s and the depth cycle 13–21s (halved from 18–34s / 24–40s); requested
  amplitude is 28–58px (from 20–45px). Requested is not realized: the
  relaxation cuts an individual node's travel wherever the extra range would
  put it into a label or a keep-out zone, so mean realized amplitude rose only
  22.7/19.7px from 19.1/18.0px. **Almost all of the perceived speed comes from
  the period, not the amplitude** — the field is space-limited, not
  parameter-limited, and asking for more travel mostly gets clamped away. Two
  nodes are clamped to zero travel and always have been. Never raise the speed
  by touching the hover or select transitions; those are not ambient drift.
- All content and the whole arrangement live in `app/lib/skills.ts` behind a
  **fixed integer seed** (mulberry32) at module scope. `drift(seed, 0)` is
  rendered inline by the server, so the SSR HTML *is* frame 0 — hydration
  matches and the reduced-motion path needs no JS at all.
- **The field is kinematic at runtime, and this REVERSES how it used to work.**
  It was a pure function of time — `base + sin(t)`, bounded structurally, no
  state, no bounce, no collision. That guaranteed bounds and label separation
  but let two nodes pass straight through each other, which became obvious once
  the drift was sped up. Each node now carries a position and a velocity,
  travels in a straight line, and reflects elastically off other nodes, off the
  four keep-out zones and off the field's edges. `app/lib/field-physics.ts`.
  **Do not restore the sine drift to "simplify" this** — passing through is the
  bug it was reverted for.
- The seed still decides where every node starts (the same t = 0 frame the
  server renders, so hydration is unchanged), how fast it goes, and which way it
  sets off. Only the trajectory is emergent. Equal mass: the two nodes in a
  collision swap their normal velocity components, so a primary deflects exactly
  as much as a tertiary.
- **Every node is leashed to its seeded home, and the leash is CONTENT, not a
  comfort setting.** Free motion is not unbounded motion: with collisions alone
  every deflection is permanent, so the field random-walks and — measured over
  120s — a node travels up to **833px** from where it started, which at a 764px
  field means java ends up under INTERFACES and the four axis labels stop
  describing anything. Each node therefore keeps its composed position as a home
  and roams only a disc around it: radius `hypot(ax, ay) × 1.7`, floored at 52px
  and capped at 96px, so a node the seed gave room still travels further than one
  wedged between two labels. Max excursion is now **96px** at every width.
- The leash is a **wall, not a spring** — nothing pulls a node toward home. It
  reflects the radial velocity component and leaves the tangential one alone, so
  a node reaching the edge of its territory turns along it rather than bouncing
  back the way it came. A spring would read as elastic and the section has no
  elastic motion anywhere.
- **The leash resolves FIRST in the wall pass and pushes far more weakly than
  anything else** (0.7px/frame against MAX_PUSH's 2). Both halves are load-
  bearing and both were measured as bugs first. Resolved last, its pull dragged
  nodes back toward home and straight out of the field — 2 nodes outside the
  bounds on every frame of a 120s run; the zones and the field edges are hard
  guarantees and the leash is a preference, so the hard walls must get the last
  word. At full push strength it shoved nodes back into neighbours the collision
  pass had just separated. The velocity reflection is what actually contains a
  node; the push only cleans up overshoot.
- A leash floor below 52px cannot be held: a primary in traffic gets shoved past
  it and cannot get back, measured at 26.4px of overshoot with a 34px floor
  against **0.00px** at 52.
- **Ring clearance does not keep NAMES apart.** A label box is far wider than
  its ring, so the collision pass resolves two things: circles at radius + 6px,
  and label AABBs along their least-penetrated axis. Collision on rings alone
  leaves exactly the overlaps that were visible (xgboost/python, c++/sql,
  fastapi/next.js).
- **Three rules keep it stable and all three are load-bearing.** (1) Resolve a
  pair only while it is APPROACHING — resolving a separating pair makes two
  touching nodes buzz forever. (2) Positional correction has a slop and a gain
  below 1; correcting the whole overlap each frame oscillates. (3) Renormalise
  every node's speed to its seeded value after the pass — elastic collisions
  conserve energy in theory but not in floating point, and the field otherwise
  heats up until nodes streak or cools until it stops.
- **Static walls must budget for the depth scale**, not the collision radius:
  the rendered ring reaches 1.12× and using `r + 6` left a measured 0.85px
  incursion into the keep-out zones.
- **The mount settle is intentional.** The seeded arrangement guaranteed that
  labels stay apart, never that rings do — rings were explicitly meant to cross
  — so on arrival some pairs interpenetrate by as much as 69px. A per-frame cap
  on the positional push eases that apart over ~0.33s instead of snapping it in
  three frames. In steady state the cap never binds; the fastest closing speed
  in the field is ~0.3px per frame.
- Measured, 120s at 1440/1360/1024/1920 after the settle: **zero ring overlaps,
  zero label overlaps, zero keep-out incursions, zero nodes leaving the field,
  zero leash overshoot**, ≤1.28 direction reversals per second per node (no
  jitter), longest contact 4.17s against HEAD-before-the-leash's 5.77s — the
  leash raises contact time, because a confined node meets its neighbours more
  often, but it does not introduce sticking. Under 6× CPU throttle: median frame 8.3ms, worst 15.9ms, no frame
  over 32ms.
- Naive O(n²) over 17 nodes is 136 checks a frame. Never add a spatial index or
  a physics library.
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

**The two crests are sized individually and must never be normalised to one
height.** They are opposite kinds of mark: Georgetown's G is a solid navy glyph,
TJHSST's is a fine-line seal. Measured at an identical 200px set height the G
carries 2.7× the contrast-weighted ink (19,339 units at 0.578 density against
7,190 at 0.180), so at equal height the seal reads as the smaller of the two.
TJHSST is therefore set 1.20× Georgetown — 48/62px against 40/52px, per entry
via `logoHeight` in `education.tsx`. Size by perceived weight, never by bounding
box.

Neither crest sits in a tile. On a paper section a paper tile is invisible by
definition, so the correct result is no visible box at all — the marks sit
directly on the ground, at native brand colors, with no filter, tint, or
desaturation. `georgetown.svg` originally carried a second, slightly larger copy
of the G filled #c6bcb6 behind the navy one: an offset keyline for placement on
photographs, which on paper was the only thing reading as an edge. It is
removed. `tjhsst.svg` is already transparent — its white is interior artwork,
not a ground.

Coursework column: two-column grid, column-first flow, one course per cell, no
separators of any kind. Items must never wrap; reduce mono size at a breakpoint
rather than allowing a wrap or truncating.

Photo per row — **the reference mark and the plate.**

**There is no room in the row for a mounted photograph, and this is measured,
not opinion.** At 1440px the body column is a locked 620px, the coursework
starts 32px after it, and the clear space right of the body's ink is 74px
(Georgetown) / 52px (TJHSST); the row is 260px tall at ≥1440px. A photo obeying
those numbers is ~119px wide, which is too small to read as a photograph at all.
Any attempt to mount a usefully-sized photo in the row grows the row. Do not
re-derive this — it has been measured twice.

- **the reference mark** — a 12px hollow ink square at 1px, a 0.5px muted
  leader across a 14px gap, and `PHOTO` at 13px/0.20em #6B6455, sitting 14px
  past the school name's last character and optically aligned to its cap band
  (the label's centre at 14.5px above the baseline). On hover/focus the square
  fills solid ink and the label goes to #1A1815 over 150ms `micro`. That is the
  entire interaction on the mark.
  **The hit area extends 8px past the ink on every side** — 94×29 against 78px
  of ink, 2.8× the area of the first version, which was too small to notice or
  to hit. It is padding on the button with the box offset by the same 8px, so
  the ink did not move and the focus ring frames what is actually clickable.
  Row heights are byte-identical before and after: 248.52 (1920), 306 (1440),
  350.52/482.52 (1024), 350.52/526.52 (768), 488.53/642.52 (390).
  **This was a 28px crop of the photograph itself and that was wrong.** At 28px
  a photograph has no subject, only noise, and noise beside a heading reads as a
  failed image load — the exact opposite of an affordance. Do not put the image
  back. The square, the leader and the word are the plate's own vocabulary, and
  type says "there is a plate here" where an unreadable thumbnail cannot.
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

**Persistent rAF is permitted in exactly three places — § 05's drifting field,
the global margin trace, and § 07's type bands.** All three are gated on viewport
intersection and on `document.hidden`, and all three are
fully cancelled on exit, on `document.hidden`, and under reduced motion. The
trace is on screen at essentially every scroll position, so its gate is instead
`document.hidden` plus a 400ms idle after scrolling stops, at which point the
loop cancels and the dashoffset is written once to its final value.

**Everywhere else: zero persistent rAF loops and zero pending timers once the
page settles.** The rule is absolute. Verify with a 5s Performance recording
after settle, and a second one with § 05 scrolled out of view.

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
magnetic buttons.

**Magnetism is confined to § 07**, where it applies to the section's text
elements as well as its links. Nowhere else on the site.

**Marquee is banned as decorative background.** § 07 connect's counter-scrolling
type bands are exempt: **they run a continuous autoplay loop.** This is a
deliberate exception to the marquee ban — the bands are set in outlined display
type as hairline drawing and carry real content. **No other autoplaying motion
exists on the site**, and nothing else may acquire it.

This reverses the exemption's earlier wording, which claimed the bands were
scroll-driven and never autoplaying and rested the whole exemption on that
distinction. They were, and then the decision changed. The exemption now rests
on what the bands *are* — content, drawn — not on what moves them.

**Cursor followers are banned** — an element lagging behind the pointer. The
custom pointer itself is exempt: it tracks with zero lag and *is* the pointer.
Only deliberate ink residue may lag.

**Glyph substitution is exempt from "drawn, not faded"** — but only as the
same-character roll described above, and only on the hero display type.

### Set pieces — max 6
The cap was 3, then 5. It is now **6**, and this is the roster — there is no
seventh without removing one of these first.

1. **Hero / loader** — the DC map draws itself on a paper field, then travels to
   its hero position as the page arrives. One continuous event; the loader *is*
   this set piece, not a fourth.
2. **Projects** — each card carries a small SVG figure generated in-browser from
   what the project actually did. Draws once on entry, then stops.
3. **Experience spine** — the segmented 6px bar, which is now a widening of the
   margin trace rather than its own line (see below).
4. **The margin trace** — one continuous 0.5px path down the left gutter of the
   whole page, advanced by scroll. § 6.
5. **The connect replay** — the visitor's own ink strokes, replayed into the
   final section. § 5 / § 06 connect.
6. **The connect type bands** — two full-bleed rows of outlined display type
   counter-scrolling against each other, driven by scroll position only.

The §05 field is deliberately NOT a set piece: it has no entrance, draws
nothing, and asserts nothing by arriving. It is a standing state, not an event,
which is why it does not count against the cap.

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

**One exception exists: the § 07 pizza rain easter egg** renders a hand-authored
SVG pizza slice at full colour. It is a deliberate joke, it is user-triggered
after its first run, and its colours are quarantined to that one element. No
other illustration or off-palette colour exists anywhere on the site.

It is **drawn, not an emoji** — an emoji renders as a different picture on every
platform and at the wrong weight beside this type, which is the whole reason
emoji are banned in the first place. The exception is for a drawing that happens
to be a joke, not for the joke.
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
  except the two sanctioned loops, § 05's field and the margin trace, each
  gated and fully cancelled as described in § 6 Scroll
- **THIS RULE IS CURRENTLY VIOLATED, and the violation predates the connect
  motion pass.** Measured at rest with § 05 and § 07 both off screen: **606 rAF
  callbacks in 5 seconds**, byte-identical before and after the magnet, the
  character reveal and the type bands were added — those three add subscribers
  to the shared loop and no loop of their own. The cause is structural: the
  shared scroll controller starts its loop on the first subscriber and stops
  only when the last one leaves, and `section-mark` registers **every** section
  permanently, so the loop is alive from mount to unload. The fix is to gate
  each section-mark subscription on viewport intersection the way § 05 and the
  bands already are; it was not done here because section-mark is shared by
  every section on the page and this pass was scoped to § 02 and § 07. Do not
  claim this budget line is met until that gate exists.
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