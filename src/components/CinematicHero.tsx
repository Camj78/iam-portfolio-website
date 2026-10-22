"use client";

import { useEffect, useRef } from "react";
import { profile } from "@/content/profile";
import { createFramePlayer, type FramePlayer } from "@/lib/frame-player";
import motion from "@/content/aria-motion.json";
import { sceneNodes, sceneLinks, farNodes, CFG_PHASE1, type SceneNode } from "@/content/identity-scene";

/*
  The studio, and the push into the identity system.

  One pinned Scroll Craft act (data-sc-act="pin", span 5) owns the timeline.
  The engine pins the stage, computes progress p, and publishes it as --sc-p
  on the section. It also runs its own devices here: the kinetic claim and the
  door sign (data-sc-cue / data-sc-kinetic) and three dust planes
  (data-sc-parallax at different rates).

  This component is the choreographer. It reads that same p and maps it onto a
  simple camera: a truck to the right (planes shift by depth) and then a dolly
  through the opening wall (planes scale about one vanishing point by depth).

    0.00  A.R.I.A. looks left at the headline. Authored silence.
    0.12  Turns to the visitor; the camera trucks right, the headline recedes
          and is gone before the subject crosses it.
    0.38  Turns toward a slit of light in the wall.
    0.46  The wall opens. CFG's identity objects come into focus.
    0.50  Dolly through the opening. The desk and A.R.I.A. pass the lens.
    0.70  "Identity." arrives from in front of the camera and settles.
    0.80  The cluster's edges draw. Hold, then hand off to the next section.

  Reduced motion and no-JS: no pin. The stage becomes two static frames, the
  studio and the resolved identity scene, with every piece of copy visible.

  A.R.I.A.'s head turn: the three approved stills paint first (and stay the
  fallback on Save-Data or low-memory devices). After load, at idle, and only
  once the hero is near the viewport, the in-between frames of the Kling turn
  load behind them; the denser set takes over the next time the timeline sits
  on one of the three stills, which both sets share. Both are drawn from the
  same p, so scroll alone decides the frame.
*/

const POSES = ["left", "front", "right"] as const;
const FRAMES = {
  desktop: POSES.map((p) => `/aria/optimized/aria-${p}-760.webp`),
  mobile: POSES.map((p) => `/aria/optimized/aria-${p}-480.webp`),
};

