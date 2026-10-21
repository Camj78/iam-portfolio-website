"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
  A card whose CSS idle float (globals.css, .cert__card) runs only while it is
  near the viewport. An infinite animation keeps the compositor producing frames
  even off screen, which cost the pinned acts above about 5 fps on an integrated
  GPU, so the animation starts paused and this flips it on and off.
*/
export function FloatCard({ className, children }: { className: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const io = new IntersectionObserver(([e]) => el.toggleAttribute("data-in-view", e.isIntersecting), { rootMargin: "25% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={className}>{children}</div>;
}
