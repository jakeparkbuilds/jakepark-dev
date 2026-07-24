"use client";

import { useEffect, useState } from "react";
import { NAV_SECTIONS } from "../lib/sections";
import { scrollToElement } from "../lib/scroll-controller";

export default function Nav() {
  const [activeId, setActiveId] = useState<string>(NAV_SECTIONS[0].id);

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
      aria-label="section navigation"
      className="fixed right-[theme(spacing.section)] top-[theme(spacing.section)] z-10 hidden flex-col items-end gap-3 md:flex"
    >
      {NAV_SECTIONS.map(({ id, label }) => {
        const isActive = id === activeId;
        return (
          <a
            key={id}
            href={`#${id}`}
            onClick={(event) => handleClick(event, id)}
            aria-current={isActive ? "true" : undefined}
            className={`flex items-center gap-2 font-mono text-mono-micro uppercase transition-colors duration-150 ${
              isActive ? "text-near-black" : "text-label hover:text-body"
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
