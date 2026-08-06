# jakepark.dev — project instructions

Personal portfolio for Jake Park. Sophomore at Georgetown, B.S. Computer Science +
A.B. Mathematics, class of 2029. Builds ML and data systems.

The art direction below is **locked**. It was designed deliberately. Do not
"improve" it, do not substitute fonts, do not add colors. If something in this
file seems to prevent a good solution, say so and ask — do not silently deviate.

**§ 9 (Decisions already made) is not optional reading.** Several ideas in it
look attractive from a cold start and have already been tried and rejected.
Re-proposing them wastes a session.

**The site is FIVE sections, and it was seven.** `01 hero · 02 work ·
03 experience · 04 background · 05 connect`. projects + skills merged into
§ 02 work; about + education merged into § 04 background; experience kept its
number. Anything in this file that still reads as though there are seven is a
bug in this file — say so and fix it. See § 5.

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
  **`app/fonts/og/*.ttf` are not an exception to this** — nothing serves them
  to a browser. Satori (the renderer behind `next/og`) reads sfnt only and has
  no variable-font support, so the OG card needs static TTF instances read with
  `fs.readFileSync` on the server. Built and subset by
  `scripts/generate-og-fonts.py`; script and output both committed, the same
  contract `scripts/generate-dc-paths.mjs` follows. Bricolage's fvar defaults
  are opsz 96 / **wght 800**, so skipping the instancing step does not fail
  loudly — it silently sets the name at 800.
- Deployed on Vercel

Do not add: Framer Motion, GSAP, three.js, a UI component library, a mapping
library, a text-splitting library, or any icon package. Ask first.

---

## 2. Palette — 4 colors + 1 softened ink + 1 single-use mark

```
paper    #F5F1E8   base surface
ink      #1A1815   primary type, strong hairlines
muted    #9B9382   decorative hairlines, frames, quiet rules
accent   #22384F   ink blue — section marks, link underlines, § 02 linkage
body     #2E2A24   softened ink for body copy (same hue, not a 5th color)
mark     #C8952E   warm ochre — the Georgetown star on the hero map, AND
                   § 02's active node ring + ticks. One node at a time.
```

**There is no ruling token and there must not be one.** `#C5CBD1` was admitted
here for a 32px lattice on § 02's ground, built, measured, and then struck along
with the lattice — see § 9. The ground it was for is struck too. The palette is
closed at the values above.

Legibility variants: `#6B6455` for any mono text a user must read (nav labels,
section markers, gutter annotations, captions, coursework). `#0A0908` for the
cursor dot and active nav label — the two darkest objects on the page.

Rules:
- Accent is **section marks, link underlines, and § 02's co-occurrence linkage
  hairlines** — nothing else. Still **~3% of any viewport** maximum. The linkage
  lines are 0.5px at 0.55 alpha and exist only while a node is active; they are
  a wiring diagram drawn on demand, never a standing web (§ 5 / §02). Reaching
  for accent a third time in one section means the composition is wrong, not
  that it needs more accent.
- `mark` #C8952E is the **filled Georgetown star** on the hero map — **and
  § 02's active node's ring stroke and tick marks.** Two uses, not three: the
  "ghost map on connect" this rule used to name as the star's bookend **does not
  exist and never did**. § 05 connect renders a label, an email, a blurb, the
  type bands and a footer, and no map. Do not write the bookend argument back in
  without building the ghost map first. Never more than one node at a time, and it
  reverts to muted on deselect. § 02's index has no chromatic event of its own
  otherwise, and one node at ~0.2% of the viewport reads as an instrument
  needle: the same semantic as the star, *this is the thing you are pointing
  at*. That is the whole of the widening. It does **not** become a
  general-purpose highlight colour, and nothing outside those three uses may
  take it.
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
  site responds to a system preference. **EXACTLY TWO GROUNDS EXIST. There is no
  third.**

```
paper   #F5F1E8   § 01 hero, § 02 work, § 04 background, § 05 connect
ink     #1A1815   § 03 experience ONLY — the inverted plate, paper type
```

**§ 02 had a third ground and it is struck.** `drafting` #EDEBE4 — a flat tonal
shift, one CSS declaration — was specified as carrying a blueprint ruling; the
ruling was built (a 32px #C5CBD1 lattice, heavier every fifth line, crisp at
every dpr) and then removed under § 9, because a friend's portfolio uses a ruled
paper ground and close imitation of another site's signature move has already
cost this project a full revert. **What was left read as a seam between two
paper sections rather than as a register**, so the tone went with the lattice.
The token, the `.has-drafting` rule and the class are all deleted.

Do not reintroduce a third ground, do not rebuild the lattice, and do not route
around either with a dot grid, graph paper, a blueprint tint or a faint
repeating anything. If § 02 ever reads unfinished, the answer is composition,
not a pattern. **§ 03 is the only section with a ground of its own and no other
may become one**; it is full-bleed horizontally, running edge to edge past every
other section's `section-pad` measure.
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
- Mono is for labels and metadata **with one sanctioned exception**: § 05's email
  monument sets Plex Mono at up to 58px. See § 5 / §05 — the address is data, and
  that is the point. Nothing else may borrow it.
- `text-wrap: pretty` on paragraphs, `text-wrap: balance` on headings.
- **There is no `h1` type token.** The table used to carry one at 64px/500 and
  nothing has ever rendered it: the page's single `<h1>` is the hero name, set
  in `display`. The token is deleted from `tailwind.config.ts` with the row.

---

## 4. Structure

- Hairlines **0.5px** everywhere except § 03, whose spine is **6px** (4px below
  900px) — a bar, not a hairline, and the one place a rule carries color.
  `vector-effect="non-scaling-stroke"` on all SVG strokes.
  Exception: the DC map's outer District boundary is **0.9px** so it dominates
  the 0.5px / 0.28-opacity neighborhood lines.
  **Second exception — the OG card only, and it is a waiver, not a new
  default.** `app/opengraph-image.tsx` draws the same map at 1.5px boundary /
  1px clusters. An OG card is re-encoded lossily by every platform that shows
  it and rendered ~260px wide in a timeline; a 0.5px ink line survives neither
  step — it grays out and then vanishes, leaving a card with an empty right
  half. It is the same drawing exposed for a lossy medium. Nothing that renders
  in a browser may take this number.
- `border-radius: 0` on everything, with exactly two exceptions: `.cursor-dot`
  uses `border-radius: 50%` because it is a literal circle, and § 02's field
  nodes are hairline `<circle>` elements — SVG geometry, not a rounded box. No
  other exceptions, and in particular no rounded rectangles anywhere.
- **No box-shadows anywhere.** Cards are defined by rules and space. Nothing on
  this site is enclosed by its own complete border.
- **There is no grain layer.** This file described one — SVG fractalNoise at
  `opacity: 0.05`, `mix-blend-mode: multiply`, one instance fixed to the page —
  as though it existed. It does not: `app/layout.tsx` says so in a comment, and
  nothing renders a noise texture anywhere. The description is struck. Adding
  grain is a new proposal and has to argue for itself.
- Nav gutter: ~180px reserved on the right of every section. Collapses to 0
  below 900px. The connect section overrides this and centers on the full
  viewport.
- Section markers are `02 / work` format. The `§` symbol was removed.
- `::selection` is accent #22384F at 0.18 alpha with color #0A0908. The browser
  default blue must never appear.

---

## 5. Sections

**There are FIVE sections. There were seven.** projects + skills merged into
§ 02 work; about + education merged into § 04 background. Experience kept its
number, which is why the ink ground and the cursor/ink-trail inversion keyed to
`#experience` did not move.

