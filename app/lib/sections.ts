// Single source of truth for section order/ids/labels.
// Shared by the page (renders each <Section>) and the nav (scroll-spy + jump links).
//
// FIVE sections, and there were seven (CLAUDE.md § 5). The numbers are derived
// from this array's order, so a reorder is one edit here and nothing else — the
// page maps over it and the nav maps over it. Never write a section number down
// anywhere else.
export const CONTENT_SECTIONS = [
  { number: "02", id: "work", label: "work" },
  { number: "03", id: "experience", label: "experience" },
  { number: "04", id: "background", label: "background" },
  { number: "05", id: "connect", label: "connect" },
] as const;

export const NAV_SECTIONS = [
  { id: "hero", label: "me" },
  ...CONTENT_SECTIONS.map(({ id, label }) => ({ id, label })),
] as const;

/** Anchors the site used to publish, mapped to the section that absorbed them.
    projects + skills merged into work; about + education merged into
    background. A link into one of these lands on a page with no such element
    and would otherwise sit at the top with no explanation, so Nav remaps the
    hash on arrival — silently, with replaceState, so no history entry is
    created and the back button still returns where the visitor came from. */
export const LEGACY_ANCHORS: Record<string, string> = {
  projects: "work",
  skills: "work",
  about: "background",
  education: "background",
};
