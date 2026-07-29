"use client";

// Two independent things roll on the hero: the display name's per-character
// glyph roll, and the discipline slot's whole-phrase roll. They are separately
// scheduled — the name on a clustered random cadence, the discipline on a fixed
// 2800ms hold — so nothing stops them landing on the same frame, and when they
// do the hero reads as two unrelated animations rather than one voice.
//
// This is the one place that knows about both. It enforces a single rule: no
// roll may start within QUIET_MS of a roll of the OTHER kind. Same-kind rolls
// are unrestricted, because a name cluster deliberately overlaps itself.
//
// Deliberately not a queue and not an event emitter. Each caller already owns a
// schedule it can adjust, so this only has to answer one question — may I go
// now, and if not, how long until I may — and record what happened.

export const QUIET_MS = 400;

export type RollKind = "name" | "discipline";

const lastAt: Record<RollKind, number> = { name: -Infinity, discipline: -Infinity };

const other = (kind: RollKind): RollKind => (kind === "name" ? "discipline" : "name");

/**
 * Milliseconds this kind must wait before it may roll: 0 when the floor is
 * clear. Callers defer by exactly this much rather than dropping the event, so
 * a collision delays a roll instead of losing it.
 */
export function waitFor(kind: RollKind): number {
  const since = performance.now() - lastAt[other(kind)];
  return since >= QUIET_MS ? 0 : Math.ceil(QUIET_MS - since);
}

/** Record that a roll of this kind started now. */
export function didRoll(kind: RollKind) {
  lastAt[kind] = performance.now();
}

/**
 * Both hero roll systems pause when the hero leaves the viewport, and neither
 * should be held off by a stale timestamp when it comes back.
 */
export function resetSchedule() {
  lastAt.name = -Infinity;
  lastAt.discipline = -Infinity;
}
