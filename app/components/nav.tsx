"use client";

import { useEffect, useRef, useState } from "react";
import { LEGACY_ANCHORS, NAV_SECTIONS } from "../lib/sections";
import { scrollToElement, subscribeGlobal } from "../lib/scroll-controller";

export default function Nav() {
  const [activeId, setActiveId] = useState<string>(NAV_SECTIONS[0].id);
  // The name is hidden while the hero is on screen — the hero already says it,
  // at display scale. It appears once the hero is gone and the visitor could
  // otherwise have forgotten whose site this is.
  const navRef = useRef<HTMLElement | null>(null);
  const nameRef = useRef<HTMLButtonElement | null>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

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

    // GATED ON § 03 ITSELF. No nav element's midpoint can be inside the plate
    // unless the plate is on screen, so off screen this subscriber computes
    // "not inverted" every frame forever and pays 7 forced layouts to do it.
    // The gate hands that back; the reset below is what makes it safe, because
    // an element that was inverted on the last frame before the gate closed
    // would otherwise stay light over paper.
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
    }, plate);
  }, []);

  // The gate's own closing edge. IntersectionObserver fires as § 03 leaves, at
  // which moment the loop has already stopped calling the subscriber above —
  // so anything still carrying [data-inv] would hold paper-coloured type on a
  // paper ground until the plate came back. Clearing it here is the one write
  // the gate needs, and it costs nothing: no rect is read.
  useEffect(() => {
    const plate = document.getElementById("experience");
    if (!plate) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) return;
      for (const el of [nameRef.current, ...itemRefs.current]) {
        el?.removeAttribute("data-inv");
      }
    });
    io.observe(plate);
    return () => io.disconnect();
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

  // ---- the anchors the site used to publish ----
  //
  // #projects and #skills became #work; #about and #education became
  // #background. A link into one of those now lands on a page with no such
  // element, so the browser leaves it at the top with nothing to explain why.
  //
  // replaceState, not assignment: the remap must not create a history entry, or
  // the back button would return the visitor to the same dead hash. The scroll
  // is instant rather than smoothed — a deep link is a request to already BE
  // there, and it is what the browser would have done natively for a hash that
  // still resolved.
  useEffect(() => {
    const remap = () => {
      const next = LEGACY_ANCHORS[window.location.hash.slice(1)];
      if (!next) return;
      const el = document.getElementById(next);
      window.history.replaceState(null, "", `#${next}`);
      el?.scrollIntoView({ block: "start" });
    };
    remap();
    window.addEventListener("hashchange", remap);
    return () => window.removeEventListener("hashchange", remap);
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
          it returns to the top.

          It is visible from first paint and never fades out. On a first visit
          it arrives with the hero, second in the loader's stagger — the mono
          label, then the name — via the explicit order below rather than
          document order, which would otherwise put it first: <Nav /> precedes
          <Hero /> in the document. */}
      <button
        ref={nameRef}
        type="button"
        onClick={() => {
          const hero = document.getElementById("hero");
          if (hero) scrollToElement(hero);
        }}
        data-hero-reveal="1"
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
