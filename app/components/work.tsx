"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  PROJECTS,
  TOOL_FOR_STACK,
  type Project,
  type ProjectLink,
} from "../lib/projects";
import { CLUSTERS, NODE_SEEDS, TOOLS } from "../lib/skills";
import { useReducedMotion } from "../lib/use-reduced-motion";
import SectionMark from "./section-mark";
import SkillsIndex from "./skills-index";

// Node id → its position in NODE_SEEDS, which is the index's own addressing.
// Built once at module scope from the same array the field renders, so a stack
// token and a dial can never disagree about which node they mean.
const NODE_AT = new Map(NODE_SEEDS.map((s, i) => [s.tool.name, i]));

// § 02 work — the project rows, on the drafting ground.
//
// projects + skills merged into one section. THE ORDER IS NOT NEGOTIABLE: the
// rows come first and the index goes underneath them, because a recruiter must
// reach a named, linked, shipped project within one scroll of the hero. This
// section never leads with seventeen circles.
//
// A register that hides nothing, vertically composed. The site's one axis break
// belongs to the index below; a register that alternated or stepped would make
// two rule-breaks in one section, and two read as a tic.
//
// This does not use SectionShell: it carries a ground, a standfirst and a
// full-bleed edge, none of which the shared shell knows about. § 03 and § 05
// already set that precedent.
//
// Everything from the old § 04 is preserved: always-open rows, the thumbnail
// right-aligned at native colour inside registration corners, its sizes /
// quality / decode-gated reveal, and .proj-row:last-child. What is new is the
// type scale and the stack tokens.
//
// A row is: the header line, the claim, the full stack, the links, and the
// thumbnail. There is no metric row — it was built and then removed, and the
// numbers it carried are back where they came from (the index's evidence line
// for `aws`, CapitolCast's claim, and the screenshots). Do not add it back.

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

const CORNERS = ["tl", "tr", "bl", "br"] as const;

// Every stack string must be a key of TOOL_FOR_STACK — a missing one would
// render an inert token that looks interactive, which is worse than either
// state on its own. Module scope, so it throws at import rather than on a
// scroll, the same contract app/lib/skills.ts's orphan check follows.
{
  const missing = new Set<string>();
  for (const p of PROJECTS)
    for (const s of [...p.stack, ...p.headerStack])
      if (!(s in TOOL_FOR_STACK)) missing.add(s);
  if (missing.size)
    throw new Error(
      `projects.ts: every stack entry needs a TOOL_FOR_STACK mapping (node id or null). Missing: ${[
        ...missing,
      ].join(", ")}`,
    );
}

/** The full stack, below the claim. Entries the index carries are focusable
 *  controls; entries it does not are plain text. The header line's stack stays
 *  inert — it is a truncating one-liner, and an affordance that clips is not an
 *  affordance.
 *
 *  DIRECTION A of the wiring: hovering or focusing a token addresses its node
 *  in the index below, through the SAME state and therefore the same code path
 *  as clicking the dial itself. There is no second styling path — the node's
 *  gold ring, the field's dimming, the linkage draw and the readout all come
 *  from `active` and do not know or care which end set it. */
function StackTokens({
  stack,
  activeTool,
  onAddress,
  onLeave,
  onPin,
}: {
  stack: string[];
  activeTool: string | null;
  onAddress: (node: string) => void;
  onLeave: (node: string) => void;
  onPin: (node: string) => void;
}) {
  return (
    <p className="proj-fullstack" data-reveal>
      {stack.map((s, i) => {
        const node = TOOL_FOR_STACK[s];
        return (
          <span key={s}>
            {i > 0 && <span aria-hidden="true"> · </span>}
            {node ? (
              <button
                type="button"
                className="proj-tool"
                data-tool={node}
                // Underlined while its own node is addressed — the standard
                // accent link treatment, which is what says "this word and that
                // dial are the same thing".
                data-on={activeTool === node ? "" : undefined}
                aria-label={`${s} — show in the index`}
                // Hover is for pointers that hover. A touch fires pointerenter
                // and never the matching leave, which is exactly how a hover
                // state gets stuck on a phone; the tap goes through onClick.
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") onAddress(node);
                }}
                onPointerLeave={(e) => {
                  if (e.pointerType === "mouse") onLeave(node);
                }}
                // Focus addresses too, not just hover — the tokens are in the
                // tab order and a keyboard must reach the same state.
                onFocus={() => onAddress(node)}
                onBlur={() => onLeave(node)}
                onClick={() => onPin(node)}
              >
                {s}
              </button>
            ) : (
              s
            )}
          </span>
        );
      })}
    </p>
  );
}

