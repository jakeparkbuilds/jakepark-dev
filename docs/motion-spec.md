# motion spec

Read with `CLAUDE.md`. That file governs how the site looks; this one governs how
it moves. Where they conflict, `CLAUDE.md` wins.

## Governing principle

**Motion must encode a claim.** Every animation on this site either draws
something true about Jake's work, or reveals content in the site's own rhythm.
Decoration is not a reason. If you cannot say in one sentence what a piece of
motion is *asserting*, delete it.

There are exactly **two set pieces**. Everything else is quiet. Adding a third
set piece requires asking first.

---

## The vocabulary

Motion is drawn, not faded. The metaphor is a pen plotter on paper: strokes
appear by being drawn along their length, elements arrive by being uncovered, and
nothing ever slides in from offscreen or scales up from nothing.

**Easing** — three curves, no others:

```
draw    cubic-bezier(0.22, 1, 0.36, 1)      long, decisive     700–1400ms
reveal  cubic-bezier(0.33, 1, 0.68, 1)      soft settle        520ms
micro   cubic-bezier(0.4, 0, 0.2, 1)        UI response        140–180ms
```

**Properties** — animate only `transform`, `opacity`, `stroke-dashoffset`,
`clip-path`. Never `top`, `left`, `width`, `height`, `margin`, or `filter`.

**Distances** — reveals translate at most **14px**. Never 40px. Big travel reads
as a template.

**Stagger** — 34ms base between siblings, capped at 8 items. Longer chains use
`anime.stagger` with `from: 'first'`, never `'random'`.

**Banned motion**: parallax on images, letter-by-letter typewriter on body copy,
counting numbers, marquee/infinite ticker, hover-lift with shadow, page-load
spinners, scroll-jacking, horizontal scroll sections, cursor followers (an
element lagging behind the pointer) — banned. The custom pointer itself is
exempt: it tracks with zero lag and IS the pointer. Only deliberate ink residue
may lag. Also banned: magnetic buttons on anything except the outro links.

---

## Global behavior

**Smooth scroll** — Lenis, `lerp: 0.09`, `duration: 1.1`. Disabled entirely under
`prefers-reduced-motion` and on touch devices (native scroll on mobile is better
than any JS approximation).

**Reveal grammar** — the default for every content block: `opacity 0 → 1` and
`translateY(14px) → 0`, `reveal` easing, 520ms, triggered by IntersectionObserver
at `rootMargin: '0px 0px -12% 0px'`, `threshold: 0.15`. Fires **once**. Never
re-animates on scroll-up.

**Section rules** — every 0.5px hairline draws itself horizontally
(`scaleX: 0 → 1`, `transform-origin: left`) over 900ms on `draw` easing when its
section enters. This is the site's signature and it is worth being consistent about.

**Section marks** (`02` etc.) — mono label does a 260ms scramble through
`0-9 —` before settling. Borrowed texture from wodniack, but only on the marks,
never on headings or body.

**Nav** — no fixed header. A thin right-margin rail of six 1px muted ticks, one
per section, indicating scroll position; the active tick goes accent and 2px wide.
Click jumps. Hidden below 900px. This is the only persistent chrome.

---

## Per-section contract

### 01 hero — SET PIECE 1

*Claim: this person does quantitative work.*

The reserved zone (`fig. 01`) holds a live generative ink drawing on `<canvas>`
or inline SVG: a random-walk / geometric-Brownian path with light drift, drawn
left to right over ~2.2s on first load, in `ink` at 0.55 opacity with a single
`accent` stroke for the realized path. Seeded per visit — no two visitors get the
same figure. Caption updates to state the parameters used.

Static after it draws. It does not loop, breathe, or respond to the cursor.

Text side: mono label, then `jake` / `park` — the two lines clip-reveal upward
from a mask, 90ms apart, 1100ms, `draw` easing. Blurb and links follow on the
standard reveal grammar, 34ms stagger.

Nothing here waits on fonts. Use `next/font` with `display: swap` and set the
animation to start on `document.fonts.ready` or a 400ms timeout, whichever fires
first — a hero that animates before the font lands looks broken.

Mobile: figure renders once, static, at 240px tall, below the text.

### 02 about + portrait

*Claim: none. This is a quiet section.*

Portrait uncovers via `clip-path: inset(0 0 100% 0) → inset(0 0 0 0)`, 900ms,
`draw` easing — as if printed. Never a fade, never a scale.

Body copy uses the standard reveal grammar, per paragraph, 60ms apart.

### 03 experience timeline

*Claim: continuity.*

A single vertical 0.5px ink line draws downward, scroll-linked via
`anime.onScroll({ sync: true })` — it tracks scrub position, not a one-shot
trigger. Each role's marker dot and text reveal as the line passes them.

Roles: Better Futures Institute, Break Through Tech, DrivePulse, Georgetown
Ventures, Hoyalytics. Dates in mono, titles in Bricolage 500.

Reduced motion: line is drawn at full length, entries visible.

### 04 projects — SET PIECE 2

*Claim: these are real systems, and here is what they actually did.*

Each project card carries a small SVG figure generated in-browser from the shape
of the work. The figure draws itself once when the card enters, then stops.

- **My 5** — a histogram tightening as sample count rises; converges and stops.
  Caption states the stopping criterion.
- **CapitolCast** — a small force-directed cosponsorship graph, ~60 nodes,
  settling from random positions to equilibrium over ~1.6s. Fixed seed so the
  final layout is stable across visits.
- **Transit / APC pipeline** — scattered stop points snapping onto tract polygon
  centroids.

Figures are `ink` at 0.5 opacity, one `accent` element each. No fills, no color
scales, no legends — these are marginal figures, not dashboards.

Card hover: rule under the title draws left-to-right, 180ms, `micro`. Title goes
accent. Nothing moves, nothing lifts, nothing shadows.

Mobile and reduced motion: figures render in final state, no animation.

### 05 skills

Micro only. Mono text grouped by category, separated by `·`. Standard reveal with
`stagger({ grid: [n, 1], from: 'center' })`, 20ms. No badges, no pills, no bars,
no proficiency indicators.

### 06 education

Two entries, standard reveal grammar. Nothing else. Resist the urge.

### 07 connect

Display-scale type, clip-reveal like the hero name. Email as text, not a button.
Social links repeat. These four links may have a subtle magnetic hover — max 4px
displacement, `micro` easing — and it is the only cursor-reactive element on the
site.

---

## Reduced motion

Under `prefers-reduced-motion: reduce`:

- Lenis off, native scroll
- All reveals become instant; content is visible at rest with no opacity or
  transform initial state
- Both set pieces render their **final frame immediately** — the Brownian
  path complete, the histogram converged. Content is never lost, only the
  drawing of it.
- Hairlines drawn at full length
- Section-mark scramble skipped

This is implemented as a `useReducedMotion()` hook checked before any anime.js
call, not as a CSS override layered on top. Test it by actually toggling the OS
setting.

## Performance rules for motion

- Everything scroll-linked goes through **one** shared `requestAnimationFrame`
  loop, not one per component.
- `will-change` applied only during an animation, removed on complete.
- Canvas set pieces: cap DPR at 2, pause via IntersectionObserver when offscreen,
  and stop the rAF loop entirely once the drawing completes.
- No animation may run continuously after its section is out of view. There
  should be **zero** persistent rAF loops once the page settles.
- Verify: DevTools Performance, 6× CPU throttle, must hold 60fps through a full
  scroll of the page.
