"use client";

import { useEffect, useRef, useState } from "react";
import { profile } from "@/content/profile";
import { groundAt, type Ground } from "@/lib/ground";

/** Fixed header that re-inks for the chapter ground beneath it. */
export function SiteHeader() {
  const ref = useRef<HTMLElement>(null);
  const [ground, setGround] = useState<Ground>("dark");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const h = ref.current?.offsetHeight ?? 64;
      setGround(groundAt(h / 2, ref.current));
      const hero = document.getElementById("top");
      setScrolled(!!hero && hero.getBoundingClientRect().bottom < h);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    addEventListener("scroll", kick, { passive: true });
    addEventListener("resize", kick, { passive: true });
    return () => { cancelAnimationFrame(raf); removeEventListener("scroll", kick); removeEventListener("resize", kick); };
  }, []);

  return (
    <header ref={ref} className="site-header" data-ground={ground} data-scrolled={scrolled ? "" : undefined}>
      <a className="wordmark" href="#top">Cameron Johnson</a>
      <nav aria-label="Primary">
        <a className="hide-sm" href="#privilege">Case files</a>
        <a className="hide-sm" href="#lounge">The Access Lounge</a>
        <a className="hide-sm" href={profile.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
        <a className="btn btn--ghost" href="#contact">Contact</a>
      </nav>
    </header>
  );
}
