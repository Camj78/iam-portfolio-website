"use client";

import { useEffect, useRef, useState } from "react";
import { profile } from "@/content/profile";
import { createFramePlayer, type FramePlayer } from "@/lib/frame-player";
import { path, seg, smooth, lerp, clamp01, follow, styleWriter } from "@/lib/camera-path";
import { PORTAL, portalFrame, placePortal, drawPortal } from "@/lib/portal";
import { texture, vgrad, glow, stripes } from "@/lib/texture";
import { ariaLine, scenes, closing, interests, practice, sc300, story } from "@/content/about-scene";

/*
  About: the person behind the access.

  One pinned Scroll Craft act (span 6). The engine pins the stage, publishes p
  as --sc-p, fades the copy (data-sc-cue, kinetic titles) and drifts the dust
  (data-sc-parallax). This component flies a CSS 3D camera through a studio,
  where three slabs stand on a polished floor and A.R.I.A. rides a console.
  The camera is one continuous path (lib/camera-path); A.R.I.A.'s console is
  keyed to the same path, and the slabs move on the camera's own progress, so
  everything that moves together stays together:

    0.00  The exit portal Validation ended on (lib/portal). Lights come up.
    0.06  Dolly through the ring, which passes the lens.
    0.10  FOUNDATION  The first slab swings up off the floor; A.R.I.A. looks
                      at it. The dolly settles into a hold.
    0.40  TRANSITION  Truck right. A.R.I.A.'s console tracks with the camera,
                      the first slab drifts back into the dark, a light path
                      draws across the floor and the second slab swings in.
    0.66  PRACTICE    Push forward into the warm end of the studio. The glass
                      slab swings away to the right; A.R.I.A. glides into the
                      foreground and turns to the third slab as it lights.
    0.87  Close: the personal statement, the SC-300 plate glows, hand-off to
          Certifications.

  Rendering: light changes are opacity on their own layers (never a repainted
  gradient), the floor is cut into depth segments, and anything the camera
  passes is hidden before it reaches the lens.

  Every length is a world px at --k = 1, scaled per viewport so the framing
  holds. Reduced motion and no-JS: no pin; each scene beside its slab.
*/

const POSES = ["left", "front", "right"] as const;
const FRAMES = {
  desktop: POSES.map((p) => `/aria/optimized/aria-${p}-760.webp`),
  mobile: POSES.map((p) => `/aria/optimized/aria-${p}-480.webp`),
};

/** Camera smoothing time constant, ms. Small: it only rounds off wheel steps. */
const TAU = 45;
const FLOOR_SEGS = 8;
const FLOOR_INDEX = Array.from({ length: FLOOR_SEGS }, (_, i) => i);

type Place = [number, number, number]; // world x, world z, rotateY

