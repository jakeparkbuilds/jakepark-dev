// Single source of truth for section order/ids/labels, per docs/motion-spec.md.
// Shared by the page (renders each <Section>) and the nav (scroll-spy + jump links).

// MID-RESTRUCTURE. The target is five sections — 01 hero · 02 work ·
// 03 experience · 04 background · 05 connect (CLAUDE.md § 5) — and the reorder
// and renumber land together in Phase 4. Until then this list stays sequential
// and in document order at every step, so the page is never left with a gap in
// its numbering or a section missing from the nav.
export const CONTENT_SECTIONS = [
  { number: "02", id: "background", label: "background" },
  { number: "03", id: "experience", label: "experience" },
  { number: "04", id: "work", label: "work" },
  { number: "05", id: "connect", label: "connect" },
] as const;

export const NAV_SECTIONS = [
  { id: "hero", label: "me" },
  ...CONTENT_SECTIONS.map(({ id, label }) => ({ id, label })),
] as const;