| § | section | ground | status |
|---|---|---|---|
| 01 | hero (no number shown — it's the cover) | paper | done |
| 02 | work — project rows, then the tool index | paper | done |
| 03 | experience | ink | done — the inverted plate, entries arrive on scroll |
| 04 | background — three stations, the schools, interests | paper | done |
| 05 | connect | paper | done |

Ground sequence, top to bottom: **paper → paper → ink → paper → paper.**
§ 03 is the only section that is not paper.

**The numbers are DERIVED from `CONTENT_SECTIONS` in `app/lib/sections.ts` and
are written down nowhere else.** The page maps over that array and so does the
nav, so a reorder is one edit. Never hardcode a section number.

**The four anchors the site used to publish are remapped, silently.**
`#projects` and `#skills` → `#work`; `#about` and `#education` → `#background`,
via `LEGACY_ANCHORS` in `sections.ts`, applied by Nav on mount and on
`hashchange`. `history.replaceState`, never assignment — a remap that pushed a
history entry would send the back button to the same dead hash. The scroll is
instant, not smoothed: a deep link is a request to already be there, and that is
what the browser would have done natively for a hash that still resolved.

Because two former sections map onto each of § 02 and § 04, a bare number is no
longer specific enough inside them. Say **§ 02's project rows** or **§ 02's
index**. § 04 no longer needs the distinction: its about copy is deleted and
what is left is three stations.

§ 02's project rows are content-complete. Jake specified each row's links
verbatim and **no repo URLs were among them** — every row carries exactly one
link, `live ↗` on 01 and 02 and `poster (pdf) ↗` on 03. The earlier note asking
for GitHub URLs is withdrawn: their absence is now the specified state, not a
gap. Row 03 has no repo and no deployment and is **not** to be padded with a
disabled link — that asymmetry is honest, and it now applies to all three rows
equally.

**§ 02's index is the quality bar.** Match its level of composition everywhere.

### §03 experience — the arrival
Each of the five entries animates in as it is scrolled to: translateX 28
→ 0 with opacity 0 → 1 over 620ms on `reveal`, staggered 60ms across tile → org
(the date stamp rides with it) → role title → description.

**It REPLAYS, every time the entry comes into view, arriving from above or from
below with the same gesture — never the enter reversed.** This reverses the
original once-only rule, deliberately and at Jake's request: the arrival now
reads as how § 03 draws itself rather than as something that happened once at
first sight. Do not restore the once-only behaviour.

- **The play edge is 0.25 and the RESET EDGE IS 0 — the entry must leave
  completely.** Both thresholds are given to the observer, since it reports
  crossings of the thresholds it was handed and nothing else. Re-arming at 0.25
  instead would reset an entry still a quarter on screen, so a slow scroll
  parked at the boundary would blink it. A `playing` flag makes the play edge
  idempotent; only a full exit clears it.
- **At most one live timeline per entry.** A replay reverts the previous one
  first, so an entry crossed fast in both directions can never have two
  timelines writing to the same four elements. On land the timeline reverts and
  `[data-landed]` goes on; on full exit the attribute comes off and the armed
  CSS takes the entry back to opacity 0.

- **Five independent triggers, never one section-level stagger.** A visitor
  landing mid-section would otherwise watch entries animate that they had
  already scrolled past. Measured: arriving at the top of § 03 animates 01–03
  while 04 and 05 sit untouched below the fold.
- **The hidden start state is applied by `[data-motion="armed"]`**, set by the
  client in a layout effect. Entries are hidden ONLY when something is
  guaranteed to reveal them — with no JS, failed JS, or reduced motion the
  section renders exactly as it always did. Never make the hidden state the CSS
  default.
- The old **instant-land** branch for a reload below § 03 is gone with the
  once-only rule. It existed because an entry scrolled past could otherwise
  strand at opacity 0 forever; now anything off screen is simply armed, and
  arrives whenever it is next scrolled to. Nothing can strand.
- **The spine is not part of this.** It does not animate at all — see below.
  Nothing in the arrival touches `[data-role]`.

**The spine, on its own terms.** A 6px bar (4px below 900px) running the full
height of the entry list, segmented one segment per employer, each segment
carrying that role's colour from the § 2 role palette. It is the one place on
the site a rule carries colour and the one rule that is not a hairline.

It is **static**. Each segment is a `<span data-role>` that is a grid item in
the same grid row as its entry, so a segment's height *is* its entry's height —
matched by construction, with no measurement, no scroll subscription and no
draw. The 40px between entries is padding INSIDE each row rather than a row gap,
because a gap would show as a break and the spine must be continuous.

This previously read "its segments belong to the margin trace and keep their own
scroll-driven draw." There is no margin trace and there is no draw; the sentence
described a built thing in terms of an unbuilt one, which is exactly how the rAF
fiction survived four rounds of review. If the spine should animate, that is a
new proposal to argue for, not a behaviour to restore.

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

### §05 connect — pizza rain
70 hand-drawn slices fall across the viewport when the visitor reaches the bottom
of the page, once per session, then the layer unmounts. A button appears
afterwards to replay it. It is a joke and it is meant to read as one.

- **One supplied illustration, `public/pizza.png`, never an emoji.** An emoji is
  a different picture on every platform and sits at the wrong weight beside this
  type — which is the reason emoji are banned at all. The exception in § 8 is for
  one illustration that happens to be a joke, not for the joke. All 70 slices
  reference the same file, so the browser decodes it once.
- One rAF for all 70, writing transform and opacity and reading nothing,
  cancelled when the last slice lands. Portalled to `<body>` so no transformed
  ancestor can break `position: fixed` — the same rule the ink canvas follows —
  at z-index 400: above every section, below the cursor's 9999.
- **There is no replay cooldown and there must not be one.** The button is
  spam-clickable and **clicks ACCUMULATE**: every click adds a WAVE of 70 that
  falls alongside whatever is already in the air, each on its own clock, so
  clicking fast buries the screen. That is the joke — a wave that replaced the
  one before it would mean the screen never fills however hard it is clicked.
  Each wave is dropped the frame its own last slice lands; when the last one
  goes the layer unmounts and the rAF cancels.
  - Still **one rAF for every wave**, walking the waves and writing transform
    and opacity, reading nothing. A wave's start is taken on its FIRST FRAME,
    not at click time — the click has to clear a React commit before its spans
    exist, and dating it from the click skips that much of its fall.
  - Concurrent waves are capped at **12** (840 slices), and the cap is not a
    cooldown: every click is honoured and the OLDEST wave retires to make room,
    being the one already nearest the bottom of the screen. Measured with all
    840 in the air: 8.3ms median / 9.0 worst unthrottled, 16.7 / 25.5 under 6x
    CPU throttle, no frame over 32ms.
  - **The button appears with the first wave, not after it.** Gating it on the
    burst ending made the first 3.7s un-spammable, which is exactly the window
    in which someone wants to click again.

  This reverses an earlier
  4s lockout, which was itself the subject of a debugging pass (its reference
  started at 0 against a `performance.now()` that is ms since page load, so it
  swallowed every trigger in the first four seconds — exactly when a visitor
  deep-linked to the bottom would hit it). The lockout and that whole hazard are
  gone. The reduced-motion scatter is still **serialised** — it holds still on
  timers, so a second run would stack timers against one layer — but it is not
  rate-limited either.
- The trigger wears the site's own affordance vocabulary — hollow square, gap,
  mono label — **because** what it does is off-theme. The joke is better for
  being announced in the same voice as everything else. It is 7px; § 04's photo
  reference is 12px, so they match in treatment, not in size.
- Reduced motion never rains: the button is present from load and scatters ~20
  slices statically for 1.2s. The joke survives, the motion does not.

### §05 connect — the character reveal
Each character of a paragraph carries its own threshold along that paragraph's
progress through the viewport, so reading the page is what inks it in. **§ 05's
blurb is the only consumer left**: § 04's four paragraphs were deleted with the
prose, and `RevealText` is kept for the blurb alone. Nowhere else — never a
heading, a mono label, or the hero blurb.

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
  client-only value during render is the § 02 hydration trap.

### §02 work — the ground it no longer has
**§ 02 IS PAPER.** It carried a third ground — `drafting` #EDEBE4, a flat tonal
shift, `.has-drafting` in globals.css, one declaration — and that ground is
deleted along with its token and its class. The tone existed to carry a 32px
#C5CBD1 lattice; the lattice was built, measured (crisp at dpr 1/1.5/2/3, stable
across sub-pixel scroll, zero long tasks) and then removed under § 9, because a
friend's portfolio uses a ruled paper ground. What was left was a bare tonal
step between two paper sections, which read as a seam rather than as a register,
so it went too. The component, the pattern, the wipe, the `ruling` token, the
`drafting` token and the scratch route that existed to judge it are all gone.

