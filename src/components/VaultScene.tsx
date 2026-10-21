"use client";

import { useEffect, useRef, useState } from "react";
import { vault, learning, next, demonstratedCount, casePage, type Evidence } from "@/content/vault-scene";
import { path, seg, smooth, lerp, clamp01, follow, styleWriter } from "@/lib/camera-path";
import { portalFrame, placePortal, drawPortal } from "@/lib/portal";
import { texture, glow, stripes, vgrad } from "@/lib/texture";

/*
  Validation: the evidence vault.

  One pinned Scroll Craft act (span 7). The engine pins the stage, publishes p
  as --sc-p, fades the captions (data-sc-cue) and drifts the dust
  (data-sc-parallax). This component flies a CSS 3D camera through it on one
  continuous path (lib/camera-path), updated in the same frame the engine
  writes p, so the camera and the captions never drift apart:

    0.00  A security corridor. Light strips run to a round vault door.
    0.06  Dolly down the corridor; the door's ring turns, the halves part.
    0.26  Through the door into the chamber: eleven evidence panels hang in an
          arc around the camera, dim and locked.
    0.40  Verify: the camera pans across the arc and each capability group
          lights in turn, revealing its redacted screenshot.
    0.69  Pull back: Demonstrated (lit), Learning (outlined, no evidence) and
          Next (empty slots) side by side.
    0.88  Exit: back out through the door as the chamber lights go down,
          settling on the exit portal About opens from (lib/portal).

  Rendering: every surface the camera travels through is cut into depth
  segments and hidden before it reaches the lens. A plane that crosses the
  eye has an unbounded projected scale and Chrome re-rasterizes it every
  frame; that, not the motion, is what made this act stutter.

  Every lit panel is a button: it opens the redacted screenshot, the CFG case
  study and the GitHub documentation. Reduced motion and no-JS: no pin; the
  final chamber beside every caption.
*/

/** The original six-viewport choreography ends here; the exit beat follows. */
const X = 6 / 7;
/** Depth segments (must match the markup and vault.css). */
const CORR_SEGS = 8;
const FLOOR_SEGS = 10, FLOOR_LEN = 520, FLOOR_NEAR = 2400;
/** Camera smoothing time constant, ms. Small: it only rounds off wheel steps. */
const TAU = 45;

const CORR_SEG_INDEX = Array.from({ length: CORR_SEGS }, (_, i) => i);
const FLOOR_SEG_INDEX = Array.from({ length: FLOOR_SEGS }, (_, i) => i);

/** Geometry per breakpoint, px. P perspective, D corridor depth, R arc radius, C chamber centre past the door. */
const GEO = {
  desktop: { P: 1000, D: 2600, R: 900, C: 820, spread: 21, back: 700 },
  mobile: { P: 760, D: 2100, R: 760, C: 700, spread: 26, back: 640 },
};

/** When each group lights, in order around the arc (in the original timeline, o). */
const LIGHT_AT = [0.47, 0.53, 0.59, 0.65, 0.71];

/** Arc slots: each group at an angle; its items staggered in angle, height and depth. */
const STAGGER: Record<number, [number, number, number][]> = {
  2: [[-4, -0.56, 0], [4, 0.56, 90]],
  3: [[-7, -0.6, 0], [7, -0.6, 80], [0, 0.62, 40]],
};

