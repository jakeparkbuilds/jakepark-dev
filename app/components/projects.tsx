"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { PROJECTS, type Project, type ProjectLink } from "../lib/projects";
import { useReducedMotion } from "../lib/use-reduced-motion";
import SectionShell from "./section-shell";

// § 04 projects — a register that hides nothing.
//
// One project per ruled row on a 12-column grid, under a column header that
// appears exactly once. Every row is fully open at all times: the header line,
// the claim, the full stack, the links and a real screenshot, all of it visible
// from first paint.
//
// The accordion this section used to be is deleted — the toggle, the
// one-open-at-a-time state, the 0fr→1fr gap, the marker that drew down the
// gap's height, the aria-expanded wiring and the keyboard handlers. So are the
// three generated SVG figures and their seeded PRNG. See CLAUDE.md § 5 / §04
// for why; the short version is that a three-item register concealing two
// thirds of itself was the one piece of generic UI on a page with this much
// drawn motion, and a generated figure describes work that a screenshot simply
// shows.
//
// § 05 skills holds the site's one axis break, so this stays vertically
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

const CORNERS = ["tl", "tr", "bl", "br"] as const;

function ProjectRow({ project }: { project: Project }) {
  const { thumb } = project;
  return (
    <li className="proj-row">
      {/* The header line. Not a button any more — nothing here toggles, so an
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
          <p className="proj-fullstack" data-reveal>
            {project.stack.join(" · ")}
          </p>
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
                // registration marks against their own edges. next/image already
                // reserves the same box from the width/height attributes;
                // stating it on the frame is what guarantees the corners are
                // painted at the right size before any pixel arrives, so the
                // empty state is a correctly-proportioned paper rectangle rather
                // than a collapsing one.
                style={{ aspectRatio: `${thumb.width} / ${thumb.height}` }}
              >
                <Image
                  className="proj-thumb-img"
                  src={thumb.src}
                  alt={thumb.alt}
                  width={thumb.width}
                  height={thumb.height}
                  // 72, not 90 — measured at the widths a browser actually
                  // requests, a 27-38% smaller AVIF with no visible difference
                  // at 200% on a dark UI capture.
                  quality={72}
                  sizes="(min-width: 1440px) 560px, (min-width: 1200px) 42vw, (min-width: 900px) 520px, 92vw"
                  // § 04 is the fourth section down, below a 100svh hero plus
                  // § 02 and § 03 — it is off screen at every common viewport
                  // height, so no row here is ever the LCP element and none of
                  // them takes `priority`. Marking row 01 priority would only
                  // contend with the hero's real LCP work.
                  loading="lazy"
                />
                {/* Four L-shaped registration marks. The same vocabulary as
                    § 06's plates and § 02's portrait — this is what makes a
                    full-colour rectangle belong to a paper page. */}
                {CORNERS.map((c) => (
                  <span
                    key={c}
                    aria-hidden="true"
                    className="proj-thumb-reg"
                    data-c={c}
                  />
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

export default function Projects({
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

  // Each row reveals once on entry and stays. The hidden start state is applied
  // by [data-motion="armed"] on the list, set here in a layout effect — the
  // same contract § 03 follows. Rows are hidden ONLY when something is
  // guaranteed to reveal them, so with no JS, failed JS or reduced motion the
  // register renders complete and legible. Never make the hidden state the CSS
  // default.
  //
  // The reveal itself is CSS transitions keyed off [data-landed], not a
  // timeline: there is no per-frame value to compute here, so there is nothing
  // to drive and nothing to kill. Zero rAF, zero pending timers, and the
  // observers disconnect themselves as they fire (CLAUDE.md § 12).
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

  // The thumbnail reveal is bound to DECODE, never to scroll position.
  //
  // The bug this fixes: the row's own [data-landed] reveal ran on schedule
  // whether or not pixels existed, so on a cold cache the wipe uncovered an
  // empty frame and the picture then appeared in one step underneath it. On
  // every later scroll it looked perfect because the image was cached — which
  // is exactly the shape of a race, not of a broken animation.
  //
  // Three separate jobs, none of which is a loop or a timer:
  //   near    — an observer 900px ahead of the viewport flips the image out of
  //             lazy, so the fetch and the decode are already done by the time
  //             the frame is on screen.
  //   loaded  — set only AFTER img.decode() resolves, which moves the decode
  //             cost off the paint frame that reveals it. On rejection it is
  //             set anyway: a failed decode must never strand an invisible
  //             image.
  //   settled — set on the clip-path's own transitionend, and under it the CSS
  //             drops the transition, the will-change and the clip-path
  //             entirely. The settled DOM is byte-for-byte the static state
  //             this section had before, with no compositing layer left over.
  //
  // The hidden start state is armed from here, never the CSS default — with no
  // JS the thumbnails render exactly as they always did (CLAUDE.md § 5 / §04).
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
        // decode() is what buys the smooth frame; try/catch is what stops a
        // rejection (a broken source, an aborted navigation) from leaving the
        // picture permanently at opacity 0.
        img.decode().then(show, show);
      };
      if (img.complete && img.naturalWidth > 0) reveal();
      else {
        img.addEventListener("load", reveal, { once: true });
        img.addEventListener("error", show, { once: true });
      }

      // Widen the fetch trigger without taking `priority`: these sit four
      // sections down and can never be the LCP element, so competing with the
      // hero's real LCP work would be a straight regression.
      const io = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          img.loading = "eager";
          // Promote only across the window in which the reveal actually runs.
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
      for (const box of boxes)
        box.removeAttribute("data-armed");
    };
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

        <ul className="proj-list" ref={listRef}>
          {PROJECTS.map((p) => (
            <ProjectRow key={p.no} project={p} />
          ))}
        </ul>
      </div>
    </SectionShell>
  );
}