/**
  Staging per breakpoint, in world px at --k = 1. P perspective, vx/vy the
  vanishing point (% of stage), fy the floor below the horizon, wall its depth.
  cam: [p, x, z, yaw, pitch]; each move is one segment between holds, so its
  speed rises and falls once. yaw: a gentle look-in across the truck, keyed on
  its own so it never splits the move. host: [p, x, z] keyed at the camera's
  own p with values proportional to it, so the console moves in step.
  poses: [p, frame] for A.R.I.A. (0 looks left, 1 front, 2 right).
*/
const GEO = {
  desktop: {
    ...PORTAL.desktop, fy: 400, wall: 2600,
    cam: [
      [0, 0, -1600, 0, 0], [0.06, 0, -1600, 0, 0], [0.2, 30, 0, 0, 0], [0.34, 60, 120, 0, 0], [0.4, 60, 120, 0, 0],
      [0.6, 1150, 120, 0, 0], [0.66, 1150, 120, 0, 0],
      [0.86, 1700, 1250, 0, -2], [1, 1720, 1330, 0, -2],
    ],
    host: [
      [0, -38, -300], [0.4, -38, -300], [0.6, 1076, -300], [0.66, 1076, -300],
      [0.86, 2140, -1030], [1, 2140, -1030],
    ],
    a: { rest: [431, -450, -14] as Place, away: [1555, -2075, 6] as Place },
    b: { from: [2300, -350, -46] as Place, rest: [1651, -570, -14] as Place, exit: [2650, -570, -62] as Place },
    c: { rest: [1935, -1617, -8] as Place },
    poses: [[0, 1], [0.2, 1], [0.28, 2], [0.42, 2], [0.5, 1], [0.7, 1], [0.8, 0], [1, 0]],
    yaw: [[0, 0], [0.4, 0], [0.5, -1.5], [0.6, 0], [1, 0]],
  },
  mobile: {
    ...PORTAL.mobile, fy: 260, wall: 1700,
    cam: [
      [0, 0, -1300, 0, 0], [0.06, 0, -1300, 0, 0], [0.2, 0, 0, 0, 0], [0.34, 30, 80, 0, 0], [0.4, 30, 80, 0, 0],
      [0.6, 760, 80, 0, 0], [0.66, 760, 80, 0, 0],
      [0.86, 1160, 900, 0, -2], [1, 1170, 960, 0, -2],
    ],
    host: [
      [0, -77, -180], [0.4, -77, -180], [0.6, 653, -180], [0.66, 653, -180],
      [0.86, 1400, 560], [1, 1400, 560],
    ],
    a: { rest: [128, -380, -10] as Place, away: [746, -1431, 8] as Place },
    b: { from: [1250, -150, -42] as Place, rest: [858, -380, -12] as Place, exit: [1500, -380, -60] as Place },
    c: { rest: [1160, -1004, -4] as Place },
    poses: [[0, 1], [0.2, 1], [0.28, 2], [0.42, 2], [0.5, 1], [1, 1]],
    yaw: [[0, 0], [0.4, 0], [0.5, -1.5], [0.6, 0], [1, 0]],
  },
};

