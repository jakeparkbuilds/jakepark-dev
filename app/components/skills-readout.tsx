"use client";

import {
  CLUSTERS,
  CONTEXT_HREF,
  CONTEXT_LABEL,
  TOOLS,
  type Tool,
} from "../lib/skills";
import { CLUSTER_LABEL } from "../lib/skills-geometry";
import { scrollToElement } from "../lib/scroll-controller";

// § 02's index — the readout rail, cols 1–4. Fixed: it never moves and never
// drifts.
//
// Split out of skills.tsx ahead of the § 02 merge. Pure move.
//
// `shown` outlives `tool` by one exit. A conditionally rendered card unmounts
// the instant the selection goes null, leaving nothing for the 180ms fade to
// animate — the same `shown` vs `open` split § 04's plate already uses. The
// component renders `shown` and reads `tool` only to know whether the card is
// on its way out; the timer that clears `shown` lives with the selection state.

export default function SkillsReadout({
  shown,
  tool,
}: {
  shown: Tool | null;
  tool: Tool | null;
}) {
  return (
    <div className="sk-readout" aria-live="polite">
      {shown === null ? (
        <>
          <p className="sk-readout-rest font-mono text-mono-label uppercase">
            select a node
          </p>
          <p className="sk-readout-count font-mono text-mono-micro uppercase">
            {TOOLS.length} tools · {CLUSTERS.length} domains
          </p>
        </>
      ) : (
        // Keyed on the tool, so switching nodes remounts and the wipe replays
        // from the start instead of interpolating mid-transition.
        <div
          className="sk-readout-card"
          key={shown.name}
          data-out={tool === null ? "" : undefined}
        >
          <p className="sk-readout-name font-display font-medium">{shown.name}</p>
          <p className="sk-readout-cat font-mono text-mono-label uppercase">
            {CLUSTER_LABEL.get(shown.cluster)}
          </p>
          <span aria-hidden="true" className="sk-readout-rule" />
          <p className="sk-readout-ev font-display">{shown.evidence}</p>
          {/* The fourth line is the linkage in words. The two contexts that are
              § 02 rows link into the register; the transit API and coursework do
              not, because there is nothing on this page for them to land on and
              a link that scrolls nowhere is worse than no link. */}
          <p className="sk-readout-ctx font-mono">
            appears in —{" "}
            {shown.contexts.map((c, k) => {
              const href = CONTEXT_HREF.get(c);
              const label = CONTEXT_LABEL.get(c);
              return (
                <span key={c}>
                  {k > 0 && ", "}
                  {href ? (
                    <a
                      href={href}
                      className="sk-readout-link"
                      data-cursor="pen-down"
                      onClick={(e) => {
                        const el = document.querySelector(href);
                        if (!el) return;
                        e.preventDefault();
                        scrollToElement(el as HTMLElement);
                      }}
                    >
                      {label}
                    </a>
                  ) : (
                    label
                  )}
                </span>
              );
            })}
          </p>
        </div>
      )}
    </div>
  );
}
