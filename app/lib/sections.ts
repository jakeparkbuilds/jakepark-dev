// Single source of truth for section order/ids/labels, per docs/motion-spec.md.
// Shared by the page (renders each <Section>) and the nav (scroll-spy + jump links).

export const CONTENT_SECTIONS = [
  { number: "02", id: "about", label: "about" },
  { number: "03", id: "experience", label: "experience" },
  { number: "04", id: "projects", label: "projects" },
  { number: "05", id: "signal", label: "signal" },
  { number: "06", id: "skills", label: "skills" },
  { number: "07", id: "education", label: "education" },
  { number: "08", id: "connect", label: "connect" },
] as const;

export const NAV_SECTIONS = [
  { id: "hero", label: "hero" },
  ...CONTENT_SECTIONS.map(({ id, label }) => ({ id, label })),
] as const;