export function AboutScene() {
  const root = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) dialog.current?.showModal();
  }, [open]);

  useEffect(() => {
    const section = root.current!;
    const visual = section.querySelector<HTMLElement>(".ab__visual")!;
    const q = <T extends Element = HTMLElement>(s: string, from: ParentNode = section) => from.querySelector(s) as T;
    const qa = (s: string) => Array.from(section.querySelectorAll<HTMLElement>(s));

    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Static composition: take the act out of the engine before it mounts.
      section.removeAttribute("data-sc-act");
      return;
    }
    section.setAttribute("data-live", "");
    const small = matchMedia("(max-width: 860px)");
    const w = styleWriter();

    const slab = (name: string) => {
      const o = q(`.ab__obj--${name}`);
      return { o, face: q(".ab__face", o), shade: q(".ab__shade", o), light: q(".ab__light", o), edge: q(".ab__edge", o), mirror: q(".ab__mirror", o), cone: q(".ab__cone", o), pool: q(".ab__pool", o) };
    };
    const el = {
      world: q(".ab__world"),
      floorSegs: qa(".ab__floor-seg"),
      a: slab("a"), b: slab("b"), c: slab("c"),
      host: q(".ab__host"),
      spot: q(".ab__host-spot"),
      aria: q(".ab__aria"),
      canvas: q<HTMLCanvasElement>(".ab__aria canvas"),
      pathAB: q(".ab__path--ab"),
      pathBC: q(".ab__path--bc"),
      wall: q(".ab__wall"),
      sc300Glow: q(".ab__sc300-glow"),
      // One screen-space warm layer: three (sky, key, window) cost the push
      // a tenth of its frames on an integrated GPU for the same look.
      warm: qa(".ab__key-warm"),
      portal: q(".ab__visual .portal"),
    };

    let player: FramePlayer | null = null;
    let target = 0, current = -1, raf = 0, dead = false, lastT = 0, lastApplied = -1;
    let top = 0, travel = 1, k = 1;
    let G = GEO.desktop;
    let cam = path(G.cam), host = path(G.host), pose = path(G.poses), look = path(G.yaw);

    /** Lay a floor strip from one object's footprint to another's. */
    const strip = (s: HTMLElement, from: Place, to: Place) => {
      const dx = (to[0] - from[0]) * k, dz = (to[1] - from[1]) * k;
      s.style.left = `${(from[0] * k).toFixed(1)}px`;
      s.style.top = `${(-from[1] * k).toFixed(1)}px`;
      s.style.width = `${Math.hypot(dx, dz).toFixed(1)}px`;
      s.style.transform = `rotate(${(Math.atan2(-dz, dx) * 180 / Math.PI).toFixed(2)}deg)`;
    };

    const measure = () => {
      G = small.matches ? GEO.mobile : GEO.desktop;
      cam = path(G.cam); host = path(G.host); pose = path(G.poses); look = path(G.yaw);
      const W = visual.clientWidth, H = visual.clientHeight;
      const pf = portalFrame(W, H, small.matches);
      k = pf.k;
      top = section.getBoundingClientRect().top + scrollY;
      travel = Math.max(1, section.offsetHeight - innerHeight);
      visual.style.setProperty("--k", k.toFixed(4));
      visual.style.setProperty("--P", `${(G.P * k).toFixed(1)}px`);
      visual.style.setProperty("--vx", `${G.vx}%`);
      visual.style.setProperty("--vy", `${((pf.cy / H) * 100).toFixed(2)}%`);
      // Set here, not derived in CSS: a custom property resolves where it is
      // declared, so a calc on .ab would keep the desktop floor.
      visual.style.setProperty("--fy", `${(G.fy * k).toFixed(1)}px`);
      visual.style.setProperty("--wd", `${(G.wall * k).toFixed(1)}px`);
      placePortal(el.portal, pf);

      // Backdrops, painted once per size (lib/texture): the wall with its
      // slats and far window, and the floor.
      const wallW = 5900 * k, wallH = 1600 * k + G.fy * k;
      texture(el.wall, wallW, wallH, 0.45, (c, w, h) => {
        c.fillStyle = vgrad(c, 0, h, [[0, "#08100c"], [0.7, "#0f1a15"], [1, "#0b130f"]]);
        c.fillRect(0, 0, w, h);
        stripes(c, w, h, "x", 70 * k, 6 * k, "rgba(0,0,0,0.55)");
        glow(c, 0.8 * w, 0.55 * h, 0.19 * w, 0.4 * h, [[0, "rgba(250,226,186,0.06)"], [0.45, "rgba(200,162,124,0.03)"], [0.72, "rgba(200,162,124,0)"]]);
      });
      const Lf = (480 * k + G.wall * k) / FLOOR_SEGS, grid = 180 * k;
      el.floorSegs.forEach((seg, i) => {
        texture(seg, wallW, Lf + 2, 0.35, (c, w, h) => {
          const off = i * Lf;
          c.fillStyle = vgrad(c, -off, FLOOR_SEGS * Lf - off, [[0, "rgba(14,22,18,0.72)"], [1, "rgba(10,16,13,0.82)"]]);
          c.fillRect(0, 0, w, h);
          stripes(c, w, h, "y", grid, 1, "rgba(236,231,220,0.035)", -off);
          stripes(c, w, h, "x", grid, 1, "rgba(236,231,220,0.035)");
        });
      });
      strip(el.pathAB, G.a.rest, G.b.rest);
      // Starts partway, so the near end never runs under the lens in the final frame.
      const mid: Place = [lerp(G.b.rest[0], G.c.rest[0], 0.4), lerp(G.b.rest[1], G.c.rest[1], 0.4), 0];
      strip(el.pathBC, mid, G.c.rest);
      player?.resize();
      lastApplied = -1;
    };

    const load = () => {
      player?.dispose();
      el.aria.removeAttribute("data-ready");
      player = createFramePlayer(el.canvas, small.matches ? FRAMES.mobile : FRAMES.desktop, {
        dissolve: [0.3, 0.7],
        onFirstDraw: () => { if (!dead) el.aria.setAttribute("data-ready", ""); },
        onReady: () => { if (dead) return; lastApplied = -1; current = -1; kick(); },
      });
    };

    const apply = (p: number) => {
      const P = G.P;
      const [cx, cz, , pitch] = cam(p);
      const yaw = look(p)[0];
      w.css(el.world, "transform",
        `rotateX(${pitch.toFixed(3)}deg) rotateY(${yaw.toFixed(3)}deg) translate3d(${(-cx * k).toFixed(2)}px,0,${(cz * k).toFixed(2)}px)`);

      // Progress through each camera move, so the set moves with the camera.
      const C = G.cam;
      const truck = clamp01((cx - C[4][1]) / (C[5][1] - C[4][1]));
      const push = clamp01((cz - C[6][2]) / (C[7][2] - C[6][2]));

      // Anything that comes close to the lens is hidden before it gets there.
      const near = (z: number) => 1 - seg(z + cz, P * 0.22, P * 0.5);
      const mix = (a: Place, b: Place, t: number): Place => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
      const place = (s: ReturnType<typeof slab>, at: Place, o: number, lit: number, shade: number, extra = "") => {
        const show = o > 0.004;
        w.css(s.o, "visibility", show ? "inherit" : "hidden");
        if (!show) return;
        w.css(s.o, "transform", `translate3d(${(at[0] * k).toFixed(2)}px,0,${(at[1] * k).toFixed(2)}px) rotateY(${at[2].toFixed(3)}deg)${extra}`);
        const f = o.toFixed(3);
        w.css(s.face, "opacity", f);
        w.css(s.edge, "opacity", f);
        w.css(s.mirror, "opacity", (o * (0.4 + 0.6 * lit)).toFixed(3));
        w.css(s.cone, "opacity", (o * (0.25 + 0.75 * lit)).toFixed(3));
        w.css(s.pool, "opacity", (o * (0.3 + 0.7 * lit)).toFixed(3));
        w.css(s.light, "opacity", lit.toFixed(3));
        w.css(s.shade, "opacity", shade.toFixed(3));
      };

      // FOUNDATION: swings up off the floor, then drifts back into the dark
      // as the camera trucks, and is left there when it pushes on.
      const rise = smooth(seg(p, 0.08, 0.26));
      const aAt = mix(G.a.rest, G.a.away, smooth(truck));
      const aLit = smooth(seg(p, 0.16, 0.3)) * (1 - 0.7 * smooth(truck)) * (1 - smooth(seg(push, 0, 0.4)));
      place(el.a, aAt, near(aAt[1]) * (1 - smooth(seg(push, 0.1, 0.5))), aLit,
        0.55 * (1 - aLit) + 0.3 * smooth(truck), ` rotateX(${((1 - rise) * 82).toFixed(2)}deg)`);

      // TRANSITION: swings in over the second half of the truck; on the push
      // it swings away to the right, clear of the copy.
      const arrive = smooth(seg(truck, 0.3, 1));
      const leave = smooth(seg(push, 0, 0.7));
      const bAt = mix(mix(G.b.from, G.b.rest, arrive), G.b.exit, leave);
      const bLit = smooth(seg(truck, 0.55, 1)) * (1 - leave);
      place(el.b, bAt, near(bAt[1]) * smooth(seg(truck, 0.25, 0.45)) * (1 - smooth(seg(push, 0.4, 0.75))), bLit, 0.55 * (1 - bLit));
      const blur = (1 - arrive) * 6 * k;
      w.css(el.b.face, "filter", blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none");

      // PRACTICE: already standing deep in the studio; lights as we arrive.
      const cLit = lerp(0.12, 1, smooth(seg(push, 0.3, 1)));
      place(el.c, G.c.rest, near(G.c.rest[1]), cLit, 0.55 * (1 - cLit));
      w.css(el.sc300Glow, "opacity", smooth(seg(p, 0.9, 0.97)).toFixed(3));

      // The floor path: experience to identity, identity to practice.
      w.css(el.pathAB, "opacity", smooth(seg(truck, 0.15, 0.85)).toFixed(3));
      w.prop(el.pathAB, "--draw", smooth(seg(truck, 0.15, 0.85)).toFixed(3));
      w.css(el.pathBC, "opacity", smooth(seg(push, 0.05, 0.75)).toFixed(3));
      w.prop(el.pathBC, "--draw", smooth(seg(push, 0.05, 0.75)).toFixed(3));

      // Floor segments the camera has passed over.
      const Lf = (480 * k + G.wall * k) / FLOOR_SEGS;
      el.floorSegs.forEach((s, i) => {
        w.css(s, "visibility", 480 * k - i * Lf + cz * k < P * k * 0.8 ? "inherit" : "hidden");
      });

      // A.R.I.A.: the console is keyed to the camera's own path.
      const [hx, hz] = host(p);
      const hNear = near(hz);
      w.css(el.host, "visibility", hNear > 0.004 ? "inherit" : "hidden");
      w.css(el.host, "transform", `translate3d(${(hx * k).toFixed(2)}px,0,${(hz * k).toFixed(2)}px)`);
      w.css(el.host, "opacity", hNear.toFixed(3));
      w.css(el.spot, "opacity", lerp(0.35, 1, smooth(seg(p, 0, 0.12))).toFixed(3));
      player?.draw(pose(p)[0]);

      // Light: the far end of the studio warms as we push into it.
      const warm = smooth(push).toFixed(3);
      el.warm.forEach((x) => w.css(x, "opacity", warm));

      // The exit portal: the ring Validation ended on. Lights up inside it,
      // then it passes the lens as the camera dollies through.
      const s0 = P / (P - (G.ringZ + G.camZ0));
      const s = P / Math.max(1, P - (G.ringZ + cz));
      drawPortal(el.portal, s / s0, 1 - smooth(seg(p, 0.004, 0.07)));
    };

    // Stage culling. Before its pin this stage overlaps Validation's release
    // (see about.css) and stays hidden; it shows from the first frame the
    // engine reports progress. Validation's last frame and this stage's first
    // are the same picture, so the switch between them lands on one frame.
    const onStage = () => {
      w.css(visual, "visibility", target > 0 ? "inherit" : "hidden");
    };

    const step = (now: number) => {
      const dt = lastT ? now - lastT : 16;
      lastT = now;
      current = current < 0 ? target : follow(current, target, dt, TAU);
      if (Math.abs(current - target) < 0.0002) current = target;
      if (current !== lastApplied) { apply(current); lastApplied = current; }
      return current !== target;
    };
    const frame = (now: number) => {
      raf = 0;
      if (dead) return;
      if (step(now)) raf = requestAnimationFrame(frame);
      else lastT = 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const onResize = () => { measure(); current = -1; onStage(); kick(); };
    const onMedia = () => { load(); onResize(); };

    // One progress source: the engine's p, applied in the engine's own frame
    // (the MutationObserver callback is a microtask inside it).
    let engineLive = false, lastP = NaN;
    const mo = new MutationObserver(() => {
      const v = parseFloat(section.style.getPropertyValue("--sc-p"));
      if (Number.isNaN(v) || v === lastP) return;
      lastP = v; engineLive = true; target = v;
      onStage();
      if (step(performance.now())) kick();
    });
    mo.observe(section, { attributes: true, attributeFilter: ["style"] });
    const onScroll = () => { if (!engineLive) { target = clamp01((scrollY - top) / travel); onStage(); kick(); } };
    // The engine sizes the acts after mount: re-measure whenever the page does.
    const ro = new ResizeObserver(() => { measure(); kick(); });
    ro.observe(document.body);
    // Focus on anything that only exists in the final frame: go there.
    const onFocus = (e: FocusEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest(".ab__obj--c, .ab__close")) return;
      if (current > 0.9) return;
      measure();
      window.scrollTo({ top: top + 0.95 * travel, behavior: "instant" });
    };

    load(); measure(); onScroll(); onStage();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onResize, { passive: true });
    small.addEventListener("change", onMedia);
    section.addEventListener("focusin", onFocus);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      mo.disconnect();
      ro.disconnect();
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onResize);
      small.removeEventListener("change", onMedia);
      section.removeEventListener("focusin", onFocus);
      player?.dispose();
      section.removeAttribute("data-live");
    };
  }, []);

  return (
    <section ref={root} id="about" className="ab" data-sc-act="pin" data-sc-span="6" data-ground="dark"
      aria-labelledby="about-title">
      <div className="ab__stage" data-sc-stage>
        {/* COPY: one headline and a few words per scene */}
        <div className="ab__copy">
          <h2 id="about-title" className="ab__kicker mono" data-sc-cue="0.03 3 0.01">About<span className="ab__kicker-more"> · The person behind the access</span></h2>
          <p className="ab__voice" data-sc-cue="0.05 0.15 0.3 0.3">
            <span className="mono">A.R.I.A.</span> {ariaLine}
          </p>
          <button type="button" className="ab__story btn btn--solid" data-sc-cue="0.05 3 0.01" onClick={() => setOpen(true)} aria-haspopup="dialog">
            Read my story
          </button>
          <ol className="ab__scenes">
            {scenes.map((s, i) => (
              <li key={s.id} className={`ab__scene ab__scene--${i + 1}`}>
                <p className="ab__label mono" data-sc-cue={["0.15 0.4 0.25 0.15", "0.44 0.67 0.25 0.15", "0.7 0.88 0.25 0.2"][i]}>{s.label}</p>
                <h3 className="ab__title" data-sc-cue={["0.16 0.4 0.3 0.15", "0.45 0.67 0.3 0.15", "0.71 0.88 0.3 0.2"][i]} data-sc-kinetic="words">{s.title}</h3>
                <p className="ab__body" data-sc-cue={["0.19 0.4 0.25 0.15", "0.49 0.67 0.25 0.15", "0.75 0.88 0.25 0.2"][i]}>{s.body}</p>
              </li>
            ))}
          </ol>
          <div className="ab__close" data-sc-cue="0.87 1.3 0.1">
            <p className="ab__statement">{closing}</p>
            <div className="ab__actions">
              <a className="btn btn--ghost" href={profile.resume} download>Resumé (PDF)</a>
              <a className="ab__next" href="#certifications">Next · Certifications <span aria-hidden="true">↓</span></a>
            </div>
          </div>
        </div>

        <div className="ab__visual">
          <div className="ab__space" aria-hidden="true" />
          <div className="ab__dust ab__dust--far" data-sc-parallax="-0.5" aria-hidden="true" />

          <div className="ab__world">
            {/* L0 · the studio: back wall, polished floor, the light path */}
            <div className="ab__wall" aria-hidden="true" />
            <div className="ab__floor" aria-hidden="true">
              {FLOOR_INDEX.map((i) => <span key={i} className="ab__floor-seg" style={{ "--i": i } as React.CSSProperties} />)}
              <span className="ab__path ab__path--ab" />
              <span className="ab__path ab__path--bc" />
            </div>

            {/* FOUNDATION · a dark slab: the experience */}
            <div className="ab__obj ab__obj--a">
              <span className="ab__cone" aria-hidden="true" />
              <span className="ab__pool" aria-hidden="true" />
              <span className="ab__edge" aria-hidden="true" />
              <span className="ab__mirror" aria-hidden="true" />
              <div className="ab__face">
                <p className="ab__etch mono">Nissan North America</p>
                <p className="ab__num"><b>3+</b><span>years supporting business-critical applications</span></p>
                <ul className="ab__roles">
                  {profile.experience.slice().reverse().map((x) => (
                    <li key={x.title}><span>{x.title}</span><em className="mono">{x.years.replace(" to ", "–")}</em></li>
                  ))}
                </ul>
                <span className="ab__light" aria-hidden="true" />
                <span className="ab__shade" aria-hidden="true" />
              </div>
            </div>

            {/* TRANSITION · frosted glass: what drew him to identity */}
            <div className="ab__obj ab__obj--b">
              <span className="ab__cone" aria-hidden="true" />
              <span className="ab__pool" aria-hidden="true" />
              <span className="ab__edge" aria-hidden="true" />
              <span className="ab__mirror" aria-hidden="true" />
              <div className="ab__face">
                <span className="ab__glyph" aria-hidden="true"><i /><i /><i /></span>
                <p className="ab__etch mono">Next chapter · Identity &amp; access</p>
                <ul className="ab__interests" aria-label="Interests">
                  {interests.map((t) => <li key={t}>{t}</li>)}
                </ul>
                <p className="ab__plate mono">Practiced in CFG · simulated organization</p>
                <span className="ab__light" aria-hidden="true" />
                <span className="ab__shade" aria-hidden="true" />
              </div>
            </div>

            {/* PRACTICE · the lit slab: hands-on work and the exam in progress */}
            <div className="ab__obj ab__obj--c">
              <span className="ab__cone" aria-hidden="true" />
              <span className="ab__pool" aria-hidden="true" />
              <span className="ab__edge" aria-hidden="true" />
              <span className="ab__mirror" aria-hidden="true" />
              <div className="ab__face">
                <p className="ab__etch mono">Hands-on · Microsoft Entra ID</p>
                <ul className="ab__practice">
                  {practice.map((x) => (
                    <li key={x.id}>
                      <a href={x.href}>
                        <span className="mono">{x.label}</span>
                        <b>{x.title}</b>
                        <em className="mono">{x.status}</em>
                      </a>
                    </li>
                  ))}
                  <li className="ab__sc300">
                    <a href={sc300.href}>
                      <i className="ab__sc300-glow" aria-hidden="true" />
                      <span className="mono">{sc300.title}</span>
                      <b>{sc300.name}</b>
                      <em className="mono">{sc300.status}</em>
                    </a>
                  </li>
                </ul>
                <span className="ab__light" aria-hidden="true" />
                <span className="ab__shade" aria-hidden="true" />
              </div>
            </div>

            {/* A.R.I.A. at a rolling console */}
            <div className="ab__host">
              <span className="ab__host-spot" aria-hidden="true" />
              <div className="ab__aria">
                <img src={FRAMES.desktop[1]} srcSet={`${FRAMES.mobile[1]} 480w, ${FRAMES.desktop[1]} 760w`}
                  sizes="(max-width: 860px) 60vw, 34vh" width={760} height={941} loading="lazy" decoding="async"
                  alt="A.R.I.A., the felt puppet host in a tan suit and green striped tie, at a studio console." />
                <canvas aria-hidden="true" />
              </div>
              <div className="ab__console" aria-hidden="true"><span /></div>
            </div>
          </div>

          <div className="ab__dust ab__dust--mid" data-sc-parallax="-1.4" aria-hidden="true" />
          <div className="ab__key" aria-hidden="true"><span className="ab__key-warm" /></div>
          <div className="ab__dust ab__dust--near" data-sc-parallax="-3" aria-hidden="true" />
          <div className="ab__vignette" aria-hidden="true" />
          {/* The exit portal Validation ended on (lib/portal) */}
          <div className="portal" aria-hidden="true" />
        </div>
      </div>

      <dialog ref={dialog} className="ab__dialog" aria-labelledby="ab-story-title"
        onClose={() => setOpen(false)}
        onClick={(ev) => { if (ev.target === dialog.current) dialog.current?.close(); }}>
        {open && (
          <div className="ab__sheet">
            <header className="ab__sheet-head">
              <p className="mono">About · Cameron Johnson</p>
              <button type="button" className="ab__x" onClick={() => dialog.current?.close()} aria-label="Close story">×</button>
            </header>
            <h3 id="ab-story-title" className="ab__sheet-title">{story.title}</h3>
            {story.transition.map((t) => <p key={t} className="ab__sheet-lede">{t}</p>)}

            <section className="ab__part" aria-labelledby="ab-exp">
              <h4 id="ab-exp" className="mono">Experience</h4>
              <ol className="ab__jobs">
                {story.experience.map((x) => (
                  <li key={x.title}>
                    <p className="ab__job-when mono">{x.years}</p>
                    <p className="ab__job-title">{x.title}</p>
                    <p className="ab__job-org">{x.org}</p>
                    <ul>{x.points.map((pt) => <li key={pt}>{pt}</li>)}</ul>
                  </li>
                ))}
              </ol>
            </section>

            <section className="ab__part" aria-labelledby="ab-lab">
              <h4 id="ab-lab" className="mono">The CFG lab</h4>
              <p>{story.lab.intro}</p>
              <ul className="ab__phases">
                {story.lab.phases.map((ph) => (
                  <li key={ph.name}>
                    <a href={ph.href}>{ph.name} <span aria-hidden="true">→</span></a>
                    <p>{ph.summary}</p>
                  </li>
                ))}
              </ul>
            </section>

            <div className="ab__part ab__part--split">
              <section aria-labelledby="ab-cert">
                <h4 id="ab-cert" className="mono">Certification</h4>
                <p className="ab__cert"><span className="mono">In progress</span>{story.certification}</p>
              </section>
              <section aria-labelledby="ab-edu">
                <h4 id="ab-edu" className="mono">Education</h4>
                <p>{story.education.degree}<br />{story.education.school}, {story.education.year}</p>
              </section>
            </div>

            <div className="ab__sheet-links">
              <a className="btn btn--solid" href={profile.resume} download>Resumé (PDF)</a>
              <a className="btn btn--ghost" href={profile.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
              <a className="btn btn--ghost" href={profile.github} target="_blank" rel="noopener noreferrer">GitHub</a>
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
