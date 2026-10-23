"use client";

import { useEffect } from "react";

/**
  Gentle entrances for the lightweight page: blocks marked `data-lr` that start below the fold
  fade up as they arrive. Blocks already on screen are never hidden, nothing is hidden before
  hydration (so a failed script leaves everything visible), and reduced motion skips it entirely.
  One IntersectionObserver, opacity and transform only.
*/
export function LiteReveal() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.setAttribute("data-lr", "in"); io.unobserve(e.target); }
    }, { rootMargin: "0px 0px -8% 0px" });
    for (const el of document.querySelectorAll<HTMLElement>("[data-lr]")) {
      if (el.getBoundingClientRect().top < innerHeight) continue;
      el.setAttribute("data-lr", "wait");
      io.observe(el);
    }
    return () => io.disconnect();
  }, []);
  return null;
}
