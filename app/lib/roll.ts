"use client";

// The roll, as a mechanism, shared by the two places that use it: the hero
// name's per-character glyph roll and the discipline slot's whole-phrase roll.
//
// The mechanism is always the same three things, and this module is the only
// definition of them: a clip box of an exact integer size, a stack of identical
// or successive copies inside it, and a transform of exactly one box dimension
// so a copy enters one edge as another leaves the opposite one. Nothing fades,
// nothing resizes, and nothing ever renders outside the box.
//
// What the two callers do NOT share is the cadence and the contents — the name
// rolls a character onto ITSELF on a clustered random schedule, the discipline
// rolls one phrase onto the NEXT on a fixed hold. Those live with their
// components. Only the curve, the duration and the animate call are here, so
// that "the discipline roll reads as native" is structural rather than two sets
// of numbers that have to be kept in agreement.

// Something viscous being pulled: a fast initial pull, then a long slow drag
// into place. The curve front-loads almost all the distance into the first ~25%
// of the time and spends the remaining 75% on the last sliver. The extreme
// asymmetry IS the effect — a "smoother" curve reads as a flip. See CLAUDE.md
// § 7 (`settle`).
export const ROLL_MS = 1500;
export const ROLL_EASE = "cubic-bezier(0.12, 0.9, 0.08, 1)";

/**
 * Run one roll on a stack. `start` and `end` are full transform strings, so the
 * caller owns the axis and the sign; this owns the curve and the duration.
 *
 * WAAPI rather than a rAF loop on purpose: the animation is compositor-only and
 * ends by itself, so nothing persistent is created and there is no timer left
 * pending when it finishes.
 */
export function rollStack(
  inner: HTMLElement,
  start: string,
  end: string,
  onFinish: () => void
): Animation {
  const anim = inner.animate([{ transform: start }, { transform: end }], {
    duration: ROLL_MS,
    easing: ROLL_EASE,
    fill: "none",
  });
  anim.onfinish = onFinish;
  anim.oncancel = onFinish;
  return anim;
}
