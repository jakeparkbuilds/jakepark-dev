"use client";

import { useEffect, useRef, useState } from "react";
import { NAV_SECTIONS } from "../lib/sections";
import { scrollToElement } from "../lib/scroll-controller";

export default function Nav() {
  const [activeId, setActiveId] = useState<string>(NAV_SECTIONS[0].id);
  // The nav is fixed and passes over § 03's ink plate, where its ink labels
  // collapse to 3.02:1 and the active one to 1.12:1 — invisible. It inverts
  // with the ground, the same way the cursor and the ink trail do.
  const [inverted, setInverted] = useState(false);
  // The name is hidden while the hero is on screen — the hero already says it,
  // at display scale. It appears once the hero is gone and the visitor could
  // otherwise have forgotten whose site this is.
  const [pastHero, setPastHero] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) return;
    // Fires when the hero's BOTTOM edge crosses the top of the viewport, which
    // is exactly "the hero has scrolled away" — an observer, not a scroll
    // subscriber, so it costs nothing once the page settles.
    const io = new IntersectionObserver(([e]) => setPastHero(!e.isIntersecting), {
      threshold: 0,
    });
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const plate = document.getElementById("experience");
    const nav = navRef.current;
    if (!plate || !nav) return;
    let io: IntersectionObserver | null = null;
    // An observer whose root is shrunk to the nav's own band, so it fires
    // exactly when the plate is behind the nav. IntersectionObserver rather
    // than a scroll subscriber: this must cost nothing once the page settles.
    const arm = () => {
      io?.disconnect();
      const r = nav.getBoundingClientRect();
      io = new IntersectionObserver(([e]) => setInverted(e.isIntersecting), {
        rootMargin: `-${Math.max(0, r.top)}px 0px -${Math.max(
          0,
          window.innerHeight - r.bottom
        )}px 0px`,
        threshold: 0,
      });
      io.observe(plate);
    };
    arm();
    window.addEventListener("resize", arm);
    return () => {
      io?.disconnect();
      window.removeEventListener("resize", arm);
    };
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
      data-inverted={inverted ? "" : undefined}
      className="fixed right-[theme(spacing.section)] top-[theme(spacing.section)] z-10 hidden flex-col items-end gap-3 md:flex"
    >
      {/* A name, not a nav label: sentence-cased as written, in the display
          face, never uppercased and never mono. It sits 28px above ME on the
          same right edge, and it is a real button because it does something —
          it returns to the top. Opacity only; it never moves. */}
      <button
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

      {NAV_SECTIONS.map(({ id, label }) => {
        const isActive = id === activeId;
        return (
          <a
            key={id}
            href={`#${id}`}
            onClick={(event) => handleClick(event, id)}
            aria-current={isActive ? "true" : undefined}
            className={`flex items-center gap-2 font-mono text-mono-micro uppercase transition-colors duration-150 ${
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