Do not rebuild the lattice, do not give § 02 a ground again, and do not route
around either with a dot grid, graph paper, a blueprint tint or a faint
repeating anything. If § 02 ever reads unfinished, the answer is composition,
not a pattern.

**One thing learned there is worth keeping, and it generalises: an
IntersectionObserver cannot watch the element it clips.** `clip-path` is part of
what the observer measures, so an armed element — clipped to zero height —
reports `intersectionRatio: 0, isIntersecting: false` at every scroll position
forever, and the arming suppresses the callback that would undo it. Measured:
rect top 164px in a 900px viewport, 1232px tall, ratio 0.000, permanently
invisible. **Any clip-path reveal on this site must observe an unclipped
ancestor, never itself.**

### §02 work — the project rows
The upper half of § 02, above the index, and **the recruiter must reach a named,
linked, shipped project within one scroll of the hero** — which is why the rows
come first and the index goes underneath them. Never lead this section with
seventeen circles.

A register that hides nothing, **vertically composed**. The site's one axis
break lives in the index below, not here; a register that alternated or stepped
would make two rule-breaks in one section, and two read as a tic. A column
header that appears once (never repeats, never sticks),
then one project per 0.5px-ruled row on a 12-column grid: NO. / PROJECT / STACK
/ YEAR. **All three rows are fully open at all times.**

**The accordion is gone and it is not coming back.** The click-to-toggle, the
one-open-at-a-time logic, the 0fr→1fr gap, the vertical marker that drew down
the gap's height, the `aria-expanded` wiring and the keyboard toggles were all
deleted. A three-item register that hides two thirds of itself behind an
interaction was costing more than it bought: the section is short enough to read
whole, and an expand affordance on a page with this much drawn motion read as
the one piece of generic UI on it. The header line and the hairlines stay — it
still reads as an index, it just no longer conceals anything.

**The generated figures are gone with it** — the convergence plot, the arc
diagram and the thermal trail network, their seeded mulberry32 helpers, the
draw-on-entry motion, the captions and the scale bar. They were set piece 2 and
the roster is now five (§ 7). They were replaced by real screenshots because a
generated figure asserts what the work *looked like* in the abstract while a
screenshot shows it; the figures were the right answer while the projects had
nothing to show, and the wrong one once they did. **Do not regenerate them and
do not add a synthetic figure to a project that lacks a thumbnail.**

- All content lives in one typed array, `app/lib/projects.ts`. **Adding a
  project is one entry and no layout work.** `thumb` is optional; an entry
  without one spans its text across cols 2–10.
- **The thumbnail is always on the right and there is no alternation.** A
  register alternates nothing — the eye must be able to run down one column of
  claims and one column of images. Do not "vary" it.
- Native colors, no filter of any kind, no crop, and **no uniform aspect ratio
  across the three**. Two are 3024×1718 UI captures and one is a 1914×1434
  poster; forcing them to one ratio means cropping, and cropping a poster to a
  register's convenience destroys the only thing it is showing. Row heights
  differ and that is correct.
- **The registration corners are what make a full-color rectangle belong to the
  page.** 0.5px ink, 14px arms, 8px outside the image's corners, never touching
  it and never closing into a rectangle — the same vocabulary as § 04's
  education plates and its Kyoto portrait. They are the section's only hover
  gesture: they translate
  5px further out along their diagonals. **The image itself never moves, scales,
  lifts, tints, or gains an overlay** — that is hover-lift and § 8 bans it.
- Row 03's poster is dense and illegible at thumbnail scale. **That is accepted
  and expected**: it reads as "a research poster," its caption says so, and
  clicking opens the full PDF. Never crop it, never zoom into one figure of it,
  never add a magnifier.
- The thumbnail is a link **and the text link below it stays**. The image link
  is a convenience carrying an `aria-label`; the text link is the affordance a
  screen reader and a keyboard get. Neither replaces the other.
- Row 03 has no live deployment and no repo. **Do not pad it, do not add a
  disabled link, and do not invent a GitHub URL** — that asymmetry is honest.

**The type scale is deliberately wide here, and it is the only place on the
site that is.** Project titles are the recruiter's target, so they go to 38px
at ≥1024px (from 24px — a 1.58× step; 1.6× was asked for and taken to a whole
pixel, because a fractional display size shivers against its own mask). Below
1024px they are unchanged: the register is already tight there and a 38px title
wraps. **The mono metadata drops one step in the same pass** — stack 12→11px,
index and year 11→10px. Widening the title alone would raise the whole row's
weight; stepping the metadata down is what makes the change read as CONTRAST
rather than as inflation. The column header does not follow the title up: it
labels the column, it is not an instance of it.

**A caption identifies the artifact and carries no numbers.** CapitolCast's used
to read `16,213 bills · 0.48 PR-AUC · 15× baseline`; the caption became
`capitolcast · bill advancement forecast` and stays that way. My 5's and Bike
Heat's were already correct.

**THE METRIC ROW IS GONE.** A `<dl>` of 30px mono values over 11px `muted`
labels sat between the claim and the stack, carrying My 5's `43×` and
CapitolCast's four figures. The component, the CSS, the `ProjectMetric` type and
the `metrics` field on every project are deleted — not hidden, not commented
out. A row is now: header line, claim, full stack, links, thumbnail.

- **The numbers went back where they came from.** `43×` is the index's evidence
  line for `aws`, which always had it and keeps it. `5.8m` is inside
  CapitolCast's claim. **`16,213 bills`, `0.48 PR-AUC` and `15× baseline` are
  now nowhere on the site except inside the screenshot** — the caption gave
  them up when the metric row took them, and the metric row then went. That is
  the accepted state, not an oversight: the caption is not to take them back.
- Deleting it also removed the **only place on the site `muted` carried type**.
  The exemption is withdrawn with the element — § 2 and § 11 apply to § 02 with
  no exception now.
- Still **banned**: animated counters, count-up on scroll, percentage bars, any
  self-rated figure. And any figure that does not already exist in the repo.

**Stack tokens.** Each entry in the FULL stack below the claim is a real
`<button>` carrying `data-tool="<node-id>"`, styled to be indistinguishable from
the text it replaced — no chrome, no box, no background. Entries the index does
not carry render as plain text; a node is never invented for a tool. The
mapping lives in `TOOL_FOR_STACK` in `app/lib/projects.ts` and **a module-scope
check throws if any stack string is missing from it**, because a missing key
would render an inert token that looks interactive.
- **The header line's stack stays inert.** It is a truncating one-liner and an
  affordance that clips is not an affordance.

**The three thumbnails — measured, and one is a finding.** Edge contrast of each
image against the paper it sits on:

| row | image | on paper |
|---|---|---|
| 01 | my5, dark UI | 16.64:1 |
| 02 | capitolcast, dark UI | 16.64:1 |
| 03 | bike-heat, light poster | **1.12:1** |

Row 03's own outer margin is near-white and does not read as an edge against the
ground. That is accepted and predates everything: it measured 1.12:1 on paper
before § 02 briefly had a ground of its own, 1.06:1 on that ground, and 1.12:1
again now.

What defines that rectangle is **the four registration corners** — ink at
~14.9:1, the single strongest mark anywhere near the image — plus the caption
directly beneath it. That is the same vocabulary § 04's plates and § 02's
portrait use, and it is what the vocabulary is *for*: making a full-colour
rectangle belong to a drawn page without drawing a box around it.

**Do not add a border, a hairline frame, a keyline, an inset shadow or a tint to
row 03.** Nothing on this site is enclosed by its own complete border (§ 4), and
a frame on one of three thumbnails would break the register's only consistent
treatment to solve a 0.06 contrast difference.

### §05 connect — the composition
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
- There is exactly **one** space either side of each bracket group and it looks
  like two, because Plex Mono is monospaced and each space is a full 0.6em
  advance — 25px at 42px type. `word-spacing: -0.22em` on the annotation span
  pulls those two spaces back. It must stay on the span: the address's own
  letterfit has to remain monospaced to read as data, which is the whole point
  of setting it in the data face.
- **This is the one place mono is used at display scale** (§ 3's table assigns it
  to labels and metadata). It is deliberate: the address is data, and setting the
  page's largest type in the data face is the joke of the section landing
  straight.