/** Kling source frames in the shipped set (scripts/prepare-aria-motion.mjs). 74 is the front still, 120 the right. */
const MOTION_SET = "24";
const MOTION_SRC: number[] = motion.sets[MOTION_SET];
const FRONT_SRC = 74, LAST_SRC = motion.sourceFrames - 1;
const motionUrl = (i: number, w: number) => {
  const pose = (motion.anchors as Record<string, string>)[i];
  return pose ? `/aria/optimized/aria-${pose}-${w}.webp` : `/aria/motion/aria-${String(i).padStart(3, "0")}-${w}.webp`;
};
const MOTION = {
  desktop: MOTION_SRC.map((i) => motionUrl(i, 760)),
  mobile: MOTION_SRC.map((i) => motionUrl(i, 480)),
};
/** Steps across a skipped blink: the gaze jumps there, so they cut (a saccade) instead of dissolving. */
const CUT = new Set(motion.cuts.map(([a, b]) => `${a}-${b}`));
/** Fractional index into the set for a position on the Kling clip's own timeline. */
const motionIndex = (src: number) => {
  let j = 0;
  while (j < MOTION_SRC.length - 2 && MOTION_SRC[j + 1] <= src) j++;
  const t = clamp01((src - MOTION_SRC[j]) / (MOTION_SRC[j + 1] - MOTION_SRC[j]));
  return j + (CUT.has(`${MOTION_SRC[j]}-${MOTION_SRC[j + 1]}`) ? (t < 0.5 ? 0 : 1) : t);
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Per-breakpoint staging. Positions are % of the stage. */
const STAGING = {
  desktop: { ariaX0: 71, ariaX1: 37, door: 76, vpY: 44 },
  mobile: { ariaX0: 55, ariaX1: 45, door: 78, vpY: 40 },
};

/** How far each plane sits from the lens: drives truck parallax and dolly scale. */
const DEPTH = { rear: 0.1, wall: 0.25, head: 0.5, near: 1, fg: 1.8 };

const byId = Object.fromEntries(sceneNodes.map((n) => [n.id, n])) as Record<string, SceneNode>;

export function CinematicHero() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = root.current!;
    const st = stage.current!;
    const q = <T extends Element = HTMLElement>(s: string) => st.querySelector(s) as T;
    const qa = (s: string) => Array.from(st.querySelectorAll<HTMLElement>(s));

    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Static composition: take the act out of the engine before it mounts.
      section.removeAttribute("data-sc-act");
      return;
    }
    section.setAttribute("data-live", "");

    const small = matchMedia("(max-width: 860px)");
    const el = {
      rear: q(".cine__rear"),
      wall: q(".cine__wall"),
      panelL: q(".cine__panel--l"),
      panelR: q(".cine__panel--r"),
      slit: q(".cine__slit"),
      spill: q(".cine__spill"),
      row1: q(".cine__head-row--1"),
      row2: q(".cine__head-row--2"),
      head: q(".cine__head"),
      group: q(".cine__set"),
      aria: q(".cine__aria"),
      canvas: q<HTMLCanvasElement>(".cine__aria canvas"),
      fg: q(".cine__fg"),
      fgChips: qa(".cine__fg-chip"),
      open: q(".cine__open"),
      cta: q(".cine__cta"),
      title: q(".cine__id-title"),
      idCopy: q(".cine__id-copy"),
      claimWrap: q(".cine__claim"),
      key: q(".cine__key"),
      lines: [] as SVGLineElement[],
    };
    // Only the set for the current breakpoint is drawn; the other is display:none.
    const pickLines = () => { el.lines = Array.from(st.querySelectorAll<SVGLineElement>(small.matches ? ".cine__links--m .cine__link" : ".cine__links--d .cine__link")); };
    pickLines();
    const nodes = sceneNodes.map((n) => ({ n, el: st.querySelector<HTMLElement>(`[data-node="${n.id}"]`)! }));

    let player: FramePlayer | null = null;
    // The dense head-turn set, loading or loaded, until it takes over from the stills.
    let pending: FramePlayer | null = null, pendingReady = false, turning = false;
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
    const motionOk = !nav.connection?.saveData && (nav.deviceMemory ?? 8) >= 4;
    let target = 0, current = -1, raf = 0, dead = false;
    let W = 1, H = 1, ariaW = 0, top = 0, travel = 1;

    const measure = () => {
      W = st.clientWidth; H = st.clientHeight;
      ariaW = el.aria.offsetWidth;
      top = section.getBoundingClientRect().top + scrollY;
      travel = Math.max(1, section.offsetHeight - innerHeight);
      player?.resize();
    };

    const load = () => {
      player?.dispose();
      pending?.dispose();
      pending = null; pendingReady = false; turning = false;
      el.aria.removeAttribute("data-ready");
      el.aria.removeAttribute("data-motion");
      player = createFramePlayer(el.canvas, small.matches ? FRAMES.mobile : FRAMES.desktop, {
        dissolve: [0.32, 0.68],
        onFirstDraw: () => { if (!dead) el.aria.setAttribute("data-ready", ""); },
        onReady: () => { if (dead) return; current = -1; kick(); },
      });
      if (motionOk && near) whenIdle(loadMotion);
    };

    // Only once the hero is within a screen of the viewport: a visitor who lands
    // on #contact and never scrolls back up never downloads the in-between frames.
    let near = false;
    const nearHero = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      nearHero.disconnect();
      near = true;
      if (motionOk) whenIdle(loadMotion);
    }, { rootMargin: "100% 0px" });

    // After the page has loaded and the main thread is free, so the hero's first
    // paint and the rest of the page never wait on the in-between frames.
    const whenIdle = (fn: () => void) => {
      const go = () => ("requestIdleCallback" in window ? requestIdleCallback(fn, { timeout: 3000 }) : setTimeout(fn, 1500));
      if (document.readyState === "complete") go(); else addEventListener("load", go, { once: true });
    };
    const loadMotion = () => {
      if (dead || turning) return;
      pending?.dispose();
      pendingReady = false;
      const next: FramePlayer = createFramePlayer(el.canvas, small.matches ? MOTION.mobile : MOTION.desktop, {
        dissolve: [0, 1],
        priority: "low",
        onReady: () => { if (dead || pending !== next) return; pendingReady = true; kick(); },
      });
      pending = next;
    };

    const lineLength = (l: Element, mobile: boolean) => {
      const a = byId[l.getAttribute("data-from")!], b = byId[l.getAttribute("data-to")!];
      const A = mobile ? a.mEnd : a.end, B = mobile ? b.mEnd : b.end;
      return Math.hypot(((B.x - A.x) / 100) * W, ((B.y - A.y) / 100) * H);
    };

    const apply = (p: number) => {
      const mobile = small.matches;
      const S = mobile ? STAGING.mobile : STAGING.desktop;

      // --- the beats -------------------------------------------------------
      const t1 = ease(seg(p, 0.12, 0.32));      // turn to the visitor + camera truck
      const t2 = ease(seg(p, 0.38, 0.5));       // turn toward the light
      const slit = seg(p, 0.36, 0.47);
      const open = ease(seg(p, 0.46, 0.76));    // the wall parts
      // Dolly: a slow creep through the studio, then the push through the door.
      const dolly = 0.07 * seg(p, 0, 0.48) + 0.93 * ease(seg(p, 0.5, 0.82));

      // --- camera ----------------------------------------------------------
      // Truck: the camera moves right, so each plane slides left by its depth.
      const truckPct = (S.ariaX1 - S.ariaX0) * t1;            // negative, % of width
      const truck = (truckPct / 100) * W;                     // px for the subject plane
      const vpX = S.door + truckPct * DEPTH.wall;             // the door is on the wall plane
      // Dolly: a plane at closeness c scales by 1 / (1 - c * dolly) about the VP.
      const zoom = (c: number) => 1 / (1 - c * dolly);
      const origin = (shiftPx: number) =>
        `${(((vpX / 100) * W - shiftPx) / W * 100).toFixed(2)}% ${S.vpY}%`;

      // Rear: the identity space beyond the wall. Barely moves, grows a little.
      const rearShift = truck * DEPTH.rear;
      el.rear.style.transformOrigin = origin(rearShift);
      el.rear.style.transform = `translate3d(${rearShift.toFixed(1)}px,0,0) scale(${(0.86 + 0.14 * dolly).toFixed(4)})`;

      // Wall: slides at a quarter of the subject's rate, then parts and passes the lens.
      const wallShift = truck * DEPTH.wall;
      el.wall.style.transformOrigin = origin(wallShift);
      el.wall.style.transform = `translate3d(${wallShift.toFixed(1)}px,0,0) scale(${zoom(0.42).toFixed(4)})`;
      el.panelL.style.transform = `translate3d(${(-open * (S.door / 100) * W * 1.04).toFixed(1)}px,0,0)`;
      el.panelR.style.transform = `translate3d(${(open * (1 - S.door / 100) * W * 1.1).toFixed(1)}px,0,0)`;
      el.slit.style.opacity = (slit * (1 - clamp01(open * 6))).toFixed(3);
      el.spill.style.opacity = Math.min(1, slit * 0.45 + open * 0.8).toFixed(3);
      el.spill.style.transform = `translate3d(${wallShift.toFixed(1)}px,0,0)`;

      // Headline: between wall and subject, so it slides at half rate. It does
      // not part (a parted line stops reading); it recedes and is gone before
      // the subject crosses it.
      const recede = ease(seg(p, 0.1, 0.3));
      const headShift = truck * DEPTH.head;
      el.head.style.opacity = (1 - seg(p, 0.12, 0.22)).toFixed(3);
      const headT = `translate3d(${headShift.toFixed(1)}px,0,0) scale(${(1 + 0.06 * recede).toFixed(4)})`;
      el.row1.style.transform = headT;
      el.row2.style.transform = headT;

      // The set: A.R.I.A., tabletop and desk share one transform, so the hands
      // never slide off the desk. Closest plane: full truck, biggest dolly.
      const near = zoom(0.6);
      el.group.style.transformOrigin = origin(truck);
      el.group.style.transform = `translate3d(${truck.toFixed(1)}px,0,0) scale(${near.toFixed(4)})`;
      el.group.style.opacity = (1 - seg(p, 0.66, 0.78)).toFixed(3);
      el.aria.style.transform = `translate3d(${((S.ariaX0 / 100) * W - ariaW / 2).toFixed(1)}px,0,0)`;
      // Head turn. The stills ease between poses (t1, t2); the Kling clip carries
      // its own easing, so it runs on the same beats linearly: left → front over
      // 0.12–0.32, front → right over 0.38–0.50.
      const h1 = seg(p, 0.12, 0.32), h2 = seg(p, 0.38, 0.5);
      if (pendingReady && (h1 === 0 || (h1 === 1 && h2 === 0) || h2 === 1)) {
        // On a shared still: the switch cannot show.
        player?.dispose();
        player = pending; pending = null; pendingReady = false; turning = true;
        el.aria.setAttribute("data-motion", "");
      }
      player?.draw(turning ? motionIndex(h2 > 0 ? FRONT_SRC + (LAST_SRC - FRONT_SRC) * h2 : FRONT_SRC * h1) : t1 + t2);

      // Foreground: out-of-focus objects right at the lens. Fastest everything.
      const fgShift = truck * DEPTH.fg;
      el.fg.style.transformOrigin = origin(fgShift);
      el.fg.style.transform = `translate3d(${fgShift.toFixed(1)}px,0,0) scale(${zoom(0.86).toFixed(4)})`;
      el.fgChips.forEach((c, i) => {
        const rate = [0.55, 0.9, 0.7][i % 3];
        c.style.transform = `translate3d(0,${(-p * H * rate).toFixed(1)}px,0)`;
      });

      // Identity objects: drift by depth in the studio, then fly to the graph.
      nodes.forEach(({ n, el: node }, i) => {
        const a = mobile ? n.mStart : n.start;
        const b = mobile ? n.mEnd : n.end;
        // While floating: truck parallax by depth, plus the creep dolly.
        const s0 = 0.5 + n.depth * 0.35;
        const fx = a.x + truckPct * (0.15 + n.depth * 0.5);
        const fy = a.y;
        const z = 1 / (1 - n.depth * 0.6 * Math.min(dolly, 0.07));
        const hx = vpX + (fx - vpX) * z, hy = S.vpY + (fy - S.vpY) * z;
        const f = ease(seg(p, 0.5 + i * 0.022, 0.74 + i * 0.016));
        const x = lerp(hx, b.x, f), y = lerp(hy, b.y, f);
        const s = lerp(s0 * z, 1, f);
        const blur = lerp(3.2 - n.depth * 2.5, 0, easeOut(f));
        const o = lerp(0.42 + n.depth * 0.3, n.rest ?? 1, f);
        node.style.transform =
          `translate3d(${(((x - b.x) / 100) * W).toFixed(1)}px,${(((y - b.y) / 100) * H).toFixed(1)}px,0) scale(${s.toFixed(4)})`;
        node.style.opacity = o.toFixed(3);
        node.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none";
        node.toggleAttribute("data-landed", f > 0.98);
      });

      // Edges draw once the cluster has landed.
      el.lines.forEach((l, i) => {
        const d = easeOut(seg(p, 0.79 + i * 0.03, 0.88 + i * 0.03));
        if (l.classList.contains("cine__link--dashed")) { l.style.opacity = d.toFixed(3); return; }
        const len = lineLength(l, mobile);
        l.style.strokeDasharray = `${len.toFixed(1)} ${len.toFixed(1)}`;
        l.style.strokeDashoffset = ((1 - d) * len).toFixed(1);
      });

      // Copy. Opening lines leave before the subject crosses them.
      const out = seg(p, 0.05, 0.14);
      el.open.style.opacity = (1 - out).toFixed(3);
      el.open.style.transform = `translate3d(0,${(-out * 24).toFixed(1)}px,0)`;
      el.cta.style.opacity = (1 - out).toFixed(3);
      el.cta.style.pointerEvents = out < 0.5 ? "auto" : "none";

      // "Identity." arrives from in front of the lens and settles: blurred and
      // oversized, then sharp and in place. The reverse of the set's exit.
      const land = easeOut(seg(p, 0.68, 0.84));
      el.title.style.opacity = land.toFixed(3);
      el.title.style.transform =
        `translate3d(${((1 - land) * 0.18 * W).toFixed(1)}px,${((1 - land) * 0.08 * H).toFixed(1)}px,0) scale(${lerp(2.7, 1, land).toFixed(4)})`;
      el.title.style.filter = land < 0.995 ? `blur(${((1 - land) * 16).toFixed(2)}px)` : "none";
      const copyIn = easeOut(seg(p, 0.8, 0.9));
      el.idCopy.style.opacity = copyIn.toFixed(3);
      el.idCopy.style.transform = `translate3d(0,${((1 - copyIn) * 18).toFixed(1)}px,0)`;
      el.idCopy.style.pointerEvents = copyIn > 0.5 ? "auto" : "none";

      // The claim is uncovered by the subject sliding away from it.
      el.claimWrap.style.transform = `translate3d(${(truck * 0.12).toFixed(1)}px,0,0)`;

      // Key light warms toward the door as it opens.
      el.key.style.opacity = (0.75 + 0.25 * t1 - 0.5 * open).toFixed(3);

      section.style.setProperty("--cine-open", open.toFixed(4));
    };

    const frame = () => {
      raf = 0;
      if (dead) return;
      const next = current < 0 ? target : current + (target - current) * 0.16;
      const settled = Math.abs(next - target) < 0.0003;
      current = settled ? target : next;
      apply(current);
      if (!settled) raf = requestAnimationFrame(frame);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

    // The engine is the timeline: follow the --sc-p it writes on the section.
    // Before the engine mounts (or if it fails to), fall back to our own read.
    let engineLive = false;
    const fromEngine = () => {
      const v = parseFloat(section.style.getPropertyValue("--sc-p"));
      if (Number.isNaN(v)) return;
      engineLive = true;
      target = v;
      kick();
    };
    const mo = new MutationObserver(fromEngine);
    mo.observe(section, { attributes: true, attributeFilter: ["style"] });
    const onScroll = () => {
      if (engineLive) return;
      target = clamp01((scrollY - top) / travel);
      kick();
    };
    const onResize = () => { measure(); current = -1; kick(); };
    const onMedia = () => { pickLines(); load(); onResize(); };

    // Keyboard focus on copy that is hidden at this scroll position: bring the
    // timeline to where it is visible.
    const onFocus = (e: FocusEvent) => {
      const t = e.target as Node;
      const at = el.idCopy.contains(t) ? 0.92 : el.cta.contains(t) ? 0 : null;
      if (at === null) return;
      measure();
      window.scrollTo({ top: top + at * travel, behavior: "instant" });
    };

    measure();
    load();
    onScroll();
    nearHero.observe(section);
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onResize, { passive: true });
    small.addEventListener("change", onMedia);
    section.addEventListener("focusin", onFocus);
    document.fonts?.ready.then(() => { if (!dead) onResize(); });

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      mo.disconnect();
      nearHero.disconnect();
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onResize);
      small.removeEventListener("change", onMedia);
      section.removeEventListener("focusin", onFocus);
      player?.dispose();
      pending?.dispose();
      section.removeAttribute("data-live");
    };
  }, []);

  return (
    <section ref={root} id="top" className="cine" data-sc-act="pin" data-sc-span="5" data-ground="dark"
      aria-labelledby="hero-title">
      {/* Where the Identity scene has resolved on the timeline (p ≈ 0.84). */}
      <span id="identity" className="cine__anchor" aria-hidden="true" />

      <div ref={stage} className="cine__stage" data-sc-stage>
        {/* L0 · REAR: the identity space beyond the wall */}
        <div className="cine__rear" aria-hidden="true">
          <div className="cine__rings" />
          {farNodes.map((f) => (
            <div key={f.title} className={`cine__far${f.m ? "" : " cine__far--wide"}`}
              style={{ "--x": `${f.at.x}%`, "--y": `${f.at.y}%`, "--mx": `${f.m?.x ?? f.at.x}%`, "--my": `${f.m?.y ?? f.at.y}%` } as React.CSSProperties}>
              <strong>{f.title}</strong><span>{f.meta}</span>
            </div>
          ))}
        </div>

        {/* L1 · WALL: two acoustic panels with a door seam at the vanishing point */}
        <div className="cine__wall" aria-hidden="true">
          <div className="cine__panel cine__panel--l" />
          <div className="cine__panel cine__panel--r" />
          <div className="cine__slit" />
        </div>
        <div className="cine__spill" aria-hidden="true" />

        {/* Engine-driven dust, far plane */}
        <div className="cine__dust cine__dust--far" data-sc-parallax="-0.5" aria-hidden="true" />

        {/* L2 · IDENTITY OBJECTS: float in the studio, land in the graph */}
        <div className="cine__graph">
          {(["end", "mEnd"] as const).map((k) => (
            <svg key={k} className={`cine__links cine__links--${k === "end" ? "d" : "m"}`} aria-hidden="true">
              {sceneLinks.map((l) => (
                <line key={l.from + l.to} className={`cine__link${l.dashed ? " cine__link--dashed" : ""}`}
                  data-from={l.from} data-to={l.to}
                  x1={`${byId[l.from][k].x}%`} y1={`${byId[l.from][k].y}%`} x2={`${byId[l.to][k].x}%`} y2={`${byId[l.to][k].y}%`} />
              ))}
            </svg>
          ))}
          <ul className="cine__nodes" aria-label="Phase 1 identities in the CFG lab">
            {sceneNodes.map((n) => (
              <li key={n.id} data-node={n.id} data-kind={n.kind} className="cine__node"
                style={{ "--x": `${n.end.x}%`, "--y": `${n.end.y}%`, "--mx": `${n.mEnd.x}%`, "--my": `${n.mEnd.y}%`, "--rest": n.rest ?? 1 } as React.CSSProperties}>
                <span className="cine__node-mark" aria-hidden="true">{n.initials ?? ""}</span>
                <span className="cine__node-text">
                  <strong>{n.title}</strong>
                  <span>{n.meta}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* L3 · OVERSIZED HEADLINE: behind the subject, recedes as the camera trucks.
            The name is in the header and About, so it is not repeated here. */}
        <h1 id="hero-title" className="cine__head">
          <span className="cine__head-row cine__head-row--1"><span>Identity</span> <span>Secured.</span></span>{" "}
          <span className="cine__head-row cine__head-row--2"><span>Access</span> <span>Governed.</span></span>
        </h1>

        {/* The claim sits behind the set: A.R.I.A. uncovers it */}
        <div className="cine__claim">
          <p className="cine__claim-line" data-sc-cue="0.2 0.46 0.3" data-sc-kinetic="words">
            Least privilege, on the record.
          </p>
          <p className="cine__claim-sub mono" data-sc-cue="0.27 0.46 0.3">
            Privileged access · Scoped administration · Joiner, mover, leaver
          </p>
        </div>

        <p className="cine__sign mono" data-sc-cue="0.46 0.63 0.25" aria-hidden="true">
          Cashville Financial Group <span>IAM lab · simulated organization</span>
        </p>

        {/* L4 · THE SET: tabletop, A.R.I.A., desk. One transform, one contact edge. */}
        <div className="cine__set">
          <div className="cine__tabletop" aria-hidden="true" />
          <div className="cine__aria">
            <div className="cine__shadow" aria-hidden="true" />
            <img src={FRAMES.desktop[1]} srcSet={`${FRAMES.mobile[1]} 480w, ${FRAMES.desktop[1]} 760w`}
              sizes="(max-width: 860px) 50vw, 40vh" width={760} height={941}
              alt="A.R.I.A., a felt puppet host in a tan suit, white shirt and green striped tie, seated at a studio desk."
              fetchPriority="high" />
            <canvas aria-hidden="true" />
          </div>
          <div className="cine__desk" aria-hidden="true"><span className="cine__desk-light" /></div>
        </div>

        <div className="cine__dust cine__dust--mid" data-sc-parallax="-1.4" aria-hidden="true" />

        {/* L5 · FOREGROUND: out-of-focus objects at the lens */}
        <div className="cine__fg" aria-hidden="true">
          <span className="cine__fg-chip cine__fg-chip--1">PIM</span>
          <span className="cine__fg-chip cine__fg-chip--2">AU</span>
          <span className="cine__fg-chip cine__fg-chip--3">JML</span>
        </div>

        {/* L6 · ATMOSPHERE */}
        <div className="cine__key" aria-hidden="true" />
        <div className="cine__dust cine__dust--near" data-sc-parallax="-3" aria-hidden="true" />
        <div className="cine__vignette" aria-hidden="true" />

        {/* COPY */}
        <div className="cine__open">
          <p className="cine__eyebrow mono">Identity &amp; Access Management</p>
          <p className="cine__lede">Hands-on Microsoft Entra ID: identity governance, RBAC, least privilege and joiner-mover-leaver lifecycle.</p>
        </div>
        <div className="cine__cta">
          <a className="btn btn--solid" href="#identity">Enter the CFG lab</a>
          <a className="btn btn--ghost" href={profile.resume} download>Resumé (PDF)</a>
        </div>

        <div className="cine__identity-plane">
        <div className="cine__identity">
          <h2 className="cine__id-title">Identity.</h2>
          <div className="cine__id-copy">
            <p className="cine__id-lede">One person, two identities. Daily work never runs on privileged credentials.</p>
            <p className="cine__id-meta mono">CFG Phase 1 · Microsoft Entra ID</p>
            <a className="cine__id-link" href={CFG_PHASE1} target="_blank" rel="noopener noreferrer">
              Phase 1 evidence on GitHub <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
