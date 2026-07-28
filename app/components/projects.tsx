"use client";

import { useCallback, useRef, useState } from "react";
import { PROJECTS, type Project, type ProjectLink } from "../lib/projects";
import ProjectFigure from "./project-figures";
import SectionShell from "./section-shell";

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

function StackRun({ items, className }: { items: string[]; className: string }) {
  return <p className={className}>{items.join(" · ")}</p>;
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
      <div className="proj-panel-wrap" hidden={!open}>
        <div id={panelId} role="region" aria-labelledby={btnId} className="proj-panel">
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
            <StackRun items={project.stack} className="proj-fullstack" />
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
            {project.credit && (
              <p className="proj-credit" data-reveal>
                {project.credit}
              </p>
            )}
          </div>

          {project.figure && (
            <figure className="proj-figure" data-reveal>
              <ProjectFigure kind={project.figure.kind} />
              <figcaption className="proj-fig-caption">{project.figure.caption}</figcaption>
            </figure>
          )}
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