- **The email's size is the smaller of the specified size and what fits.**
  `clamp(22px, 3.1vw, 42px)` is a viewport measure and § 05's content box is not
  the viewport — below 1280px it also gives up 180px to the nav gutter. At the
  earlier `clamp(28px, 4.2vw, 58px)` the 1200 case asked for 50.4px, which laid
  the address out at 967px inside an 876px column; `nowrap` does not wrap that,
  it pushes a horizontal scrollbar onto the document. So the ceiling is still
  `min(clamp(...), 5.1cqi)`: 32 characters at 0.6em advance less
  0.01em tracking is 18.88em, so it fits at container/18.88 (5.30cqi), taken with
  a 4% margin. Where the spec fits it wins unchanged.
- **§ 05 centres on the full viewport, so above 1280px nothing reserves the nav
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

Magnetism is confined to § 05's **centre block — the email and its label, and
nothing else on the page.** Each has its own independent field, and **strength
is set by weight** — the heavier type moves less, so the block reads as having
mass rather than as uniformly springy:

| element | divisor | field |
|---|---|---|
| the email — the monument | 6 | 200px |
| `LET'S CONNECT` | 4 | 140px |

Position only: no scale, no colour, no rotation. Pointer-fine only, never under
reduced motion, and § 05 only.

- **The footer is entirely excluded, and the social links were removed from it.**
  They carried divisor 5 / 150px and no longer do. The footer is the page's last
  row and it is structure, not composition: the rule, the coordinates and the
  middots all hold still, and links drifting out of a line everything else keeps
  read as loose rather than as alive. Do not put it back.
- **The blurb is deliberately excluded** too, along with the bands. The blurb
  carries the character reveal, and two systems writing to one element fight.

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
motion. One rAF drives both, gated on § 05's intersection and on
`document.hidden`.

- **Full bleed by cancelling the section's own padding**, never the usual
  `left: 50%; width: 100vw; margin-left: -50vw`. That idiom assumes the parent
  is centred in the viewport and § 05's is not — it carries the 180px nav gutter
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

### §02 work — the index, a drifting field
The lower half of § 02, beneath the project rows and a full-width hairline,
labelled `— INDEX · 17 TOOLS · 4 DOMAINS`. It is an index of the tools the rows
above were built with, which is why it sits under them and reads as apparatus
rather than as a headline.

**The label's counts are READ FROM THE DATA** (`TOOLS.length`,
`CLUSTERS.length`), never written down. That is the only reason it is allowed to
carry numbers at all: the standfirst deleted from this section (§ 9) hardcoded
"three systems · seventeen tools" and would have lied the moment anything was
added. A derived count cannot.

**MOVED, NOT REBUILT.** Node positions, sizes, the drift algorithm, the physics,
the four-quadrant arrangement, the readout rail, the evidence lines and the
whole linkage / gold / keyboard pass are exactly as they were. It has been
rebuilt three times and this was not a fourth.

**The one structural change: the addressed node is not the index's own state.**
It lives in § 02, because a project row's stack token can address a node too,
and two entry points writing to two copies of "which node is active" is how
they drift apart. `SkillsIndex` renders the selection and reports intent; it
does not own the answer. `activeRef` — the loop's per-frame window onto that
value — is still written on every render and read on every frame, unchanged.

### §02 work — the bidirectional wiring
One shared active-tool state, two entry points, and **neither has its own
styling path**. A stack token and a dial write the same value, so the gold ring,
the field dimming, the linkage draw and the readout are the rules that already
existed.

- **Direction A — stack token → index node.** Hover or focus on a project's
  stack token addresses that tool's node exactly as hovering the dial does;
  click pins it. Focus, not only hover: the tokens are in the tab order and a
  keyboard must reach the same state. `pointerType === "mouse"` gates the hover
  half, so a touch cannot strand it.
- **Direction B — index node → project rows.** Rows carrying that tool take a
  0.5px accent bracket in the left margin, drawn over 320ms `draw`; rows that do
  not go to **opacity 0.45** over 260ms `micro`; and the matching token in every
  row that has it takes the standard accent underline. Full revert on deselect.
- **The bracket is a fixed 14px-arm, 48px-spine registration mark, not a
  full-height rule.** Real crop marks stay the same size whatever the sheet
  does — the same rule § 04's plate follows. It sits at `left: -20px`, in the
  margin outside the content box, which clears the 24px section padding at 390
  with room to spare so it can never widen the document. **Below 900px it does
  not draw at all**: a bracket hanging into a 24px margin reads as a stray mark.
  The dimming still applies there, because that is the half carrying the
  information.
- `pathLength="1"` normalised dash, and **both dash attributes come off on
  `animationend`** along with the animation.
- **Gold stays on exactly one node and never touches a project row.** Accent
  carries the row marking. No fifth colour — the row separation is opacity.
- **No new rAF.** Every rule here is a CSS transition or a keyframe on an
  attribute React sets; the field's existing loop is untouched. The inventory
  is still the three in § 6.
- Reduced motion: the bracket appears at full extent with no draw and the rows
  dim with no transition. **Dimming and the colour changes still apply** —
  they are state, not motion, and removing them would remove information.

**This is where the site's one axis break lives.** The rows above are a
register; the field is the one non-linear composition on the page. That the two
now share a section makes the break internal to § 02 rather than a relationship
between two sections — it is the same single break, not a new one, and § 02 does
not get a second.

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

**Selection exposes the wiring, and that is what the section is for.** Seventeen
tools that shipped real work together were being drawn as seventeen strangers:
the field was technically alive and visually inert, and the only event on
selection was a text swap in the left rail. The fix was never colour — it was
that the field had no structure to reveal. Four things now happen at once, and
they are additive: **nothing about node positions, sizes, drift speed, the drift
algorithm or the four-quadrant layout changed, and none of it may.**

- **Co-occurrence linkage.** Each tool carries `contexts: string[]` in
  `app/lib/skills.ts` — `my5`, `capitolcast`, `transit`, `coursework` — derived
  from its own evidence line and from § 02's stacks, never invented. Two nodes
  are linked iff they share one. On select, a 0.5px accent hairline at 0.55
  alpha runs between the addressed node and every node it shipped with, drawn
  in 420ms `draw`, staggered 40ms **nearest-first by euclidean distance**.
  A module-scope check throws if any tool has an empty array: an orphan would
  fail silently, as a section that just looks emptier on one selection.
  - **Links exist ONLY while a node is active.** A permanent web between 17
    nodes is noise, and the claim the section makes is that the structure is
    there to be *revealed*.
  - **`pathLength="1"` is load-bearing.** The nodes drift, so a line's real
    length changes every frame and a dasharray computed from its initial length
    breaks the moment it grows. Normalised, the fraction stays correct.
  - **Both dash attributes come off on `animationend`**, and the animation is
    killed with them. This omission has caused three separate visible
    regressions on this site.
  - **Endpoints are written inside the EXISTING drift loop**, in the same pass
    that writes node transforms, rounded to integers, with an early return when
    nothing is active. A fourth rAF is a hard fail (§ 6, § 12). Measured max
    fan-out is **13** (python), not the 6 that was assumed — still far too few
    to need a cap, and a cap or culling must not be added.
  - **A LINE RUNS BETWEEN TWO DIALS, NEVER INTO THEM.** Both endpoints are
    pushed out along the centre-to-centre unit vector by that node's own outer
    radius plus a **3px gap**, so neither circle is entered at either end.
    Drawn from the centres — which is how it was first built — thirteen lines
    converged into one knot of overlapping strokes behind the active node's own
    label.
  - **The outer radius is ring + longest tick, times that node's current depth
    scale.** Derived in `app/lib/skills-geometry.ts` from `r + TICK_REACH`,
    never hardcoded: radii vary by tier, the ticks sit OUTSIDE the ring, and an
    endpoint landing between ring and tick reads as a line that failed to
    reach. The scale is taken per frame because the rendered ring is scaled by
    the depth cycle and the SVG the lines live in is not — the node pass has
    just computed it, so the linkage pass reads it rather than recomputing it.
    No second geometry pass.
  - **A pair closer than the ink it carries draws NOTHING** — if the two
    offsets would cross there is no correct short line, and drawing one gives a
    stroke pointing backwards through both nodes. It is hidden, not unmounted:
    drift can separate the pair later and the loop only writes to elements that
    exist.
  - **THIS BRANCH FIRES, and it is supposed to.** Rings are explicitly meant to
    cross (see the relaxation notes below — only labels are kept apart), and two
    dials whose ink overlaps have no space between them for a line to occupy.
    Measured across all 17 selections, 20 sampled frames each: **111 of 1920
    link-frames hidden at 1440 (5.8%) and 64 of 1920 at 1920 (3.3%)**,
    concentrated in the pairs whose rings actually cross — xgboost↔python,
    fastapi↔pytorch, typescript↔aws, fastapi↔next.js, c++↔java,
    docker↔postgresql. They come back the moment the pair drifts apart. **Zero
    backwards lines at either width.**
  - **The direction check happens AFTER the rounding.** A pair barely clear of
    the offsets leaves a sub-pixel segment, and rounding four coordinates
    independently can invert it: measured, fastapi→next.js at 1440 drew
    backwards on 13 sampled frames when the guard tested the raw distance
    alone.
  - Measured endpoint clearance on every drawn line: **minimum 2.17px at 1920
    and 2.32px at 1440** outside the node's rendered outer ink, against the 3px
    asked for — the shortfall is the integer rounding, and no endpoint at any
    width on any frame landed inside a ring or a tick.
  - The same offsets are applied in the React render, which is the frame the
    **reduced-motion** path shows permanently — using the resting depth scale
    at t = 0. Computing them only in the loop would leave that path drawing
    centre-to-centre forever.
  - **A node's composed home is NOT where it is drawn.** `baseRef` holds the
    home the seed relaxation solved for; `nodeStyle` then translates the node
    by `drift(s, 0)`, and `createBodies` starts every body at home + that same
    offset. The render path has to add it too (`REST_DELTA` in
    `skills-geometry.ts`). It did not, and under reduced motion — where nothing
    ever corrects it — an endpoint landed a measured **18.2px inside a ring**.
    Centre-to-centre lines hid this: the error was under the dial. Anything
    that positions against a node at rest has to add the t = 0 drift offset.
