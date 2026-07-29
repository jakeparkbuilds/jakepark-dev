"use client";

import { useEffect, useRef, useState } from "react";
import { NAV_SECTIONS } from "../lib/sections";
import { scrollToElement, subscribeGlobal } from "../lib/scroll-controller";

export default function Nav() {
  const [activeId, setActiveId] = useState<string>(NAV_SECTIONS[0].id);
  // The name is hidden while the hero is on screen — the hero already says it,
  // at display scale.
  const [pastHero, setPastHero] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const nameRef = useRef<HTMLButtonElement | null>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) return;
    const io = new IntersectionObserver(([e]) => setPastHero(!e.isIntersecting), {
      threshold: 0,
    });
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  // ---- inversion, per element ----
  //
  // The nav is fixed and passes over § 03's ink plate, where its ink labels
  // collapse to 3.02:1 and the active one to 1.12:1 — invisible. It inverts
  // with the ground.
  //
  // EACH ELEMENT DECIDES FOR ITSELF, from what is directly behind IT. The
  // previous version flipped the whole nav on one observer keyed to the plate
  // crossing the nav's band, so every label — and the name at the top of the
  // column — turned light together, while the name was still sitting on paper
  // above the plate's edge. A fixed column is ~200px tall and the boundary
  // sweeps through it, so during the transition the list is legitimately part
  // ink and part paper. That is correct, and it is the only thing that is.
  //
  // Rides the shared Lenis loop; no second scroll listener. Every read happens
  // before any write, so a frame costs one layout pass, and an attribute is
  // only touched when its value actually changes.
  useEffect(() => {
    const plate = document.getElementById("experience");
    if (!plate) return;
    const els: HTMLElement[] = [nameRef.current, ...itemRefs.current].filter(
      (el): el is NonNullable<typeof el> => el !== null
    );
    if (els.length === 0) return;
    const state = els.map(() => false);
    const mids = els.map(() => 0);

    return subscribeGlobal(() => {
      const plateRect = plate.getBoundingClientRect();
      for (let i = 0; i < els.length; i++) {
        const r = els[i].getBoundingClientRect();
        mids[i] = r.top + r.height / 2;
      }
      for (let i = 0; i < els.length; i++) {
        const inv = mids[i] >= plateRect.top && mids[i] <= plateRect.bottom;
        if (inv === state[i]) continue;
        state[i] = inv;
        if (inv) els[i].setAttribute("data-inv", "");
        else els[i].removeAttribute("data-inv");
      }
    });
  }, []);

  useEffect(() => {
    const elements = NAV_SECTIONS.map(({ id }) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null
    );
    if (elements.length === 0) return;

    // A thin band at the vertical center of the viewport: whichever section
    // crosses it is "active". rootMargin shrinks the observed area to that
    // band instead of the full viewport.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    const el = document.getElementById(id);
    if (el) scrollToElement(el);
  };

  return (
    <nav
      ref={navRef}
      aria-label="section navigation"
      className="fixed right-[theme(spacing.section)] top-[theme(spacing.section)] z-10 hidden flex-col items-end gap-3 md:flex"
    >
      {/* A name, not a nav label: sentence-cased as written, in the display
          face, never uppercased and never mono. It sits 28px above ME on the
          same right edge, and it is a real button because it does something —
          it returns to the top. Opacity only; it never moves. */}
      <button
        ref={nameRef}
        type="button"
        onClick={() => {
          const hero = document.getElementById("hero");
          if (hero) scrollToElement(hero);
        }}
        aria-hidden={pastHero ? undefined : "true"}
        tabIndex={pastHero ? undefined : -1}
        data-shown={pastHero ? "" : undefined}
        className="nav-name font-display"
      >
        Jake Park
      </button>

      {NAV_SECTIONS.map(({ id, label }, i) => {
        const isActive = id === activeId;
        return (
          <a
            key={id}
            ref={(node) => {
              itemRefs.current[i] = node;
            }}
            href={`#${id}`}
            onClick={(event) => handleClick(event, id)}
            aria-current={isActive ? "true" : undefined}
            className={`flex items-center gap-2 font-mono text-mono-micro uppercase ${
              isActive ? "nav-active" : "nav-idle"
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-[0.5px] w-3 transition-colors duration-150 ${
                isActive ? "bg-accent" : "bg-transparent"
              }`}
            />
            {label}
          </a>
        );
      })}
    </nav>
  );
}
