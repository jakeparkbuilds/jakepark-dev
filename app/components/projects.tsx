"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createTimeline, cubicBezier, utils } from "animejs";
import { PROJECTS, type Project, type ProjectLink } from "../lib/projects";
import { useReducedMotion } from "../lib/use-reduced-motion";
import ProjectFigure, { FIG_W, figureDelays } from "./project-figures";
import SectionShell from "./section-shell";

// Motion tokens (CLAUDE.md § 7).
const DRAW = cubicBezier(0.22, 1, 0.36, 1);
const REVEAL = cubicBezier(0.33, 1, 0.68, 1);
// The close gets its OWN curve, never the open's reversed: `draw` is an
// ease-out, so running it backwards is heavily back-loaded — it crawls and then
// snaps. Symmetric and quick; only opening gets the long drawn feel.
const CLOSE_EASE = cubicBezier(0.4, 0, 0.2, 1);
const OPEN_MS = 420;
const CLOSE_MS = 340;
const CONTENT_OUT_MS = 160;
const FIGURE_MS = 900;
const FIGURE_DELAY = 200;

// A figure draws once per session, the first time its row opens. Re-opening
// shows it already complete — no redraw, no flicker. Module scope, so it
// survives unmounts and re-renders and resets only on reload.
const DRAWN = new Set<string>();

// Dash lengths are computed in CSS PIXELS, never in user units. These paths
// carry vector-effect="non-scaling-stroke", so the browser resolves the dash
// pattern in the SVG's viewBox→CSS space; a dasharray taken straight from
// getTotalLength() is wrong by the viewBox scale factor and leaves part of the
// path sitting in the pattern's gap. The marker is the sharp case — its viewBox
// is 1×100 but it renders at the gap's full height. See CLAUDE.md § 7.

// § 04 projects — a drawing register. At rest the section is a legible catalog:
// one ruled line per project, everything visible, nothing hidden behind an
// interaction. Clicking an entry unfolds it in place; the rows below move down
// and a vertical ink marker runs the height of the opened gap.
//
// § 05 skills holds the site's one axis break, so this section stays vertically
// composed — a register, not a grid.
//
// Every projects-specific style lives in globals.css under `.proj-*`.

// 10px inline glyphs, matching the hero's social links: hand-drawn strokes at
// 0.9 so their weight survives next to the filled brand marks. The GitHub path
// is the Simple Icons mark (CC0), identical to the hero's.
function LinkGlyph({ type }: { type: ProjectLink["icon"] }) {
  const cls =
    "shrink-0 translate-y-px opacity-[0.55] transition-opacity duration-[140ms] group-hover:opacity-100";
  if (type === "github") {
    return (
      <svg width={10} height={10} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={cls}>
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    );
  }
  if (type === "pdf") {
    // A sheet with a turned corner.
    return (
      <svg width={10} height={10} viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth={0.9} aria-hidden="true" className={cls}>
        <path d="M2 1 h4.4 L9 3.6 V10 H2 Z" />
        <polyline points="6.4,1 6.4,3.6 9,3.6" />
      </svg>
    );
  }
  // live — a frame with an arrow leaving it.
  return (
    <svg width={10} height={10} viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth={0.9} aria-hidden="true" className={cls}>
      <polyline points="5.4,1.6 1.4,1.6 1.4,9.6 9.4,9.6 9.4,5.6" />
      <polyline points="6.8,1.2 9.8,1.2 9.8,4.2" />
      <line x1="9.8" y1="1.2" x2="5.6" y2="5.4" />
    </svg>
  );
}

function StackRun({
  items,
  className,
  reveal,
}: {
  items: string[];
  className: string;
  reveal?: boolean;
}) {
  return (
    <p className={className} {...(reveal ? { "data-reveal": "" } : {})}>
      {items.join(" · ")}
    </p>
  );
}