- **The field dims, in OPACITY only.** Active 1.0, linked 0.62, unlinked 0.24,
  260ms `micro`, uniform 1.0 on deselect. This is the largest visual change the
  section has and it costs nothing chromatically. Never introduce a lighter grey
  to do it — dimming is opacity against paper.
- **The active node takes `mark` #C8952E** on its ring and its ticks, with the
  label to ink. Exactly one node at a time, enforced in state; it reverts to
  #1A1815, the circle's own presentation-attribute value. Its tick group rotates
  **12deg** over 520ms — an instrument reading, not a spin. The ticks live in
  their own `<g>`, a **child** of the element the drift loop writes transform to,
  so the two can never collide; that separation is structural and must stay.
- **The readout takes a fourth line** — `appears in —` and the contexts' display
  labels, with `my 5` and `capitolcast` linking to their § 02 rows (which is why
  `.proj-row` carries `id="project-NN"`). The transit API and coursework are not
  links: there is nothing on the page to land on. Lines wipe in at 380ms
  `reveal` staggered 50ms and leave on 180ms of opacity with no wipe — a
  reversed wipe would read as the pen un-drawing, which this vocabulary does not
  have. The card is held through the exit by a `shown`/`active` split, the same
  pattern § 04's plate uses. **The block reserves 220px**, measured by focusing
  all 17 at 1920/1440/1360: the tallest is python's at 216px, the only node with
  three contexts.
- **Interaction.** Hover selects and a **click PINS** — the selection survives
  the pointer leaving, which is what makes the readout's links reachable;
  clicking the pinned node or anywhere off a node unpins. Hover is gated on
  `pointerType === "mouse"`, because a touch fires `pointerenter` and never the
  matching leave, which is exactly how a hover state gets stuck on a phone.
  Every node is a real `<button>` with an accessible name; **arrow keys move
  focus by ANGLE-WEIGHTED distance** (candidates more than ~70° off-axis are not
  candidates), Enter/Space pins, Escape clears and returns focus to the field.
  Focus draws **four accent registration corners**, the § 02 / § 04 motif — the
  browser default is suppressed only because a round outline on a dial read as a
  second ring.
- **Reduced motion:** links appear at dashoffset 0 with no draw and no stagger,
  no tick rotation, no readout wipe. Dimming and every colour change still
  apply — those are state, not motion. **The field measurement must still run
  under reduced motion**: skipping it left every line drawn from 0,0 to 0,0, the
  wiring silently missing for exactly the people the path serves.

### §04 background — the route
**THREE stations, and the whole section is the shortest thing it can be while
still saying what it says.** about + education, merged and then stripped: all
four narrative paragraphs, the four coordinate pairs and the fourth station
("what for") are deleted, along with the sentence that named each place.

```
01  seoul, south korea       2007—2014
02  alexandria, virginia     TJHSST     + coursework
03  washington, d.c.         Georgetown + coursework

    interests                seven, one middot-separated line   + the Kyoto portrait
```

**NOTHING REPLACED THE PROSE.** There is no standfirst, no transitional line and
no caption standing in for a deleted sentence, and none may be added. A station
says where and when; the school says what; the coursework says how much. If the
section reads thin, that is the brief.

- **2007—2014 is supplied data**, given with the strip instruction. It is
  station 01's only content. **No attendance years exist for TJHSST or
  Georgetown and none may be invented** — the two school stations carry no
  dates at all, and `class of 2029` on Georgetown's degree line is the only
  year anywhere in the section besides Seoul's.
- **The coordinates are gone from § 04 entirely**, and with them the one
  exemption that let `#9B9382` carry type. § 05 connect's footer coordinates are
  a different element and are unaffected. **The date range does NOT inherit the
  exemption**: it is station 01's only content, so it is copy rather than
  annotation and takes `#6B6455`. Only the two-digit index is still muted, and
  it is an ordinal on a plate, not a line to read.
- **The character reveal no longer runs here.** § 04 had four
  `RevealText` paragraphs; with the prose deleted there is nothing to ink in, so
  the usage is removed. **The component stays** — § 05 connect's blurb is still
  a consumer, and that is now the only one on the page.

**The spine, and whether it still earns its place.** § 03's is a 6px *bar*
assembled from one colour-carrying segment per employer, so the rule itself is
the data; § 04's is a single unsegmented 0.5px hairline that carries nothing,
marked by a 12px ink tick at each stop — a route with stops, not a stack of
blocks. **With the prose gone it is doing MORE work, not less:** the tick
sequence and the two-digit indices are now the only thing saying these three
places happened in an order, where four paragraphs used to say it in words.
- It is **one absolutely-positioned element on `.bg-route`**, stretched top to
  bottom. Not per-station segments: a segment per station is exactly § 03's
  construction, and it would also break at the `.bg-plates` wrapper.
- Ticks are **static ink, 12px, centred on the spine by the route's own
  `--spine-indent`**, so a tick never has to know where the spine is in page
  coordinates. Nothing on a station opens any more, so there is no tick gesture
  and no station hover state at all.
- The spine stops above `interests`. That is not a station.

**The station's tracks.** `40 · 64 · 20 · 620 · 32 · 1fr`, inside a box inset
16px by the spine.
- **40px** is the index rail — the tick's own column, and what puts the place
  label and the crest below it on one left edge.
- **64px** is the crest box (see below).
- **620px** for the name column is unchanged and still measured: TJHSST's name
  only stays on two lines above ~601px.
- At 1440 that leaves the coursework **295.2px** (1087.2 − 16 − 776), which is
  what sizes the plate.
- The header line — index, place, and the date range where there is one — is a
  flex row spanning every track, with the date pushed to the content edge by
  `margin-left: auto`. It is **not** a grid cell: a track of its own would have
  to be kept in agreement with the coursework's, and at 1440 the two would
  disagree. It **wraps** below 640px, where index + place + date measure 393px
  in a 326px box; nowrap put the date 10px outside the document.