/** DIRECTION B: a 0.5px accent bracket drawn in the row's left margin while one
 *  of its tools is addressed. Fixed 14px arms on a 48px spine — a registration
 *  mark, not a full-height rule: real crop marks stay the same size whatever
 *  the sheet does, the same rule § 04's plate follows.
 *
 *  pathLength="1" normalises the dash so no measurement is needed, and BOTH
 *  dash attributes come off on animationend. */
function RowBracket() {
  return (
    <svg
      className="proj-bracket"
      width="14"
      height="48"
      viewBox="0 0 14 48"
      aria-hidden="true"
      onAnimationEnd={(e) => {
        const el = e.target as SVGPathElement;
        el.removeAttribute("stroke-dasharray");
        el.removeAttribute("stroke-dashoffset");
        el.setAttribute("data-drawn", "");
      }}
    >
      <path
        d="M14 0.25 L0.25 0.25 L0.25 47.75 L14 47.75"
        fill="none"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1}
      />
    </svg>
  );
}

function ProjectRow({
  project,
  activeTool,
  matches,
  selecting,
  onAddress,
  onLeave,
  onPin,
}: {
  project: Project;
  activeTool: string | null;
  matches: boolean;
  selecting: boolean;
  onAddress: (node: string) => void;
  onLeave: (node: string) => void;
  onPin: (node: string) => void;
}) {
  const { thumb } = project;
  return (
    // The id is the index's landing target: its readout links a tool to the
    // rows it shipped in.
    <li
      className="proj-row"
      id={`project-${project.no}`}
      data-match={selecting && matches ? "" : undefined}
      data-dim={selecting && !matches ? "" : undefined}
    >
      {selecting && matches && <RowBracket />}
      {/* The header line. Not a button — nothing here toggles, so an
          interactive role would advertise an affordance that does not exist. */}
      <div className="proj-head" data-reveal>
        <span className="proj-no">{project.no}</span>
        <h3 className="proj-name">{project.name}</h3>
        <p className="proj-stack">{project.headerStack.join(" · ")}</p>
        <span className="proj-year">{project.year}</span>
      </div>

      <div className="proj-body">
        <div className="proj-detail" data-has-thumb={thumb ? "" : undefined}>
          <p className="proj-claim" data-reveal>
            {project.claim}
          </p>

          <StackTokens
            stack={project.stack}
            activeTool={activeTool}
            onAddress={onAddress}
            onLeave={onLeave}
            onPin={onPin}
          />

          <ul className="proj-links" data-reveal>
            {project.links.map((link) => {
              const external = link.href.startsWith("http");
              return (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    {...(external ? { rel: "noopener noreferrer" } : {})}
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

        {thumb && (
          <figure className="proj-figure">
            {/* The whole thumbnail is a link, and the text link above stays:
                this is a convenience, not the only affordance. The image link
                carries its own aria-label rather than leaning on the alt, so a
                screen reader hears a destination and not a description. */}
            <a
              className="proj-thumb"
              href={thumb.href}
              target="_blank"
              {...(thumb.href.startsWith("http")
                ? { rel: "noopener noreferrer" }
                : {})}
              aria-label={thumb.linkLabel}
              data-cursor="pen-down"
            >
              <span
                className="proj-thumb-box"
                // The frame's box is reserved from the source's real intrinsic
                // pixels, as INTEGERS — a fractional ratio shivers the
                // registration marks against their own edges.
                style={{ aspectRatio: `${thumb.width} / ${thumb.height}` }}
              >
                <Image
                  className="proj-thumb-img"
                  src={thumb.src}
                  alt={thumb.alt}
                  width={thumb.width}
                  height={thumb.height}
                  quality={72}
                  sizes="(min-width: 1440px) 560px, (min-width: 1200px) 42vw, (min-width: 900px) 520px, 92vw"
                  loading="lazy"
                />
                {/* Four L-shaped registration marks. The same vocabulary as
                    § 04's plates and the index's focus state — this is what
                    makes a full-colour rectangle belong to a drawn page. */}
                {CORNERS.map((c) => (
                  <span key={c} aria-hidden="true" className="proj-thumb-reg" data-c={c} />
                ))}
              </span>
            </a>
            <figcaption className="proj-thumb-caption">{thumb.caption}</figcaption>
          </figure>
        )}
      </div>
    </li>
  );
}

export default function Work({
  number,
  id,
  label,
}: {
  number: string;
  id: string;
  label: string;
}) {
  const reduced = useReducedMotion();
  const listRef = useRef<HTMLUListElement | null>(null);
  const headingId = `${id}-heading`;

  // ── ONE shared active-tool state, two entry points.
  //
  // `hover` is transient and `pinned` survives the pointer leaving — that is
  // the whole difference, and keeping them apart is what makes a pin hold: a
  // single value would be cleared by the pointerleave that follows any click.
  // Both a dial and a project's stack token write here, so the two can never
  // disagree about which node is addressed.
  const [hover, setHover] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const active = pinned ?? hover;
  const activeTool = active === null ? null : NODE_SEEDS[active].tool.name;

  const address = useCallback((i: number) => setHover(i), []);
  const leave = useCallback(
    (i: number) => setHover((v) => (v === i ? null : v)),
    [],
  );
  const pin = useCallback((i: number) => {
    setPinned((v) => (v === i ? null : i));
    setHover(i);
  }, []);
  const clear = useCallback(() => {
    setHover(null);
    setPinned(null);
  }, []);

  // The same three, addressed by node id — what a stack token has.
  const addressTool = useCallback(
    (node: string) => {
      const i = NODE_AT.get(node);
      if (i !== undefined) address(i);
    },
    [address],
  );
  const leaveTool = useCallback(
    (node: string) => {
      const i = NODE_AT.get(node);
      if (i !== undefined) leave(i);
    },
    [leave],
  );
  const pinTool = useCallback(
    (node: string) => {
      const i = NODE_AT.get(node);
      if (i !== undefined) pin(i);
    },
    [pin],
  );

  // Each row reveals once on entry and stays. The hidden start state is applied
  // by [data-motion="armed"] on the list, set here in a layout effect — the
  // same contract § 03 follows. Rows are hidden ONLY when something is
  // guaranteed to reveal them, so with no JS, failed JS or reduced motion the
  // register renders complete and legible.
  useEffect(() => {
    const list = listRef.current;
    if (!list || reduced) return;

    const rows = Array.from(list.querySelectorAll<HTMLElement>(".proj-row"));
    if (!rows.length) return;

    list.setAttribute("data-motion", "armed");

    // One observer per row, each disconnecting on its own first crossing —
    // never one section-level stagger. A visitor landing mid-section would
    // otherwise watch rows animate that they had already scrolled past.
    const observers = rows.map((row) => {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            row.setAttribute("data-landed", "");
            io.disconnect();
          }
        },
        { threshold: 0.25 },
      );
      io.observe(row);
      return io;
    });

    return () => {
      for (const io of observers) io.disconnect();
      list.removeAttribute("data-motion");
    };
  }, [reduced]);

  // The thumbnail reveal is bound to DECODE, never to scroll position. See
  // CLAUDE.md § 5 / §02: the row's own reveal ran on schedule whether or not
  // pixels existed, so on a cold cache the wipe uncovered an empty frame.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const boxes = Array.from(
      list.querySelectorAll<HTMLElement>(".proj-thumb-box"),
    );
    const cleanups: (() => void)[] = [];

    for (const box of boxes) {
      const img = box.querySelector("img");
      if (!img) continue;
      box.setAttribute("data-armed", "");

      const settle = (e: TransitionEvent) => {
        if (e.propertyName === "clip-path") box.setAttribute("data-settled", "");
      };
      box.addEventListener("transitionend", settle);

      const show = () => box.setAttribute("data-loaded", "true");
      const reveal = () => {
        // decode() is what buys the smooth frame; the rejection path is what
        // stops a broken source leaving the picture permanently at opacity 0.
        img.decode().then(show, show);
      };
      if (img.complete && img.naturalWidth > 0) reveal();
      else {
        img.addEventListener("load", reveal, { once: true });
        img.addEventListener("error", show, { once: true });
      }

      // Widen the fetch trigger without taking `priority`: these sit below the
      // hero and can never be the LCP element.
      const io = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          img.loading = "eager";
          box.setAttribute("data-near", "");
          io.disconnect();
        },
        { rootMargin: "900px 0px" },
      );
      io.observe(box);

      cleanups.push(() => {
        io.disconnect();
        box.removeEventListener("transitionend", settle);
      });
    }

    return () => {
      for (const c of cleanups) c();
      for (const box of boxes) box.removeAttribute("data-armed");
    };
  }, []);

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="work has-drafting section-pad py-section-y"
    >
      {/* The ground is a background colour on this section and nothing more —
          no element, no component, no JS. See .has-drafting in globals.css for
          why it carries no ruling. */}
      <div className="work-head">
        <SectionMark mark={number} label={label} />
        <h2 id={headingId} className="font-display text-h2 text-ink">
          {label}
        </h2>
        {/* No standfirst. A line reading "three systems · seventeen tools"
            goes stale the moment a project or a tool is added, and a line that
            lies is worse than no line. Do not add a replacement. */}
      </div>

      <div className="work-body">
        <div className="proj-register">
          {/* The column header is what makes this read as a register rather
              than a list. It appears once: it does not repeat and does not
              stick. */}
          <div className="proj-colhead" aria-hidden="true">
            <span className="proj-no">no.</span>
            <span className="proj-name">project</span>
            <span className="proj-stack">stack</span>
            <span className="proj-year">year</span>
          </div>

          <ul
            className="proj-list"
            ref={listRef}
            data-selecting={activeTool !== null ? "" : undefined}
          >
            {PROJECTS.map((p) => (
              <ProjectRow
                key={p.no}
                project={p}
                activeTool={activeTool}
                matches={
                  activeTool !== null &&
                  p.stack.some((s) => TOOL_FOR_STACK[s] === activeTool)
                }
                selecting={activeTool !== null}
                onAddress={addressTool}
                onLeave={leaveTool}
                onPin={pinTool}
              />
            ))}
          </ul>
        </div>

        {/* ── the index. Under the rows, never above them.
            The label replaces the old section's h2: this is apparatus for the
            work above, not a headline of its own. Its counts are READ FROM THE
            DATA rather than written down, so unlike the standfirst that was
            deleted from this section they cannot go stale. */}
        <div className="work-index">
          <div aria-hidden="true" className="work-index-rule" />
          <p className="work-index-label font-mono">
            — index · {TOOLS.length} tools · {CLUSTERS.length} domains
          </p>
          <SkillsIndex
            active={active}
            pinned={pinned}
            onAddress={address}
            onLeave={leave}
            onPin={pin}
            onClear={clear}
          />
        </div>
      </div>
    </section>
  );
}
