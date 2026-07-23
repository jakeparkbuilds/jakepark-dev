# jakepark.dev — project instructions

Personal portfolio for Jake Park. Sophomore at Georgetown, B.S. Computer Science +
A.B. Mathematics, class of 2029. Builds ML and data systems.

The art direction below is **locked**. It was designed deliberately. Do not
"improve" it, do not substitute fonts, do not add colors. If something in this
file seems to prevent a good solution, say so and ask — do not silently deviate.

---

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS, with the tokens below defined in `tailwind.config.ts` — never
  arbitrary hex values in JSX
- Lenis for smooth scroll
- anime.js v4 for scroll-linked set pieces (`onScroll`, `createDrawable`,
  `stagger`, `createTimeline`)
- Fonts self-hosted as woff2 via `next/font/local`. Never `<link>` to Google Fonts.
- Deployed on Vercel

Do not add: Framer Motion (anime.js covers it), GSAP, three.js, a UI component
library, an animation library not listed above, or any icon package. Ask first.

---

## Palette — exactly 4 colors + 1 softened ink

```
paper    #F5F1E8   base surface
ink      #1A1815   primary type, strong hairlines
muted    #9B9382   secondary hairlines, frame, reserved-zone outline
accent   #22384F   ink blue — section marks + link underlines ONLY
body     #2E2A24   softened ink for body copy (same hue, not a 5th color)
```

Rules:
- Accent appears on **~3% of any given viewport**. If you are reaching for it a
  third time in one section, you are wrong.
- Never pure white, never pure black, never a gray with blue in it.
- No dark mode. This site is paper. Do not add a theme toggle.
- Mono labels use `#7C7566` (muted, one step darker) when they need to be
  legible; `#9B9382` only for the quietest captions.

## Typography — exactly 2 families

- **Bricolage Grotesque** (variable, `opsz 12..96`, weights 400/500) — display + body
- **IBM Plex Mono** (400/500) — labels, metadata, section numbers, coordinates

Scale:

| token | family | size | weight | line-height | tracking |
|---|---|---|---|---|---|
| display | Bricolage | 138px | 400 | 0.90 | -0.03em |
| h1 | Bricolage | 64px | 500 | 1.05 | -0.02em |
| h2 | Bricolage | 40px | 500 | 1.10 | -0.015em |
| body | Bricolage | 19px | 400 | 1.58 | 0 |
| small | Bricolage | 15px | 400 | 1.45 | 0 |
| mono-label | Plex Mono | 12–13px | 500 | — | 0.22–0.24em, uppercase |
| mono-micro | Plex Mono | 11px | 400 | — | 0.16em, uppercase |

Rules:
- **Lowercase / sentence case everywhere.** Never Title Case. The only uppercase
  is mono labels, which are uppercased via CSS `text-transform`.
- Proper nouns are capitalized normally: personal names, institutions
  (Georgetown), companies (DrivePulse, Hoyalytics), technologies (Python,
  PyTorch, AWS). Everything else stays lowercase — section headings, nav
  labels, link text, captions, buttons. Never Title Case a heading. Mono
  labels remain uppercase via text-transform.
- No third family. No italic. No weights other than 400 and 500.
- Set `text-wrap: pretty` on paragraphs, `text-wrap: balance` on headings.

## Structure

- Hairlines are **0.5px**. Ink for the top structural rule and vertical dividers;
  muted for frames, footer rules, and reserved-zone outlines.
- Plate frame inset 40px. Content padding 92px × 96px at desktop.
- Text column 632px at desktop.
- Grain: SVG fractalNoise, `opacity: 0.05`, `mix-blend-mode: multiply`,
  `pointer-events: none`. One instance, fixed to the page, not per-section.
- `border-radius: 0` on everything. No exceptions.
- **No box-shadows anywhere.** Cards are defined by rules and space.

---

## Banned

These are the defaults that make a site look AI-generated. Never produce them,
even if asked indirectly:

- Gradients of any kind, gradient text, mesh backgrounds
- Glassmorphism, backdrop-blur, frosted panels
- Glow, neon, bloom, colored shadows
- Floating particles, blobs, aurora, star fields
- Rounded pill badges in a row (the shadcn tag-chip look) — tech stacks are set
  as mono text separated by `·`
- Animated stat counters ("500+ students reached")
- Emoji, 3D icons, or any icon font. Links are text.
- Centered hero with headline + subhead + two side-by-side CTA buttons
- `<button>` styled as a primary/secondary pair
- Card grids with hover-lift + shadow

---

## Responsive

The Claude Design export is a fixed 1440×940 artboard. It must be rebuilt fluid:

- Display type: `clamp(56px, 9vw, 138px)`
- Section padding: `clamp(24px, 6vw, 96px)`
- Text column: `min(632px, 100%)`
- Hero: `min-height: 100svh` (svh, not vh)
- Below 900px: reserved drawing zone moves **below** the text, not beside it
- Below 640px: plate frame inset drops to 16px; drop the frame entirely if it
  crowds. Mono labels drop to 11px and tracking to 0.16em.

Mobile is not an afterthought — assume half of recruiter traffic is a phone.

## Accessibility

- Every interactive element reachable and visible on keyboard focus. Focus ring
  is a 1px accent outline with 2px offset — not a browser default, not removed.
- All external links: `target="_blank" rel="noopener noreferrer"`.
- Contrast: muted `#9B9382` on paper is ~2.4:1 — it is **decorative only**. Any
  text a user must read uses `#7C7566` minimum, ideally `#2E2A24`.
- `prefers-reduced-motion` is a first-class path, not a fallback. See
  `docs/motion-spec.md`.
- Semantic landmarks: one `<h1>`, sections as `<section>` with `aria-labelledby`.

## Performance budget

- LCP < 1.8s on 4G, CLS < 0.05, Lighthouse ≥ 95 on all four categories
- Total JS < 150KB gzipped. anime.js is imported **modularly** — only the
  submodules used, never the whole bundle.
- No animation library work on the main thread during initial paint
- Images: `next/image`, AVIF/WebP, explicit dimensions
- The portrait is the only raster image on the site. Everything else is SVG or type.

## Working rules

- Build **static and correct first**. Motion is layered afterward, one section at
  a time. Do not add animation to a section that is not yet content-complete.
- Never write placeholder copy. If content is missing, stop and ask for it.
- Commit per section. Small diffs.
- After each section, run `npm run build` and report bundle size delta.
