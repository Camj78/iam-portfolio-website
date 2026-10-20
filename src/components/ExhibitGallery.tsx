"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Exhibit } from "@/content/cases";

/** Evidence screenshots. Click opens a full-size lightbox; Esc or the button closes it. */
export function ExhibitGallery({ exhibits, caseNo }: { exhibits: Exhibit[]; caseNo: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (open === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % exhibits.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + exhibits.length) % exhibits.length));
      if (e.key === "Tab") { e.preventDefault(); closeBtn.current?.focus(); }
    };
    addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; removeEventListener("keydown", onKey); opener.current?.focus(); };
  }, [open, exhibits.length]);

  const ex = open === null ? null : exhibits[open];

  return (
    <>
      <ul className="exhibits">
        {exhibits.map((e, i) => (
          <li key={e.src} className="exhibit">
            <button type="button" onClick={(ev) => { opener.current = ev.currentTarget; setOpen(i); }}
              aria-label={`Open exhibit ${caseNo}.${i + 1}: ${e.caption}`}>
              <figure>
                <div className="frame">
                  <img src={e.src} width={e.width} height={e.height} alt={e.alt} loading="lazy" decoding="async" />
                </div>
                <figcaption>
                  <span>{e.caption}</span>
                  <span className="mono">Exhibit {caseNo}.{i + 1}</span>
                </figcaption>
              </figure>
            </button>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {ex && (
          <motion.div className="lightbox" role="dialog" aria-modal="true" aria-label={ex.caption}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2, ease: [0.23, 1, 0.32, 1] }}
            onClick={(e) => { if (e.target === e.currentTarget) setOpen(null); }}>
            <motion.figure initial={{ opacity: 0, scale: reduce ? 1 : 0.97 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: reduce ? 1 : 0.98 }} transition={{ duration: reduce ? 0 : 0.22, ease: [0.23, 1, 0.32, 1] }}>
              <img src={ex.src} width={ex.width} height={ex.height} alt={ex.alt} />
              <figcaption>
                <span>{ex.caption}</span>
                <span className="mono">Exhibit {caseNo}.{(open ?? 0) + 1} of {exhibits.length} · arrow keys to browse</span>
              </figcaption>
            </motion.figure>
            <button ref={closeBtn} type="button" className="btn btn--ghost" onClick={() => setOpen(null)}>Close</button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