function ProjectRow({
  project,
  open,
  onToggle,
}: {
  project: Project;
  open: boolean;
  onToggle: () => void;
}) {
  const btnId = `proj-btn-${project.no}`;
  const panelId = `proj-panel-${project.no}`;
  const reduced = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const lineRef = useRef<SVGLineElement | null>(null);
  const first = useRef(true);
  // `visible` keeps the panel in the DOM (and out of `hidden`) for the length
  // of the close animation; closed panels end up genuinely hidden, not merely
  // transparent, so they leave the accessibility tree.
  const [visible, setVisible] = useState(open);
  // Derived during render, not in an effect: opening must un-hide the panel in
  // the same commit that the animation effect then measures, and React handles
  // a render-phase adjustment by re-rendering before it commits.
  if (open && !visible) setVisible(true);

  useEffect(() => {
    const wrap = wrapRef.current;
    const panel = panelRef.current;
    if (!wrap || !panel) return;

    const figurePaths = () =>
      Array.from(panel.querySelectorAll<SVGPathElement>("[data-fig-path]"));
    const revealTargets = () =>
      Array.from(panel.querySelectorAll<HTMLElement>("[data-reveal]"));
    const line = lineRef.current;

    // The gap is one grid row that goes 0fr -> 1fr. Never height:auto, never
    // max-height with a guessed ceiling.
    const setGap = (p: number) => {
      wrap.style.gridTemplateRows = `${p}fr`;
    };
    const clearDash = (el: SVGGeometryElement) => {
      el.style.removeProperty("stroke-dasharray");
      el.style.removeProperty("stroke-dashoffset");
    };

    // Settle to the final frame with no motion at all: the first commit (row 01
    // is server-rendered open) and every reduced-motion path.
    const settle = () => {
      setGap(open ? 1 : 0);
      for (const el of revealTargets()) {
        el.style.removeProperty("clip-path");
        el.style.removeProperty("transform");
      }
      if (line) clearDash(line);
      for (const p of figurePaths()) clearDash(p);
      panel.querySelector<SVGGElement>("[data-fig-legend]")?.style.removeProperty("opacity");
      if (open) DRAWN.add(project.no);
      if (!open) setVisible(false);
    };

    if (first.current) {
      first.current = false;
      settle();
      return;
    }
    if (!visible) return;
    if (reduced) {
      settle();
      return;
    }

    // ONE timeline drives the whole gesture. The gap and the marker are not two
    // instances that happen to share a duration — they are written from a
    // SINGLE progress value on every tick, so the marker's tip is pinned to the
    // gap's bottom edge by construction and cannot drift by a frame.
    const state = { p: open ? 0 : 1 };
    const markerLen = panel.offsetHeight;
    if (line) {
      line.style.strokeDasharray = String(markerLen);
      line.style.strokeDashoffset = String(markerLen * (1 - state.p));
    }

    const tl = createTimeline({
      defaults: {},
      onUpdate: () => {
        setGap(state.p);
        if (line) line.style.strokeDashoffset = String(markerLen * (1 - state.p));
      },
      onComplete: () => {
        if (line) clearDash(line);
        panel.querySelector<SVGGElement>("[data-fig-legend]")?.style.removeProperty("opacity");
        for (const el of revealTargets()) {
          el.style.removeProperty("clip-path");
          el.style.removeProperty("transform");
        }
        if (open) {
          setGap(1);
        } else {
          setGap(0);
          // The accessibility unmount fires here and nowhere else — never
          // during the retraction, which would collapse the gap instantly.
          setVisible(false);
        }
      },
    });

    if (open) {
      tl.add(state, { p: 1, duration: OPEN_MS, ease: DRAW }, 0);

      // claim -> stack -> links, in DOM order.
      revealTargets().forEach((el, i) => {
        el.style.clipPath = "inset(0 0 100% 0)";
        tl.add(
          el,
          {
            clipPath: ["inset(0 0 100% 0)", "inset(0 0 0 0)"],
            translateY: [10, 0],
            duration: 380,
            ease: REVEAL,
          },
          120 + i * 34
        );
      });

      // The figure draws once, on the first open of this row.
      if (!DRAWN.has(project.no)) {
        DRAWN.add(project.no);
        const svg = panel.querySelector("svg.proj-fig-svg");
        const scale = svg ? svg.getBoundingClientRect().width / FIG_W : 1;
        const paths = figurePaths();
        const delays = figureDelays(paths.length);
        paths.forEach((path, i) => {
          const len = path.getTotalLength() * scale;
          path.style.strokeDasharray = String(len);
          path.style.strokeDashoffset = String(len);
          tl.add(
            path,
            {
              strokeDashoffset: 0,
              duration: FIGURE_MS - 160,
              ease: DRAW,
              onComplete: () => clearDash(path),
            },
            FIGURE_DELAY + delays[i]
          );
        });
        // The scale bar and its labels are a legend, not a drawn line — they
        // arrive once the trails are mostly down.
        const legend = panel.querySelector<SVGGElement>("[data-fig-legend]");
        if (legend) {
          // Hidden only because it is about to be animated in; it renders at
          // full opacity without JS and on the reduced-motion path.
          legend.style.opacity = "0";
          tl.add(legend, { opacity: [0, 1], duration: 240, ease: "linear" }, 700);
        }
      }
    } else {
      // Content wipes out first, then the gap and marker retract together.
      revealTargets().forEach((el) => {
        tl.add(
          el,
          {
            clipPath: ["inset(0 0 0 0)", "inset(0 0 100% 0)"],
            duration: CONTENT_OUT_MS,
            ease: CLOSE_EASE,
          },
          0
        );
      });
      tl.add(state, { p: 0, duration: CLOSE_MS, ease: CLOSE_EASE }, CONTENT_OUT_MS);
    }

    return () => {
      tl.pause();
      utils.remove(state);
      const els: Element[] = [...revealTargets(), ...figurePaths()];
      if (line) els.push(line);
      utils.remove(els);
    };
  }, [open, visible, reduced, project.no]);

  return (
    <li className="proj-row" data-open={open ? "" : undefined}>
      <h3 className="proj-h3">
        <button
          type="button"
          id={btnId}
          className="proj-head"
          aria-expanded={open}
          aria-controls={panelId}
          data-cursor="pen-down"
          onClick={onToggle}
        >
          <span className="proj-no">{project.no}</span>
          <span className="proj-name">{project.name}</span>
          <StackRun items={project.closedStack} className="proj-stack" />
          <span className="proj-year">{project.year}</span>
        </button>
      </h3>

      {/* The wrapper is what the unfold animates; it clips the panel so the
          marker's drawn tip and the gap's bottom edge are the same edge. */}
      <div className="proj-panel-wrap" ref={wrapRef} hidden={!visible}>
        <div className="proj-panel-clip">
          <div
            id={panelId}
            role="region"
            aria-labelledby={btnId}
            className="proj-panel"
            ref={panelRef}
          >
          {/* The marker that makes the entry read as unfolded rather than as a
              box that grew. Sits in the NO. column's gutter. */}
          <svg
            className="proj-marker"
            viewBox="0 0 1 100"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            <line
              ref={lineRef}
              x1="0.5"
              y1="0"
              x2="0.5"
              y2="100"
              stroke="#1A1815"
              strokeWidth={0.5}
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <div className="proj-detail" data-has-figure={project.figure ? "" : undefined}>
            <p className="proj-claim" data-reveal>
              {project.claim}
            </p>
            <StackRun items={project.stack} className="proj-fullstack" reveal />
            <ul className="proj-links" data-reveal>
              {project.links.map((link) => {
                const external = link.href.startsWith("http");
                return (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      {...(external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : { target: "_blank" })}
                      className="group inline-flex items-center gap-2 text-body hover:text-accent"
                    >
                      <LinkGlyph type={link.icon} />
                      <span className="underline decoration-accent decoration-[1px] underline-offset-4">
                        {link.label}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

            {project.figure && (
              <figure className="proj-figure" data-reveal>
                <ProjectFigure kind={project.figure.kind} />
                <figcaption className="proj-fig-caption">{project.figure.caption}</figcaption>
              </figure>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

export default function Projects({
  number,
  id,
  label,
}: {
  number: string;
  id: string;
  label: string;
}) {
  // Row 01 is open on first paint — server-rendered open — so nobody meets a
  // section of closed lines.
  const [openNo, setOpenNo] = useState<string | null>(PROJECTS[0].no);
  const listRef = useRef<HTMLUListElement | null>(null);

  const toggle = useCallback((no: string) => {
    setOpenNo((cur) => (cur === no ? null : no));
  }, []);

  // Escape closes the open row; Up/Down move between row headers.
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpenNo(null);
      return;
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const heads = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>(".proj-head") ?? []
    );
    const i = heads.indexOf(document.activeElement as HTMLButtonElement);
    if (i === -1) return;
    e.preventDefault();
    const next = e.key === "ArrowDown" ? i + 1 : i - 1;
    heads[(next + heads.length) % heads.length]?.focus();
  }, []);

  return (
    <SectionShell number={number} id={id} label={label}>
      <div className="proj-register">
        {/* The column header is what makes this read as a register rather than
            a list. It appears once: it does not repeat and does not stick. */}
        <div className="proj-colhead" aria-hidden="true">
          <span className="proj-no">no.</span>
          <span className="proj-name">project</span>
          <span className="proj-stack">stack</span>
          <span className="proj-year">year</span>
        </div>

        <ul className="proj-list" ref={listRef} onKeyDown={onKeyDown}>
          {PROJECTS.map((p) => (
            <ProjectRow
              key={p.no}
              project={p}
              open={openNo === p.no}
              onToggle={() => toggle(p.no)}
            />
          ))}
        </ul>
      </div>
    </SectionShell>
  );
}
