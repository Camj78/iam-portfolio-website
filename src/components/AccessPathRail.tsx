"use client";

import { useEffect, useRef, useState } from "react";
import { accessPath } from "@/content/profile";
import { docBox, groundAt, type Ground } from "@/lib/ground";

/** The page's navigation: the authorization chain, lit as the visitor passes each step. */
export function AccessPathRail() {
  const rail = useRef<HTMLElement>(null);
  const [current, setCurrent] = useState(-1);
  const [visible, setVisible] = useState(false);
  const [ground, setGround] = useState<Ground>("dark");

  useEffect(() => {
    let raf = 0;
    // The rail is fixed, so its probe point only moves on resize. Section
    // positions come from the cached document geometry (lib/ground): no
    // layout reads on the scroll path.
    let probeY = -1;
    const read = () => {
      raf = 0;
      const vh = innerHeight, y = scrollY;
      // Hidden while the pinned hero owns the screen; it arrives as the pin lets go.
      const hero = document.getElementById("top");
      setVisible(!!hero && docBox(hero).bottom - y < vh * 0.55);

      let idx = -1;
      accessPath.forEach((s, i) => {
        const el = document.getElementById(s.id);
        if (el && docBox(el).top - y < vh * 0.45) idx = i;
      });
      setCurrent(idx);

      // Re-ink the rail for whichever ground sits under it.
      if (probeY < 0) {
        const r = rail.current?.getBoundingClientRect();
        probeY = r ? r.top + r.height / 2 : vh / 2;
      }
      setGround(groundAt(probeY, rail.current));
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(read); };
    const onResize = () => { probeY = -1; kick(); };
    read();
    addEventListener("scroll", kick, { passive: true });
    addEventListener("resize", onResize, { passive: true });
    return () => { cancelAnimationFrame(raf); removeEventListener("scroll", kick); removeEventListener("resize", onResize); };
  }, []);

  return (
    <nav ref={rail} className="rail" aria-label="Access path" data-visible={visible ? "" : undefined} data-ground={ground}>
      <ol>
        {accessPath.map((s, i) => (
          <li key={s.id}>
            <a href={`#${s.id}`} aria-current={i === current ? "step" : undefined} data-passed={i < current ? "" : undefined}
              tabIndex={visible ? undefined : -1}>
              <span className="rail__label">{s.step}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