export function VaultScene() {
  const root = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<{ e: Evidence; group: string } | null>(null);

  useEffect(() => {
    if (open) dialog.current?.showModal();
  }, [open]);

  useEffect(() => {
    const section = root.current!;
    const visual = section.querySelector<HTMLElement>(".ev__visual")!;
    const q = <T extends Element = HTMLElement>(s: string) => section.querySelector(s) as T;
    const qa = <T extends Element = HTMLElement>(s: string) => Array.from(section.querySelectorAll(s)) as T[];

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) section.removeAttribute("data-sc-act");
    else section.setAttribute("data-live", "");
    const small = matchMedia("(max-width: 860px)");
    const w = styleWriter();

    const el = {
      world: q(".ev__world"),
      corridor: q(".ev__corridor"),
      corrSegs: Array.from({ length: CORR_SEGS }, (_, i) => qa(`.ev__plane[data-i="${i}"]`)),
      bulkhead: q(".ev__bulkhead"),
      door: q(".ev__door"),
      ring: q(".ev__door-ring"),
      label: q(".ev__door-label"),
      halfL: q(".ev__door-half--l"),
      halfR: q(".ev__door-half--r"),
      flood: q(".ev__flood"),
      chamber: q(".ev__chamber"),
      floorSegs: qa(".ev__chamber-floor"),
      chamberWall: q(".ev__chamber-wall"),
      groups: qa(".ev__group"),
      arc: q(".ev__arc"),
      shelf: q(".ev__shelf"),
      fg: qa(".ev__fg"),
      dust: qa(".ev__dust"),
      kicker: q(".ev__kicker"),
      head: q(".ev__head"),
      end: q(".ev__end"),
      portal: q(".ev__visual .portal"),
    };

    let target = reduce ? 1 : 0, current = -1, raf = 0, dead = false, lastT = 0, lastApplied = -1;
    let top = 0, travel = 1;
    let cam: (p: number) => number[] = () => [0, 0, 0];

    const measure = () => {
      const G = small.matches ? GEO.mobile : GEO.desktop;
      top = section.getBoundingClientRect().top + scrollY;
      travel = Math.max(1, section.offsetHeight - innerHeight);
      visual.style.setProperty("--P", `${G.P}px`);
      visual.style.setProperty("--D", `${G.D}px`);
      visual.style.setProperty("--R", `${G.R}px`);
      visual.style.setProperty("--C", `${G.C}px`);
      visual.style.setProperty("--back", `${G.back}px`);
      // Set here, not derived in CSS: a custom property resolves where it is
      // declared, so a CSS calc on .ev would keep the desktop depths.
      visual.style.setProperty("--zc", `${-(G.D + G.C)}px`);
      // Place each panel on the arc around the chamber centre.
      el.groups.forEach((g, gi) => {
        // Group 0 on the left, reading order matches lighting order.
        const a = ((el.groups.length - 1) / 2 - gi) * G.spread;
        g.style.setProperty("--a", `${a}deg`);
        const items = Array.from(g.querySelectorAll<HTMLElement>(".ev__panel"));
        const st = STAGGER[items.length] ?? STAGGER[2];
        items.forEach((it, i) => {
          const [da, dy, dz] = st[i];
          it.style.setProperty("--ia", `${da}deg`);
          it.style.setProperty("--iy", String(dy));
          it.style.setProperty("--iz", `${dz}px`);
        });
      });

      // The camera: continuous paths, p in the act's own timeline. Depth, yaw
      // and pitch are keyed separately so each move is one segment between
      // holds: its speed rises and falls once and never dips mid-move.
      const mobile = small.matches;
      const doorStop = G.D - (mobile ? 420 : 520);
      const centre = G.D + G.C + G.P;          // eye at the chamber centre
      const pull = centre - (mobile ? 520 : 760);
      // Turning to group i cancels its arc angle; edges stop a little short.
      const yaw = (i: number) => (i - 2) * G.spread * (mobile ? 1 : 0.8);
      const pitch = mobile ? -15 : -7;
      const depth = path([
        [0, 0], [0.07 * X, 0], [0.24 * X, doorStop], [0.29 * X, doorStop],
        [0.47 * X, centre], [0.73 * X, centre], [0.84 * X, pull], [0.885, pull],
        // Exit: back out toward the door.
        [1, pull - (mobile ? 420 : 640)],
      ]);
      // The pan: swing to the first group, then one sweep across the arc.
      const turn = path([[0, 0], [0.42 * X, 0], [0.47 * X, yaw(0)], [0.73 * X, yaw(4)], [0.84 * X, 0], [1, 0]]);
      const tilt = path([[0, 0], [0.29 * X, 0], [0.42 * X, -1], [0.47 * X, 0], [0.73 * X, 0], [0.84 * X, pitch], [0.885, pitch], [1, pitch * 0.4]]);
      cam = (p: number) => [depth(p)[0], turn(p)[0], tilt(p)[0]];
      const pf = portalFrame(visual.clientWidth, visual.clientHeight, mobile);
      placePortal(el.portal, pf);

      // The corridor, the bulkhead and the chamber's wall and floor, painted
      // once (lib/texture) from the same gradients vault.css uses as the
      // fallback, so the camera can move through them without re-rasterizing.
      const L = (G.D + 400) / CORR_SEGS;
      const hgrad = (c: CanvasRenderingContext2D, w: number, stops: [number, string][]) => {
        const g = c.createLinearGradient(0, 0, w, 0);
        stops.forEach(([o, col]) => g.addColorStop(o, col));
        return g;
      };
      el.corrSegs.forEach((segs, i) => segs.forEach((seg) => {
        const side = seg.className.match(/ev__plane--(\w+)/)![1];
        const w0 = seg.offsetWidth, h0 = seg.offsetHeight, off = i * L;
        texture(seg, w0, h0, 0.6, (c, w, h) => {
          if (side === "floor") {
            c.fillStyle = hgrad(c, w, [[0, "#0b1410"], [0.5, "#111d17"], [1, "#0b1410"]]);
            c.fillRect(0, 0, w, h);
            stripes(c, w, h, "y", 220, 2, "rgba(236,231,220,0.06)", -off);
            c.fillStyle = "rgba(102,199,147,0.55)";
            c.fillRect(w * 0.498, 0, w * 0.004, h);
          } else if (side === "ceiling") {
            c.fillStyle = "#080e0b";
            c.fillRect(0, 0, w, h);
            stripes(c, w, h, "y", 220, 2, "rgba(0,0,0,0.5)", -off);
            c.fillStyle = "rgba(236,231,220,0.18)";
            c.fillRect(w * 0.302, 0, w * 0.004, h);
            c.fillRect(w * 0.694, 0, w * 0.004, h);
          } else {
            c.fillStyle = vgrad(c, 0, h, [[0, "#0c1612"], [0.5, "#0f1b16"], [1, "#0a120e"]]);
            c.fillRect(0, 0, w, h);
            stripes(c, w, h, "x", 220, 3, "rgba(0,0,0,0.55)", -off);
            c.fillStyle = "rgba(102,199,147,0.6)";
            c.fillRect(0, h * 0.178, w, h * 0.006);
            c.fillStyle = "rgba(102,199,147,0.35)";
            c.fillRect(0, h * 0.816, w, h * 0.004);
          }
        });
      }));
      const hole = el.door.offsetWidth / 2;
      texture(el.bulkhead, el.bulkhead.offsetWidth, el.bulkhead.offsetHeight, 1, (c, w, h) => {
        const cx = w / 2, cy = h / 2, R = Math.hypot(w, h) / 2;
        const g = c.createRadialGradient(cx, cy, 0, cx, cy, R);
        const at = (x: number) => Math.min(1, x / R);
        g.addColorStop(0, "rgba(12,21,17,0)");
        g.addColorStop(at(hole), "rgba(12,21,17,0)");
        g.addColorStop(at(hole + 0.5), "rgba(102,199,147,0.6)");
        g.addColorStop(at(hole + 3), "#1a2a22");
        g.addColorStop(at(hole + 26), "#101b16");
        g.addColorStop(at(hole + 27), "#0c1511");
        g.addColorStop(1, "#0c1511");
        c.fillStyle = g;
        c.fillRect(0, 0, w, h);
      });
      texture(el.chamberWall, 6000, 3600, 0.3, (c, w, h) => {
        c.fillStyle = "#0a120e";
        c.fillRect(0, 0, w, h);
        stripes(c, w, h, "x", 180, 2, "rgba(0,0,0,0.5)");
        glow(c, 0.5 * w, 0.52 * h, 0.3 * w, 0.34 * h, [[0, "rgba(102,199,147,0.1)"], [0.7, "rgba(102,199,147,0)"]]);
      });
      el.floorSegs.forEach((seg, i) => {
        texture(seg, 6000, FLOOR_LEN + 2, 0.3, (c, w, h) => {
          const off = i * FLOOR_LEN;
          stripes(c, w, h, "x", 140, 1, "rgba(236,231,220,0.05)");
          stripes(c, w, h, "y", 140, 1, "rgba(236,231,220,0.05)", -off);
          glow(c, 0.5 * w, 0.46 * FLOOR_SEGS * FLOOR_LEN - off, 0.4 * w, 0.32 * FLOOR_SEGS * FLOOR_LEN, [[0, "rgba(102,199,147,0.16)"], [0.7, "rgba(102,199,147,0)"]]);
        });
      });
      lastApplied = -1;
    };

    const apply = (p: number) => {
      const mobile = small.matches;
      const G = mobile ? GEO.mobile : GEO.desktop;
      // o: the original six-viewport timeline, which the exit beat follows.
      const o = Math.min(1, p / X);
      const [z, yw, pitch] = cam(p);
      w.css(el.world, "transform", `rotateX(${pitch.toFixed(2)}deg) rotateY(${yw.toFixed(2)}deg) translate3d(0,0,${z.toFixed(1)}px)`);

      // Door: the ring unlocks, then the halves slide into the walls.
      const unlock = smooth(seg(o, 0.13, 0.21));
      const part = smooth(seg(o, 0.2, 0.29));
      w.css(el.ring, "transform", `rotate(${(unlock * 120).toFixed(2)}deg)`);
      w.css(el.halfL, "transform", `translate3d(${(-part * 112).toFixed(2)}%,0,0)`);
      w.css(el.halfR, "transform", `translate3d(${(part * 112).toFixed(2)}%,0,0)`);
      w.css(el.ring, "opacity", (1 - seg(o, 0.19, 0.24)).toFixed(3));
      w.css(el.label, "opacity", (1 - seg(o, 0.19, 0.24)).toFixed(3));
      w.css(el.flood, "opacity", (part * (1 - seg(o, 0.3, 0.35))).toFixed(3));
      // Fades go on the surfaces, never on a 3D container: opacity on a
      // preserve-3d element flattens it and breaks occlusion.
      const corr = 1 - seg(o, 0.33, 0.39);
      w.prop(el.world, "--corr", corr.toFixed(3));
      // Lights down on the way out.
      const lightsOut = smooth(seg(p, 0.9, 0.985));
      w.prop(el.world, "--cham", (lerp(0.35, 1, seg(o, 0.22, 0.36)) * (1 - lightsOut)).toFixed(3));

      // Culling. The door and bulkhead go once the corridor has faded, before
      // the camera reaches them; each corridor segment goes before its near
      // edge reaches the lens (well below the frame, so no gap ever shows).
      const doorGone = corr <= 0 || -G.D + z > G.P * 0.55;
      w.css(el.bulkhead, "visibility", doorGone ? "hidden" : "inherit");
      w.css(el.flood, "visibility", doorGone ? "hidden" : "inherit");
      const L = (G.D + 400) / CORR_SEGS;
      el.corrSegs.forEach((segs, i) => {
        const near = 400 - i * L + z;
        const show = corr > 0 && near < G.P * 0.8;
        segs.forEach((s) => w.css(s, "visibility", show ? "inherit" : "hidden"));
      });
      const zc = -(G.D + G.C);
      el.floorSegs.forEach((s, i) => {
        const near = zc + FLOOR_NEAR - i * FLOOR_LEN + z;
        w.css(s, "visibility", near < G.P * 0.8 ? "inherit" : "hidden");
      });

      // Groups light in sequence; once lit, they stay lit.
      el.groups.forEach((g, gi) => {
        const lit = seg(o, LIGHT_AT[gi], LIGHT_AT[gi] + 0.04);
        w.prop(g, "--lit", (1 - Math.pow(1 - lit, 3)).toFixed(3));
      });
      w.prop(el.shelf, "--show", (1 - Math.pow(1 - seg(o, 0.78, 0.88), 3)).toFixed(3));

      // Foreground: bulkhead ribs right at the lens, fastest plane.
      const ribs = 1 - seg(o, 0.26, 0.36);
      el.fg.forEach((f, i) => {
        const k = [1.6, 2.2][i % 2];
        w.css(f, "visibility", ribs > 0 ? "inherit" : "hidden");
        w.css(f, "transform", `translate3d(${(yw * -14 * k).toFixed(1)}px,0,0) scale(${(1 + seg(o, 0.08, 0.3) * 0.35 * k).toFixed(3)})`);
        w.css(f, "opacity", ribs.toFixed(3));
      });

      // The exit portal: the door frame passes the lens backwards and settles
      // as the ring About opens on; inside it the chamber goes dark.
      const back = seg(p, 0.885, 0.985);
      const scale = 1 / lerp(1 / 5.2, 1, smooth(back));
      drawPortal(el.portal, back > 0 ? scale : 99, smooth(seg(p, 0.93, 0.985)));
      el.dust.forEach((d) => w.css(d, "opacity", (1 - smooth(seg(p, 0.9, 0.97))).toFixed(3)));

      if (reduce) return;
      const headOut = seg(o, 0.08, 0.12);
      w.css(el.head, "opacity", (1 - headOut).toFixed(3));
      w.css(el.head, "transform", `translate3d(0,${(-headOut * 20).toFixed(1)}px,0)`);
      const endIn = 1 - Math.pow(1 - seg(o, 0.82, 0.9), 3);
      const endOut = smooth(seg(p, 0.885, 0.925));
      w.css(el.end, "opacity", (endIn * (1 - endOut)).toFixed(3));
      w.css(el.end, "transform", `translate3d(0,${((1 - endIn) * 18 - endOut * 14).toFixed(1)}px,0)`);
      w.css(el.end, "visibility", endIn * (1 - endOut) > 0.01 ? "inherit" : "hidden");
      w.css(el.kicker, "opacity", (1 - endOut).toFixed(3));
    };

    // Stage culling: once this act has ended and About has begun, About's
    // stage covers this one (its first frame is this act's last), so stop
    // drawing it. Both decisions come from the engine's own progress values,
    // written in the same frame, never from geometry measured earlier.
    const about = document.getElementById("about");
    const onStage = () => {
      const aboutP = about ? parseFloat(about.style.getPropertyValue("--sc-p")) || 0 : 0;
      const show = reduce || !(target >= 1 && aboutP > 0);
      w.css(visual, "visibility", show ? "inherit" : "hidden");
      // Hidden elements cannot take focus: keep the evidence panels reachable
      // by Shift+Tab from About (they are covered and dark here; focusing one
      // brings the camera back to the lit chamber).
      w.css(el.arc, "visibility", show ? "inherit" : "visible");
    };

    const step = (now: number) => {
      const dt = lastT ? now - lastT : 16;
      lastT = now;
      current = current < 0 ? target : follow(current, target, dt, reduce ? 0 : TAU);
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

    if (reduce) {
      measure(); kick();
      addEventListener("resize", onResize, { passive: true });
      return () => { dead = true; cancelAnimationFrame(raf); removeEventListener("resize", onResize); };
    }

    // One progress source: the engine's p. Its MutationObserver callback runs
    // as a microtask inside the engine's own frame, so the camera moves in the
    // same frame as the captions instead of one frame (and a lerp) behind.
    let engineLive = false, lastP = NaN;
    const mo = new MutationObserver(() => {
      onStage();
      const v = parseFloat(section.style.getPropertyValue("--sc-p"));
      if (Number.isNaN(v) || v === lastP) return;
      lastP = v; engineLive = true; target = v;
      onStage();
      if (step(performance.now())) kick();
    });
    mo.observe(section, { attributes: true, attributeFilter: ["style"] });
    if (about) mo.observe(about, { attributes: true, attributeFilter: ["style"] });
    const onScroll = () => { if (!engineLive) { target = clamp01((scrollY - top) / travel); onStage(); kick(); } };
    // The engine sizes the acts after mount: re-measure whenever the page does.
    const ro = new ResizeObserver(() => { measure(); kick(); });
    ro.observe(document.body);
    // Focus on anything inside the vault that is not on screen yet: go to the
    // resolved chamber, where every panel is lit and every link is visible.
    const onFocus = (e: FocusEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest(".ev__panel, .ev__end")) return;
      if (current > 0.72 && current < 0.88) return;
      measure();
      window.scrollTo({ top: top + 0.84 * travel, behavior: "instant" });
    };

    measure(); onScroll(); onStage();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onResize, { passive: true });
    small.addEventListener("change", onResize);
    section.addEventListener("focusin", onFocus);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      mo.disconnect();
      ro.disconnect();
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onResize);
      small.removeEventListener("change", onResize);
      section.removeEventListener("focusin", onFocus);
      section.removeAttribute("data-live");
    };
  }, []);

  return (
    <section ref={root} id="validation" className="ev" data-sc-act="pin" data-sc-span="7" data-ground="dark"
      aria-labelledby="validation-title">
      <div className="ev__stage" data-sc-stage>
        <div className="ev__visual">
          <div className="ev__space" aria-hidden="true" />
          <div className="ev__dust" data-sc-parallax="-0.8" aria-hidden="true" />

          <div className="ev__world">
            {/* L1 · the corridor: four real planes running to the door */}
            <div className="ev__corridor" aria-hidden="true">
              {/* Each plane in depth segments, so the near ones can be culled before the lens */}
              {(["floor", "ceiling", "left", "right"] as const).map((side) =>
                CORR_SEG_INDEX.map((i) => (
                  <span key={side + i} className={`ev__plane ev__plane--${side}`} data-i={i} style={{ "--i": i } as React.CSSProperties} />
                )))}
              <div className="ev__bulkhead">
                <div className="ev__door">
                  <span className="ev__door-half ev__door-half--l" />
                  <span className="ev__door-half ev__door-half--r" />
                  <span className="ev__door-ring"><i /><i /><i /><i /><i /><i /></span>
                  <span className="ev__door-label">CFG evidence</span>
                </div>
              </div>
            </div>
            <div className="ev__flood" aria-hidden="true" />

            {/* L2 · the chamber, and the evidence on an arc around the camera */}
            <div className="ev__chamber">
              {FLOOR_SEG_INDEX.map((i) => (
                <span key={i} className="ev__chamber-floor" aria-hidden="true" style={{ "--i": i } as React.CSSProperties} />
              ))}
              <span className="ev__chamber-wall" aria-hidden="true" />
              <ul className="ev__arc" aria-label="Demonstrated capabilities with CFG evidence">
                {vault.map((g) => (
                  <li key={g.id} className="ev__group">
                    <span className="ev__group-label" aria-hidden="true">{g.label}</span>
                    {g.items.map((e) => (
                      <button key={e.id} type="button" className="ev__panel"
                        aria-label={`${e.title}. ${g.label}, CFG Phase ${e.phase}. Open evidence.`}
                        onClick={() => setOpen({ e, group: g.label })}>
                        <span className="ev__thumb" aria-hidden="true">
                          {e.shots[0] ? (
                            <img src={e.shots[0].src} alt="" width={e.shots[0].w} height={e.shots[0].h} loading="lazy" decoding="async" />
                          ) : (
                            <span className="ev__thumb-none">Evidence on GitHub</span>
                          )}
                        </span>
                        <span className="ev__panel-meta" aria-hidden="true">Phase {e.phase} · {g.label}</span>
                        <span className="ev__panel-title" aria-hidden="true">{e.title}</span>
                      </button>
                    ))}
                  </li>
                ))}
              </ul>

              {/* Learning and Next: on the back wall, never lit */}
              <div className="ev__shelf">
                <div className="ev__tier ev__tier--learning">
                  <span className="ev__tier-label">Learning · SC-300 study</span>
                  <ul>{learning.map((l) => <li key={l}><span>In study</span>{l}</li>)}</ul>
                </div>
                <div className="ev__tier ev__tier--next">
                  <span className="ev__tier-label">Next · planned labs</span>
                  <ul>{next.map((l) => <li key={l}><span>Planned</span>{l}</li>)}</ul>
                </div>
              </div>
            </div>
          </div>

          {/* The exit portal: the last frame, and About's first (lib/portal) */}
          <div className="portal" aria-hidden="true" />

          {/* L4 · foreground bulkhead ribs */}
          <span className="ev__fg ev__fg--l" aria-hidden="true" />
          <span className="ev__fg ev__fg--r" aria-hidden="true" />
        </div>

        <div className="ev__copy">
          <p className="ev__kicker mono">Validation · CFG evidence</p>
          <header className="ev__head">
            <h2 id="validation-title" className="ev__title">Validation.</h2>
            <p className="ev__lede">The evidence vault. Only completed CFG lab work is stored here.</p>
          </header>
          <ol className="ev__beats">
            <li className="ev__beat" data-sc-cue="0.257 0.386 0.25">
              <h3 className="ev__beat-title">{demonstratedCount} capabilities. Each one on file.</h3>
              <p className="ev__beat-body">Grouped by what they prove, from CFG Phase 1 and Phase 2.</p>
            </li>
            <li className="ev__beat" data-sc-cue="0.394 0.677 0.14">
              <h3 className="ev__beat-title">Verify the work.</h3>
              <p className="ev__beat-body">Select a lit panel for the redacted screenshot, the case study and the GitHub source.</p>
            </li>
          </ol>
          <div className="ev__end">
            <ul className="ev__legend">
              <li data-tier="demonstrated"><b>Demonstrated</b><span>{demonstratedCount}</span><em>Completed CFG lab evidence</em></li>
              <li data-tier="learning"><b>Learning</b><span>{learning.length}</span><em>SC-300 study, not yet built</em>
                <small>{learning.join(" · ")}</small></li>
              <li data-tier="next"><b>Next</b><span>{next.length}</span><em>Planned hands-on labs</em>
                <small>{next.join(" · ")}</small></li>
            </ul>
            <p className="ev__rule">Nothing moves up a tier without evidence.</p>
          </div>
        </div>
      </div>

      <dialog ref={dialog} className="ev__dialog" aria-labelledby="ev-dialog-title"
        onClose={() => setOpen(null)}
        onClick={(ev) => { if (ev.target === dialog.current) dialog.current?.close(); }}>
        {open && (
          <div className="ev__sheet">
            <header className="ev__sheet-head">
              <p className="mono">CFG Phase {open.e.phase} · {open.group}</p>
              <button type="button" className="ev__close" onClick={() => dialog.current?.close()} aria-label="Close evidence">×</button>
            </header>
            <h3 id="ev-dialog-title" className="ev__sheet-title">{open.e.title}</h3>
            <p className="ev__sheet-claim">{open.e.claim}</p>
            {open.e.shots.length > 0 ? (
              <>
                <div className="ev__shots">
                  {open.e.shots.map((s) => (
                    <figure key={s.src}>
                      <img src={s.src} alt={s.alt} width={s.w} height={s.h} />
                    </figure>
                  ))}
                </div>
                <p className="ev__redacted mono">Redacted copy · admin account, tenant domain and browser bar hidden</p>
              </>
            ) : (
              <p className="ev__noshot">No preview on this site. The screenshots are documented in the CFG repository.</p>
            )}
            <div className="ev__sheet-links">
              <a className="btn btn--solid" href={casePage(open.e.phase)}>Phase {open.e.phase} case study</a>
              <a className="ev__gh" href={open.e.github.href} target="_blank" rel="noopener noreferrer">
                {open.e.github.label} on GitHub <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
