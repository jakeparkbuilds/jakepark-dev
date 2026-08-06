"use client";

import { useEffect, useRef } from "react";
import { registerMagnet } from "../lib/magnet";
import { useReducedMotion } from "../lib/use-reduced-motion";

// Wraps one § 07 link. The wrapper moves, never the anchor itself, so the
// anchor's own hover transition (colour, the drawn underline) and the magnet's
// transform never share a `transition` declaration and cannot clobber one
// another.
//
// Renders as a plain inline-block on the server and on touch: the magnet is
// mounted by an effect, so a coarse pointer or reduced motion simply never
// registers and the markup is identical either way.
export default function Magnet({
  children,
  divisor = 3,
  field = 150,
  max,
  className,
}: {
  children: React.ReactNode;
  divisor?: number;
  field?: number;
  /** Travel ceiling in px — see MagnetEntry. */
  max?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    // Pointer-fine only. On a touch screen there is no hover state to lead the
    // finger toward, and a link that moves under a tap is a bug.
    if (!window.matchMedia("(pointer: fine) and (hover: hover)").matches) return;
    return registerMagnet({ el, divisor, field, max });
  }, [reduced, divisor, field, max]);

  return (
    <span ref={ref} className={className} style={{ display: "inline-block" }}>
      {children}
    </span>
  );
}
