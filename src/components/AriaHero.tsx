"use client";

import { useEffect, useRef } from "react";
import { profile, accessPath } from "@/content/profile";
import { createFramePlayer, type FramePlayer } from "@/lib/frame-player";

/*
  A.R.I.A.'s stage — the signature move.

  Scroll is the playhead. A.R.I.A. looks at the name, turns to meet the visitor
  as the specialization lands, then turns and steps aside to present the access
  path, which appears where he is looking. Reverse scroll reverses all of it.

  Milestone 1 prototype: the frame list is the three approved stills, blended
  with a narrow premultiplied dissolve. The Kling frame sequence drops into the
  same player later (FRAMES only), with a linear blend between adjacent frames.

  Without JS, or with prefers-reduced-motion, the section stays a complete
  static composition (front pose, name, specialization, actions) with no pin.
*/

const POSES = ["left", "front", "right"] as const;
const FRAMES = {
  desktop: POSES.map((p) => `/aria/optimized/aria-${p}-760.webp`),
  mobile: POSES.map((p) => `/aria/optimized/aria-${p}-480.webp`),
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function AriaHero() {
  const root = useRef<HTMLElement>(null);
  const wall = useRef<HTMLDivElement>(null);
  const name = useRef<HTMLHeadingElement>(null);
  const role = useRef<HTMLParagraphElement>(null);
  const table = useRef<HTMLDivElement>(null);
  const aria = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const desk = useRef<HTMLDivElement>(null);
  const haze = useRef<HTMLDivElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const path = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = root.current!;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const small = matchMedia("(max-width: 860px)");
    section.setAttribute("data-live", "");

    let player: FramePlayer | null = null;
    let target = 0, current = -1, raf = 0, dead = false;
    let vw = innerWidth, vh = innerHeight, ariaW = 0, top = 0, travel = 1;

    const measure = () => {
      vw = innerWidth; vh = innerHeight;
      ariaW = aria.current!.offsetWidth;
      const r = section.getBoundingClientRect();
      top = r.top + scrollY;
      travel = Math.max(1, section.offsetHeight - vh);
      player?.resize();
    };

    const load = () => {
      player?.dispose();
      aria.current!.removeAttribute("data-ready");
      player = createFramePlayer(canvas.current!, small.matches ? FRAMES.mobile : FRAMES.desktop, {
        // Stills: hold each pose, dissolve only through the middle of a turn.
        dissolve: [0.32, 0.68],
        // The still keeps the stage until the canvas has actually painted.
        onFirstDraw: () => { if (!dead) aria.current!.setAttribute("data-ready", ""); },
        onReady: () => { if (dead) return; current = -1; kick(); },
      });
    };

    const apply = (p: number) => {
      const mobile = small.matches;
      const turn1 = ease(seg(p, 0.12, 0.4));
      const turn2 = ease(seg(p, 0.56, 0.8));

      // A.R.I.A.: pose and position. Centre in vw.
      const cx = mobile
        ? lerp(lerp(57, 50, turn1), 44, turn2)
        : lerp(lerp(70, 56, turn1), 30, turn2);
      const scale = 1 + 0.05 * turn1 - 0.03 * turn2;
      const x = (cx / 100) * vw - ariaW / 2;
      aria.current!.style.transform = `translate3d(${x.toFixed(1)}px,0,0) scale(${scale.toFixed(4)})`;
      player?.draw(turn1 + turn2);

      // Camera truck: planes move at their depth's rate. Desk = contact plane.
      const dx = ((cx - (mobile ? 57 : 70)) / 100) * vw;
      wall.current!.style.transform = `translate3d(${(dx * 0.22).toFixed(1)}px,0,0)`;
      desk.current!.style.setProperty("--desk-x", `${dx.toFixed(1)}px`);
      table.current!.style.setProperty("--table-light", `${(cx * 0.8 + 10).toFixed(1)}%`);

      // The name recedes behind him as he turns away from it. It is fully gone
      // before the specialization arrives, so the two never overlap.
      const out = seg(p, 0.14, 0.28);
      name.current!.style.opacity = String(1 - out);
      name.current!.style.transform =
        `translate3d(${(dx * 0.5).toFixed(1)}px, ${(-out * vh * 0.04).toFixed(1)}px, 0) scale(${(1 - out * 0.06).toFixed(4)})`;
      role.current!.style.opacity = String(1 - seg(p, 0.08, 0.2));
      role.current!.style.transform = `translate3d(${(dx * 0.5).toFixed(1)}px,0,0)`;

      // Specialization while he faces the visitor.
      const iIn = seg(p, 0.3, 0.38), iOut = seg(p, 0.52, 0.58);
      intro.current!.style.opacity = String(iIn * (1 - iOut));
      intro.current!.style.transform = `translate3d(0, ${((1 - iIn) * 22 - iOut * 22).toFixed(1)}px, 0)`;
      intro.current!.style.pointerEvents = iIn * (1 - iOut) > 0.5 ? "auto" : "none";

      // The access path, where he is looking.
      const aIn = ease(seg(p, 0.76, 0.88));
      path.current!.style.opacity = String(aIn);
      path.current!.style.transform = `translate3d(${((1 - aIn) * (mobile ? 0 : 36)).toFixed(1)}px, ${((1 - aIn) * (mobile ? 16 : 0)).toFixed(1)}px, 0)`;
      path.current!.style.pointerEvents = aIn > 0.5 ? "auto" : "none";

      haze.current!.style.opacity = String(0.55 + 0.45 * turn1 - 0.25 * turn2);
      section.style.setProperty("--hero-p", p.toFixed(4));
    };

    const frame = () => {
      raf = 0;
      if (dead) return;
      const next = current < 0 ? target : current + (target - current) * 0.2;
      const settled = Math.abs(next - target) < 0.0004;
      current = settled ? target : next;
      apply(current);
      if (!settled) raf = requestAnimationFrame(frame);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const onScroll = () => { target = clamp01((scrollY - top) / travel); kick(); };
    const onResize = () => { measure(); onScroll(); };
    const onMedia = () => { load(); onResize(); };

    // Keyboard focus on hidden copy: bring the scroll to where it is visible.
    const onFocus = (e: FocusEvent) => {
      const el = e.target as Node;
      const at = intro.current!.contains(el) ? 0.46 : path.current!.contains(el) ? 0.92 : null;
      if (at === null) return;
      window.scrollTo({ top: top + at * travel, behavior: "instant" });
    };

    measure();
    load();
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onResize, { passive: true });
    small.addEventListener("change", onMedia);
    section.addEventListener("focusin", onFocus);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onResize);
      small.removeEventListener("change", onMedia);
      section.removeEventListener("focusin", onFocus);
      player?.dispose();
      section.removeAttribute("data-live");
    };
  }, []);

  return (
    <section ref={root} className="hero" id="top" aria-labelledby="hero-name">
      <div className="hero__stage">
        <div ref={wall} className="hero__wall" aria-hidden="true" />

        <h1 ref={name} id="hero-name" className="hero__name display">
          <span>Cameron</span>
          <span>Johnson</span>
        </h1>

        <p ref={role} className="hero__role">
          <strong>Identity &amp; Access Management.</strong> Microsoft Entra ID case studies, with the evidence.
        </p>

        <div ref={table} className="hero__tabletop" aria-hidden="true" />

        <div ref={aria} className="hero__aria">
          <div className="hero__shadow" aria-hidden="true" />
          {/* Static fallback: the approved stills, untouched. */}
          <img data-pose="front" src={FRAMES.desktop[1]} srcSet={`${FRAMES.mobile[1]} 480w, ${FRAMES.desktop[1]} 760w`}
            sizes="(max-width: 860px) 45vw, 42vh" width={760} height={941}
            alt="A.R.I.A., a felt puppet character in a tan suit, white shirt and green striped tie, smiling at the camera."
            fetchPriority="high" />
          <canvas ref={canvas} aria-hidden="true" />
        </div>

        <div ref={desk} className="hero__desk" aria-hidden="true" />
        <div ref={haze} className="hero__haze" aria-hidden="true" />

        <div ref={intro} className="hero__intro">
          <p className="display" role="doc-subtitle">Identity &amp; Access Management</p>
          <p className="lede">
            Hands-on Microsoft Entra ID work in privileged access, joiner-mover-leaver lifecycle,
            RBAC and access reviews, documented with the evidence.
          </p>
          <div className="hero__actions">
            <a className="btn btn--solid" href="#privilege">View case files</a>
            <a className="btn btn--ghost" href={profile.resume} download>
              Resumé (PDF)
            </a>
          </div>
        </div>

        <div ref={path} className="hero__path">
          <h2 className="mono">The access path</h2>
          <ol>
            {accessPath.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>
                  <span className="display">{s.step}</span>
                  <span className="mono">{s.label}</span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