- The place name takes the **mono-label step (13px / 500 / 0.24em)** rather than
  the micro one the index and the date keep. It is the station's title now that
  the prose is gone, and at 11px it read as a third piece of metadata.

**The crest sits in the left rail, top-aligned to the institution name's CAP
BAND** — not to its line box, which the font's own ascent makes ~6px looser at
40px/500. The offset is half the leading ((44 − 40) / 2 = 2px) plus the gap
between the ascender and the cap (5.6px at 40px), so 7.6px taken to 8. Measured
delta between the crest's top and the computed cap top: **−0.6px at every width
≥640.** At the 34px base step the same derivation gives 6px.

**The two crests are sized individually and must never be normalised to one
height.** They are opposite kinds of mark: Georgetown's G is a solid navy glyph,
TJHSST's is a fine-line seal. Measured at an identical 200px set height the G
carries 2.7× the contrast-weighted ink (19,339 units at 0.578 density against
7,190 at 0.180), so at equal height the seal reads as the smaller of the two.
TJHSST is therefore set **1.20×** Georgetown. In the 64px rail that is
**Georgetown 44px / TJHSST 53px** at ≥640 and **34 / 41** below. Size by
perceived weight, never by bounding box; the BOX is shared and the marks are
sized inside it.

Neither crest sits in a tile. On a paper section a paper tile is invisible by
definition, so the correct result is no visible box at all — the marks sit
directly on the ground, at native brand colors, with no filter, tint, or
desaturation. `georgetown.svg` originally carried a second, slightly larger copy
of the G filled #c6bcb6 behind the navy one: an offset keyline for placement on
photographs, which on paper was the only thing reading as an edge. It is
removed. `tjhsst.svg` is already transparent — its white is interior artwork,
not a ground.

**THE COURSEWORK IS ALWAYS VISIBLE.** It used to be clipped shut and uncovered
by a 420ms wipe on hover or `:focus-within`, which is why the station was a
focus stop, why the plate had a stage that suppressed it, and why the plate had
a hover breakpoint at all. With the prose deleted the right of each station is
empty and the list simply lives there. Deleted with the interaction: the
clip-path and its transition, the `html.edu-staged` / `html.edu-rearming`
suppression, the `edu-body` recede band, the station's `tabIndex` /
`role="group"` / `aria-labelledby`, and the reduced-motion override each of
those needed. **Do not give it back a reveal.**

Coursework column: two-column grid, column-first flow, one course per cell, no
separators of any kind. Items must never wrap; reduce mono size at a breakpoint
rather than allowing a wrap or truncating. The list is **capped at 452px**
(2 × 210 + the 32px gap) and pushed right: uncapped it fills the whole track —
756px at 1920 — and the two right-aligned columns end up 230px apart, which
reads as two lists rather than one.

**Coursework lists are right-aligned to the section content edge at ≥900px** —
inherited from the station's own last track rather than from an invented inset.
Measured, longest item's right edge equals the content edge exactly at 1920 /
1600 / 1440 / 1360 / 1024 / 900 / 768 / 390, and station 01's date range lands
on the same edge. The **ragged LEFT edge is intentional**: Georgetown has 6
courses and TJHSST 10, and left-aligning both made the shorter list read as an
orphaned block floating mid-row with dead space to its right. Below 900px they
revert to left-aligned, full width, beneath the entry.

**The Kyoto portrait closes the section, off the route**, in the interests row's
aside — the same track the coursework runs in, so the right side of § 04 reads
as one column top to bottom: coursework, coursework, portrait. It is 100% of its
track capped at 400px (480 at ≥1600), right-anchored, and it is **not a
trigger** — no hover response, because a plate that opens is a different object
and the portrait must not suggest it is one.

- **`portrait.jpg` is 4284×5712, NOT the 5712×4284 its raw pixel matrix
  reports.** The file carries an EXIF rotation, so `sips` and the declaration
  inherited from `about.tsx` both had it landscape while every browser and
  next/image's own pipeline render it portrait. Measured: the box reserved
  480×360 and the image arrived 480×640 — a 280px shift under the caption every
  time it loaded in view. Declare the DISPLAYED size.
- **It is also what stops § 04 getting shorter.** At 1920 the portrait and its
  caption are 673px of a 1480px section — 45%. The three stations are 435px and
  the shared section chrome is 264px. Any further compression of § 04 is a
  decision about the portrait's size, not about its spacing.

**`interests` was `elsewhere`**, same mono-label treatment, same seven items,
now **one middot-separated mono line** rather than seven paragraphs in a
two-column grid. It said in four rows what fits on one line at 1440 and two at
1920.

Photo per school — **the reference mark and the plate.**

**There is no room in the station for a mounted photograph, and this is
measured, not opinion.** A photo obeying the clear space beside the 620px name
column is ~119px wide, which is too small to read as a photograph at all. Do not
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
  **This was a 28px crop of the photograph itself and that was wrong.** At 28px
  a photograph has no subject, only noise, and noise beside a heading reads as a
  failed image load — the exact opposite of an affordance. Do not put the image
  back.
- **the anchor's height must be `0`, never `1em`.** An inline-block whose content
  is all out of flow takes its baseline from its bottom margin edge, so at `1em`
  it is a 40px box sitting entirely above the text baseline — taller than the
  name's own ascent. At `height: 0` the station's height is byte-identical with
  and without the mark.
- **the plate** — the full photograph. There is exactly **one** for the whole
  section, rendered by the section rather than inside either trigger, which is
  what makes "both stations stage it to the same coordinates" structural rather
  than two numbers kept in agreement. `position: absolute` — never fixed, never
  computed from scroll — against **a wrapper that contains exactly the two
  stations carrying a school, and nothing else.** Absolutely positioned children
  are out of flow, so it never becomes a grid item, reserves no space,
  contributes **0** to CLS, and cannot move a station's height. Four crop marks,
  0.5px ink, 14px arms, vertices 8px diagonally outside the corners, arms
  running back along the edges — never touching the photo, never closing into a
  rectangle. Real crop marks stay small whatever the sheet size, so they do
  **not** scale with the plate. Caption on one line beneath the bottom-left
  mark. No frame, no fill, no border box, no radius, no shadow, no filter, no
  grayscale.

  **The wrapper is what keeps the plate off the Kyoto portrait, and that is
  structural, not a number.** § 04 carries two photo mechanisms — the portrait,
  which is always visible and lives in the interests row, and this plate, which
  is staged. The portrait is outside the wrapper, so no value of `top` can put
  the plate over it. Do not anchor the plate to the section, to the route, or to
  a station: to the section or the route and it can reach the portrait; to a
  station and the two stations stage to different coordinates, which is the one
  property this design exists to guarantee.
  **Exactly one image is ever in the DOM**: measured 1 while open and **0** while
  closed, at 1920/1600/1440/1360/1024/900/768/390, and both triggers resolve to
  identical box coordinates at every one.

- **IT OPENS ON CLICK, AT EVERY WIDTH, AND THERE IS NO BREAKPOINT.** Hover
  opened it above 1440px, and the whole argument for that was that the plate
  covered the coursework rather than type being read — the coursework was
  clipped shut until the station was hovered. The coursework is permanently
  visible now, so there is nothing on that side of a station a plate may cover
  unasked. Gone with hover: `HOVER_OPENS`, the 180ms intent delay, the 260ms
  grace period, the region counter, the 200ms re-arm, the `edu-staged` /
  `edu-rearming` classes and the 1436px derivation behind the breakpoint. Click
  to open, click / Escape / anywhere else to close. **The 1440px LAYOUT
  breakpoint stays** — it is where the coursework becomes its own right-hand
  column — and it is no longer tied to any interaction.
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
  dropping it. Switching stations waits out the exit before mounting the
  incoming photo, so two are never visible at once.
