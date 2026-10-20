"use client";

import { useEffect, useRef, useState } from "react";
import { accessPath } from "@/content/profile";
import { groundAt, type Ground } from "@/lib/ground";

/** The page's navigation: the authorization chain, lit as the visitor passes each step. */
export function AccessPathRail() {
  const rail = useRef<HTMLElement>(null);
  const [current, setCurrent] = useState(-1);
  const [visible, setVisible] = useState(false);
  const [ground, setGround] = useState<Ground>("dark");

  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const vh = innerHeight;
      const hero = document.getElementById("top");
      setVisible(!!hero && hero.getBoundingClientRect().bottom < vh * 0.55);

      let idx = -1;
      accessPath.forEach((s, i) => {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top < vh * 0.45) idx = i;
      });
      setCurrent(idx);

      // Re-ink the rail for whichever ground sits under it.
      const r = rail.current?.getBoundingClientRect();
      const probeY = r ? r.top + r.height / 2 : vh / 2;
      setGround(groundAt(probeY, rail.current));
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    addEventListener("scroll", kick, { passive: true });
    addEventListener("resize", kick, { passive: true });
    return () => { cancelAnimationFrame(raf); removeEventListener("scroll", kick); removeEventListener("resize", kick); };
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
