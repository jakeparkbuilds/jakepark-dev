"use client";

import { useEffect, useRef } from "react";
import { registerSection } from "../lib/scroll-controller";
import { useReducedMotion } from "../lib/use-reduced-motion";

// The one proof-of-concept motion effect: as the owning <section> crosses
// the viewport, this mark + label translate horizontally by up to -24px.
// Lateral motion against vertical scroll — nothing else on the page moves.
const MAX_TRANSLATE_PX = 24;

export default function SectionMark({ mark, label }: { mark: string; label: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const el = ref.current;
    const section = el?.closest("section");
    if (!el || !section) return;

    return registerSection(section, (progress) => {
      el.style.transform = `translateX(${-MAX_TRANSLATE_PX * progress}px)`;
    });
  }, [reducedMotion]);

  return (
    <p
      ref={ref}
      className="font-mono text-mono-label-sm uppercase text-label sm:text-mono-label"
    >
      {mark} / {label}
    </p>
  );
}