- **THE PLATE'S SIZE IS SET BY THE WRAPPER'S HEIGHT, and that is new.** The
  stripped stations are short: `.bg-plates` measures **360px at 1920/1800, 452
  at 1600/1440, 548 at 1360** and 744+ below. The plate is centred on that
  block, so at the shortest it has 180px either side of the centre plus what it
  may borrow at each end — **40px above** (the clear air between the wrapper's
  top and station 01's date range, which shares the content edge) and **40px
  below** (`.bg-elsewhere`'s own top margin, before the interests hairline),
  less 8px of clearance each. The bottom is the tighter of the two because the
  caption hangs 43px past the box, so `h/2 + 8 + 43 ≤ 212` gives **h ≤ 322** and
  `--plate-h` is **320**. The 3:4 ratio then fixes the width at **240**, which
  is why there are no per-band widths any more: the height binds at every width
  ≥1440, and 240 + the 8px crop offset leaves **47px** of clear paper against
  the 295.2px coursework track at 1440, the narrowest it gets. This replaced
  220/360/390 and `--plate-h: 520`, all of which were derived against stations
  carrying four paragraphs of prose.
- Measured with the plate open, both triggers, every width: clear of station
  01's date range **51.8px**, clear above the portrait **46.2px**, clear right
  of the name column **+99.2px at 1440** — negative below 1440, which is the
  lightbox band where the plate deliberately crosses the station.
- The mark is the **only** pointer target. The plate is `pointer-events: none`
  until it is open, so it can never steal or trap a pointer.
- The two photos are **3:4** (4284×5712 and 2870×3826), not the 9:19.5 they are
  repeatedly assumed to be. They are **never** cropped — 9:19.5 would mean
  cutting ~57% of each image's width away.

**Vertical compression, measured at 1920 with the portrait loaded: 1975px →
1480px, −25.1%.** Also −20.9% at 1440, −26.3% at 1024, −30.7% at 900, −28.5% at
768 and −38.4% at 390. **It did not reach the 40% asked for and the portrait is
why**: at 1920 the portrait block is 673px of the remaining 1480 (45%), the
three stations are 435px, and 264px is section padding and the head rule that
every section carries. Everything that was spacing HAS been taken — station
padding `clamp(40px, 5vh, 64px)` → `clamp(20px, 2.4vh, 28px)`, the interests
block's margin 48 → 40 and its padding 32 → 28, the coursework's row gap 10 → 8,
and the 28px that sat under each school block for a paragraph that no longer
exists. Reaching 40% at 1920 means capping the portrait at ~230px wide, which is
a decision about the photograph, not about the layout.

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
  Lenis wrapper or anything with transform / filter /
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

**The rAF inventory — exactly three persistent loops, and this is the real
list.** It previously named "the global margin trace" as one of the three. No
code ever implemented a margin trace; it has been struck from § 7's roster and
from § 03's spine, which is static. The truth:

| # | loop | file | gate |
|---|---|---|---|
| 1 | shared scroll controller (Lenis + every subscriber) | `app/lib/scroll-controller.ts` | starts on first subscriber, stops on last |
| 2 | § 02's index — the drifting field | `app/components/skills.tsx` | viewport intersection + `document.hidden` |
| 3 | § 05 connect's type bands | `app/components/type-bands.tsx` | viewport intersection + `document.hidden` |

Loops 2 and 3 are fully cancelled on exit, on `document.hidden`, and under
reduced motion.

**Loop 1 is a KNOWN VIOLATION and it is tracked, not fixed.** `section-mark`
registers every section permanently, so the last subscriber never leaves and the
controller never stops: **~610 callbacks per 5s at rest**, with § 02 and § 05
both off screen. The fix is to gate each `section-mark` subscription on viewport
intersection the way loops 2 and 3 already are. **Do not do it during a
restructure** — it is pre-existing and orthogonal, and fixing it mid-restructure
makes every performance number un-attributable to the change that produced it.
It is a post-restructure task.

**Report the real inventory and the real at-rest callback count every pass. Do
not report "three and clean" — that assertion is retired.** If a pass moves the
at-rest count in either direction, report the delta.

Everywhere else: zero persistent rAF loops and zero pending timers once the page
settles. Verify with a 5s Performance recording after settle, and a second one
with § 02 scrolled out of view.

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
settle  cubic-bezier(0.16, 1, 0.3, 1)    520ms — every settling gesture
roll    cubic-bezier(0.12, 0.9, 0.08, 1) 1500ms — the hero glyph roll ONLY
```

**`settle` names one curve site-wide, and it is (0.16, 1, 0.3, 1).** The name
previously pointed at the glyph roll's (0.12, 0.9, 0.08, 1) while § 02's tick
rotation used (0.16, 1, 0.3, 1) unnamed — two curves under one name, which is
how a "use settle" instruction silently produces the wrong gesture. The glyph
roll's curve is now `roll` and belongs to nothing else. In code the constant was
already `ROLL_EASE` (`app/lib/roll.ts`), so this renames a spec entry, not an
identifier.

Animate only `transform`, `opacity`, `stroke-dashoffset`, `clip-path`. Reveals
travel **max 14px**. Stagger 34ms, capped at 8 items.

**Banned motion:** parallax on images, typewriter on body copy, counting or
animating numbers, marquee, hover-lift with shadow, scroll-jacking, card flips,
magnetic buttons.

**Magnetism is confined to § 05's centre block** — the email monument and the
`LET'S CONNECT` label above it, both text rather than links. Not the footer, not
the social links, nowhere else on the site.

**Marquee is banned as decorative background.** § 05 connect's counter-scrolling
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
The cap was 3, then 5. It is now **6**. **Every entry on this roster is built.**
Nothing is listed here as an intention, and nothing may be — a roster that mixes
what exists with what was once wanted is read as descriptive and is how the rAF
fiction survived four rounds of review.

1. **Hero / loader** — the DC map draws itself on a paper field, then travels to
   its hero position as the page arrives. One continuous event; the loader *is*
   this set piece, not a second.
2. **Experience spine** — a 6px bar (4px below 900px) segmented one segment per
   employer, each carrying that role's colour. Static, sized by the grid.
   § 5 / §03.
3. **The connect type bands** — two full-bleed rows of outlined display type
   counter-scrolling against each other, on a continuous autoplay loop.

**Three of six occupied.** The free slots are not an invitation. They are what
is left after § 02's generated figures were deleted (§ 9), after two entries
that had never been built were struck, and after § 02's ruling was removed under
§ 9 — a piece that shipped and was then taken out. A seventh idea still
argues for itself against the cap, and a new piece has to ship to take a slot.

The §02 field is deliberately NOT a set piece: it has no entrance, draws
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
  background**. § 02's field is exempt: every element is a labeled data object
  carrying content, nothing is ambient, and there is no background layer. The
  test is whether removing an element loses information. If it does not, it is a
  particle and it is banned.
- Rounded pill badges in a row (the shadcn tag-chip look) — tech stacks are mono
  text separated by `·`
- Proficiency bars, percentages-as-progress, star ratings, dots-out-of-five
- Animated stat counters
- Emoji, 3D icons, icon fonts, logo packs. Links are text.

**One exception exists: the § 05 pizza rain easter egg** renders a full-colour
pizza slice — `public/pizza.png`, a supplied illustration. It is a deliberate
joke, it is user-triggered after its first run, and its colours are quarantined
to that one element. No other illustration or off-palette colour exists anywhere
on the site.

It is a **supplied asset, never an emoji.** The emoji ban stands and is the
reason this is a file at all: an emoji renders as a different picture on every
platform and at the wrong weight beside this type. The exception is for one
illustration that happens to be a joke, not for the joke — nothing else may
introduce an image on this precedent.

This replaced a hand-authored inline SVG slice. The SVG is not coming back; if
the asset ever needs changing, change the file.

**§ 02's three project thumbnails are the other exception**, and they are a
different kind: not an illustration but photographic evidence of the work, shown
at native color inside registration corners (§ 5 / §02, § 12). Between them,
§ 03's brand logos and the pizza, every pixel of off-palette color on this site
is accounted for by an explicit, contained exception. There is no general
licence, and a fourth needs its own argument.
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
- **§ 02 had a ground of its own and it is gone, twice over.** First the ruling,
  then the tone under it. A 32px #C5CBD1
  lattice, heavier every fifth line, inset to the content box, uncovered by a
  900ms clip-path wipe. It was fully built and measured well. **A friend's
  portfolio uses a ruled paper ground**, and the rule against close imitation is
  the same one that killed the Brownian-walk hero. The ground is now a flat
  tonal shift. Do not rebuild it, and do not route around it with a dot grid,
  graph paper, a blueprint tint or any faint repeating texture.
- **§ 02 had a standfirst**, `three systems · seventeen tools · 2024—2026`.
  Removed: a counted inventory goes stale the moment a project or a tool is
  added, and a line that lies is worse than no line. **There is no replacement
  and no substitute tagline.** The section reads `02 / WORK`, `work`, then the
  column header.
- **Skills took the site's one axis break** when it was a stepped spine. It is
  now the drifting field, which breaks the grid in a different way but is still
  the site's one non-linear composition. Since the merge it lives inside § 02
  work as the index, so the rule that used to hold between two sections now
  holds *within* one: **§ 02's project rows stay vertically composed** and the
  break belongs to the index below them. One rule-break reads as intentional;
  two read as a tic.
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
- Below 640px: mono labels drop to 11px / 0.16em

**There is no plate frame.** This file described one, and § 10 gave it a 16px
inset below 640px. Its `frame-desktop` / `frame-mobile` spacing tokens have been
deleted from `tailwind.config.ts` along with the description. Section measure
comes from `section-pad` (`clamp(24px, 6vw, 96px)`) and nothing else.

Mobile is not an afterthought — assume half of recruiter traffic is a phone.

---

## 11. Accessibility

- Every interactive element reachable and visible on keyboard focus. Focus ring
  is a 1px accent outline with 2px offset — not a browser default, not removed.
- All external links: `target="_blank" rel="noopener noreferrer"`.
- Any text a user must read uses `#6B6455` minimum, ideally `#2E2A24`.
- **5.21:1 — `#6B6455` on paper #F5F1E8 — is the site's contrast floor.
  Nothing may be introduced below it.** The floor used to be 4.92:1, the same
  token on § 02's #EDEBE4 ground; that ground is deleted and every measured
  pairing on the site moved 0.1–1.0 points more generous with it. The floor is
  accepted rather than fixed: it passes AA at 4.5:1 at every size including the
  11px mono labels, and darkening the token or adding a second one would
  collapse a mono/body hierarchy that is doing real work.
- One `<h1>`. Sections as `<section>` with `aria-labelledby`.
- Decorative SVG gets `aria-hidden`; meaningful SVG gets a `<title>`.

---

## 12. Performance budget

- **Route JS is 190.9KB gzipped over 8 chunks at `712239f`** — measured in
  Phase 1 of the restructure, production `next start`, gzipping every `.js` the
  `/` route requests across a full page scroll. That is the method; do not mix
  figures taken any other way.

  **This exceeds the 150KB target by 41KB. The target stands as a goal to work
  back toward; IT IS NOT A GATE.** It was written as a "hard ceiling" and has
  never once held, which meant every verification block for months was asserting
  against a number already 41KB out — the same failure mode as the margin trace,
  and it is corrected the same way. Framework and runtime dominate the figure,
  so closing the gap is a dependency-level question (Lenis, anime.js, the
  React/Next baseline), not something a section pass can fix.

  **Report the DELTA from the last measured value on every build, and flag any
  single phase adding more than 5KB.** Do not attempt to reduce the total during
  the restructure — it is a post-restructure task, alongside the scroll
  controller's at-rest loop.

  Recorded history on this method: 189.6 at `f2a6905`, 189.8 after the
  project-thumbnail image pass, **190.9** after the index's co-occurrence
  linkage pass, 190.9 after the drafting ground (which nothing on `/` imports).

  **An older figure of 228.1KB over NINE chunks is on record and does not
  reproduce** — re-measuring the same commit gives 189.6 over eight.
  *Hypothesis, untested:* chunk count on `/` is sensitive to how many routes
  exist in the app — adding the scratch route alone moved `/` from 8 chunks to 9
  and +0.4KB — so the 9-chunk reading may have been taken when another route was
  present. **Do not chase this.** It is logged so nobody re-derives it.
- LCP < 1.8s on 4G, CLS < 0.05, Lighthouse ≥ 95 all four
- 60fps under 6× CPU throttle through a full page scroll
- **Three persistent rAF loops, enumerated in § 6 Scroll** — the shared scroll
  controller, § 02's index field, § 05's type bands. Zero pending timers once
  the page settles. **Report the real inventory and the real at-rest callback
  count every pass; "three and clean" is a retired assertion.**
- **THE AT-REST COUNT IS A KNOWN VIOLATION and it is tracked, not fixed.**
  Measured at rest with § 02 and § 05 both off screen: **606 rAF callbacks in 5
  seconds** (re-measured **617** a session later; treat ~610 as the figure and
  the delta as the signal). Byte-identical before and after the magnet, the
  character reveal and the type bands were added — those three add subscribers
  to the shared loop and no loop of their own. The cause is structural: the
  shared scroll controller starts its loop on the first subscriber and stops
  only when the last one leaves, and `section-mark` registers **every** section
  permanently, so the loop is alive from mount to unload. The fix is to gate
  each section-mark subscription on viewport intersection the way the field and
  the bands already are. **It is a post-restructure task and must not be done
  during the restructure** — it is orthogonal, and fixing it mid-restructure
  makes every performance number un-attributable. Do not claim this budget line
  is met until that gate exists.
- anime.js imported modularly, never the whole bundle
- Raster images now number **seven** — the about-section portrait, one photo per
  education row, `pizza.png` for § 05's easter egg, and **three project
  thumbnails** in § 02. Everything else is SVG or type. `pizza.png` is 31KB, is
  requested once and on demand by the rain, and is not part of any section's
  load.
  **The project thumbnails display at their native colors** — two dark UI
  screenshots and one research poster. Their color is quarantined to § 02's
  thumbnail frames and appears nowhere else. This is a third quarantine
  alongside § 03's brand logos and § 05's pizza, and like both of those it is a
  containment rule, not a licence: no other section may introduce color on this
  precedent, and nothing outside a thumbnail frame in § 02 may carry it.
  **The count is about section content.** `app/icon.png` and the OG/Twitter
  cards are page metadata, not composition: no section renders them, they cost
  no route JS, and the card is generated per deploy rather than authored. They
  are not part of the seven and do not create room for an eighth.

---

## 14. The share card

`app/opengraph-image.tsx` — 1200×630, and `app/twitter-image.tsx` **re-exports
it**. One design; there is never a second one to keep in agreement.

The card is the site's plate, not a photograph: paper ground, the name block at
116px on the left, the District on the right, four L-shaped registration
corners. No grain (it muddies under compression), no caption, no coordinates,
no GEORGETOWN label — at feed size 11px mono is texture, not type.

- The map imports its paths from `app/components/dc-paths.ts` and its star from
  `DC_PROJECTION`, run forward exactly as `hero-figure` runs it. **Never
  hand-copy or re-draw the geometry**, and never eyeball the star (§ 5 / hero).
- The viewBox is cropped to `DC_OUTLINE`'s real extent on all four sides. The
  projection square leaves ~46 units of dead space east and west, which would
  otherwise shrink the ink for a given panel height.
- The map is embedded as an `<img>` carrying a base64 SVG data URI. Satori's
  native SVG-element support covers a subset of attributes and **silently drops
  the rest**; the data URI goes through resvg intact. Same reason `icon.png` is
  built that way.
- Strokes are authored in **pixels and divided by units-per-pixel**.
  `vector-effect="non-scaling-stroke"` does not survive rasterisation, so the
  conversion has to be explicit.
- Satori is flexbox-only, needs an explicit `display` on every element, and has
  no `grid`. Render and look at the result — do not assume a CSS property took.

`metadataBase` in `app/layout.tsx` is **required, not decorative**: without it
Next emits `og:image` as a relative path and iMessage, Slack and Twitter all
render a card with no image. Verified in a production build — the tags resolve
to `https://jakekpark.com/opengraph-image`, not to localhost, which is what dev
shows and which is not a bug.

`app/icon.png` is rendered once by `scripts/generate-icon.mjs` and committed
rather than served from an `app/icon.tsx` route — a favicon is fetched on every
page load and there is no reason to rasterise it per request. It is the ochre
star on paper at 40%, and nothing else. **That is not the star's third
appearance** in the sense § 2 forbids: the bookend rule is about objects inside
a viewport of the page, and the favicon is the page's identity at 16px.

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