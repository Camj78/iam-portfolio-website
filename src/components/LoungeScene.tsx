"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { path, seg, smooth, follow, clamp01, styleWriter } from "@/lib/camera-path";
import { texture, vgrad, glow, stripes } from "@/lib/texture";
import { lounge, episodes } from "@/content/lounge";
import PLATES from "@/content/lounge-plates.json";

/*
  The Access Lounge: entering the studio.

  One pinned Scroll Craft act (span 5, 4 on phones). The engine pins the stage,
  publishes p as --sc-p and fades the copy (data-sc-cue). This component moves
  a camera through flat depth planes cut from the podcast cover
  (scripts/prepare-lounge.py): the room, each host, and the desk with its
  microphones. No CSS 3D: each plane gets one 2D translate and scale from its
  depth, so the GPU only re-samples finished images and nothing re-rasterizes.

    0.00  THRESHOLD  A studio door in a dark slatted wall. "The podcast".
    0.10             The ON AIR box by the door warms up.
    0.20  ON AIR     The doors slide into the wall; the camera walks in.
    0.30             The studio lights come up.
    0.44  STUDIO     The reveal: both hosts at their mics. Title, tagline,
                     and the AI-generated hosts disclosure.
    0.60  TWO SEATS  A slow push with a slight truck; the planes part in depth.
                     The pillars on the desk front.
    0.80  RUNDOWN    The sign changes to IN PRODUCTION; the camera tilts to the
                     desk, where the three planned topics lie, none recorded.

  Light changes are opacity on their own small layers; backdrops are painted
  once into canvas textures (lib/texture). Reduced motion and no-JS: a still
  of the studio with the copy beside it.
*/

const F = PLATES.frame;
const P = PLATES.plates;
type PlateName = keyof typeof P;

/** Position a plate inside the studio frame, in % of the frame. */
const at = (n: PlateName): CSSProperties => {
  const p = P[n] as { x: number; y: number; w: number; h: number };
  return {
    left: `${((p.x / F.w) * 100).toFixed(3)}%`, top: `${((p.y / F.h) * 100).toFixed(3)}%`,
    width: `${((p.w / F.w) * 100).toFixed(3)}%`, height: `${((p.h / F.h) * 100).toFixed(3)}%`,
  };
};
const src = (n: string) => `/lounge/optimized/lounge-${n}.webp`;

/** Camera smoothing time constant, ms (rounds off wheel steps only). */
const TAU = 45;
/** Cover px of the cover's own frame inside the studio frame. */
const EXT = (F.w - 1254) / 2;

/*
  Staging per breakpoint. Depths are distances from the camera at the reveal,
  in studio-frame px; every plane is authored at its reveal size, so s = 1 at
  z = 0 and the depths only set how fast each plane grows. FL is the focal
  length for sideways moves. cam: [p, z]; truck: [p, x]; tilt: [p, y shift].

  A medium-wide two-shot: the hosts sit deep, so they hold nearly the same size
  from the doorway on (about 6% over the whole walk-in, 1% after the reveal);
  the desk and microphones sit near the lens and carry most of the parallax.
*/
const GEO = {
  desktop: {
    span: 5, FL: 1000,
    d: { room: 4200, h2: 2500, h1: 2300, fg: 1100, door: 200 },
    cam: [[0, -150], [0.16, -150], [0.5, 0], [0.8, 26], [1, 30]],
    truck: [[0, 0], [0.52, 0], [0.8, 36], [1, 40]],
    tilt: [[0, 0], [0.8, 0], [0.94, -50], [1, -50]],
    eye: 470,                       // frame row of the vanishing point (the hosts' eyes)
  },
  mobile: {
    span: 4, FL: 1000,
    d: { room: 4200, h2: 2500, h1: 2300, fg: 1100, door: 200 },
    cam: [[0, -130], [0.16, -130], [0.5, 0], [0.8, 20], [1, 24]],
    truck: [[0, 0], [0.52, 0], [0.8, 24], [1, 26]],
    tilt: [[0, 0], [0.8, 0], [0.94, -30], [1, -30]],
    eye: 470,
  },
};

/*
  The composition that must always be in view, in studio-frame px: both hosts
  (hair to sleeves), both microphones, and the desk with a strip of its front.
*/
const KEY = { x0: 380, x1: 1680, y0: 270, y1: 1110 };
/** Desktop: the hosts span about half the screen, a medium-wide two-shot. */
const HOSTS_SHARE = 0.5;
const HOSTS_W = 1254;

export function LoungeScene() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = root.current!;
    const stage = section.querySelector<HTMLElement>(".lg__stage")!;
    const visual = section.querySelector<HTMLElement>(".lg__visual")!;
    const q = (s: string) => section.querySelector<HTMLElement>(s)!;
    const small = matchMedia("(max-width: 860px)");

    // Fetch and decode the plates while the browser is idle after load, not
    // when the stage approaches: warming them mid-scroll cost Certifications a
    // 130 ms frame on an integrated GPU.
    const imgs = Array.from(section.querySelectorAll<HTMLImageElement>(".lg__visual img"));
    const warmUp = () => imgs.forEach((im) => { im.loading = "eager"; im.decode?.().catch(() => {}); });
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(warmUp, { timeout: 4000 })
      : window.setTimeout(warmUp, 2500);
    const cancelWarm = () => (window.cancelIdleCallback ? window.cancelIdleCallback(idle) : window.clearTimeout(idle));

    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // The still: take the act out of the engine before it mounts.
      section.removeAttribute("data-sc-act");
      return cancelWarm;
    }
    section.setAttribute("data-sc-span", String(small.matches ? GEO.mobile.span : GEO.desktop.span));
    section.setAttribute("data-live", "");
    const w = styleWriter();

    const el = {
      room: q(".lg__plane--room"), h2: q(".lg__plane--h2"), h1: q(".lg__plane--h1"), fg: q(".lg__plane--fg"),
      door: q(".lg__plane--door"), wall: q(".lg__wall"), gap: q(".lg__doorway"),
      leafL: q(".lg__leaf--l"), leafR: q(".lg__leaf--r"), seam: q(".lg__seam"), spill: q(".lg__spill"),
      doorSign: q(".lg__door-sign"), doorLit: q(".lg__door-sign .lg__lit"),
      signOn: q(".lg__sign-on"), signProd: q(".lg__sign-prod"),
      dim: q(".lg__dim"), seamTop: q(".lg__from-cert"),
      pillars: q(".lg__pillars ul"),
      head: q(".lg__head"), tagline: q(".lg__tagline"), lede: q(".lg__lede"), rundown: q(".lg__rundown"),
    };
    const planes = [["room", el.room], ["h2", el.h2], ["h1", el.h1], ["fg", el.fg]] as const;

    let G = GEO.desktop;
    let cam = path(G.cam), truck = path(G.truck), tilt = path(G.tilt);
    let f = 1, W = 1, H = 1, vx = 0, vy = 0, deskRest = 0;
    let door = { x0: 0, y0: 0, x1: 0, y1: 0 };
    let target = 0, current = -1, raf = 0, dead = false, lastT = 0, lastApplied = -1;
    let top = 0, travel = 1;

    const measure = () => {
      G = small.matches ? GEO.mobile : GEO.desktop;
      cam = path(G.cam); truck = path(G.truck); tilt = path(G.tilt);
      W = visual.clientWidth; H = visual.clientHeight;
      top = section.getBoundingClientRect().top + scrollY;
      travel = Math.max(1, section.offsetHeight - innerHeight);
      if (!W || !H) return;

      // The studio frame: fit the composition (KEY) into the space the copy
      // leaves, never fill the stage with it. The room, its dark extensions and
      // the desk front carry on around it, so no edge of any plate shows.
      // Copy blocks are measured by offset (no cue transforms) against the copy layer.
      const bottomOf = (e: HTMLElement) => e.offsetTop + e.offsetHeight;
      const kh = KEY.y1 - KEY.y0;
      let kTop: number, kBottom: number;
      if (small.matches) {
        // Phones and portrait tablets: the copy above (title, then the rundown), the studio below,
        // clear of the access-path pill at the bottom edge.
        kTop = Math.max(bottomOf(el.head), bottomOf(el.tagline), bottomOf(el.lede), bottomOf(el.rundown)) + 30;
        kBottom = H - 76;
        f = Math.min((0.92 * W) / (KEY.x1 - KEY.x0), (kBottom - kTop) / kh);
      } else {
        // Desktop: under the title block, with clearance; the hosts about half the width.
        kTop = Math.max(bottomOf(el.head), bottomOf(el.tagline), bottomOf(el.lede)) + 0.035 * H;
        kBottom = H - 0.03 * H;
        f = Math.min((HOSTS_SHARE * W) / HOSTS_W, (kBottom - kTop) / kh);
      }
      f = Math.max(0.12, f);
      const bx = W / 2 - (EXT + 627) * f;
      const by = kTop + (kBottom - kTop - kh * f) / 2 - KEY.y0 * f;
      stage.style.setProperty("--ai-y", `${(by + KEY.y0 * f - 26).toFixed(1)}px`);
      vx = bx + (EXT + 627) * f;
      vy = by + G.eye * f;
      const bw = F.w * f, bh = F.h * f;
      stage.style.setProperty("--bx", `${bx.toFixed(1)}px`);
      stage.style.setProperty("--by", `${by.toFixed(1)}px`);
      stage.style.setProperty("--bw", `${bw.toFixed(1)}px`);
      stage.style.setProperty("--bh", `${bh.toFixed(1)}px`);
      stage.style.setProperty("--vo", `${vx.toFixed(1)}px ${vy.toFixed(1)}px`);
      deskRest = by + P.deskEdge.y * f;
      stage.style.setProperty("--desk-y", `${deskRest.toFixed(1)}px`);
      stage.style.setProperty("--f", f.toFixed(4));

      // The doorway: at the reveal (s = 1) it just clears the stage, so the
      // camera has walked through it. Sized to the stage, not the studio frame,
      // on every screen. The sill sits well below the view, so it passes under
      // the desk before the studio shows behind it, instead of cutting across it.
      const pad = 0.03;
      door = { x0: -W * pad, y0: -H * 0.1, x1: W * (1 + pad), y1: H * 1.24 };
      const gw = door.x1 - door.x0, gh = door.y1 - door.y0;
      Object.assign(el.gap.style, { left: `${door.x0}px`, top: `${door.y0}px`, width: `${gw}px`, height: `${gh}px` });

      // The wall must cover the stage at the camera's furthest point.
      const sMin = G.d.door / (G.d.door - G.cam[0][1]);
      const wx0 = vx - vx / sMin - 40, wx1 = vx + (W - vx) / sMin + 40;
      const wy0 = vy - vy / sMin - 40, wy1 = vy + (H - vy) / sMin + 40;
      Object.assign(el.wall.style, { left: `${wx0}px`, top: `${wy0}px`, width: `${wx1 - wx0}px`, height: `${wy1 - wy0}px` });
      const k = Math.max(0.6, f / 0.7);
      texture(el.wall, wx1 - wx0, wy1 - wy0, 0.5, (c, ww, wh) => {
        const ox = door.x0 - wx0, oy = door.y0 - wy0;
        // the wall: dark navy acoustic slats, a cool wash from the left
        c.fillStyle = vgrad(c, 0, wh, [[0, "#04070d"], [0.45, "#07101e"], [1, "#03060b"]]);
        c.fillRect(0, 0, ww, wh);
        stripes(c, ww, wh, "x", 44 * k, 5 * k, "rgba(0,0,0,0.55)", ox);
        glow(c, ox - 0.05 * gw, oy + 0.35 * gh, 0.7 * gw, 0.9 * gh, [[0, "rgba(46,92,200,0.16)"], [1, "rgba(46,92,200,0)"]]);
        // two downlights washing the wall either side of the doors
        for (const sx of [ox - 0.12 * gw, ox + 1.12 * gw]) {
          glow(c, sx, oy + 0.05 * gh, 0.16 * gw, 0.7 * gh, [[0, "rgba(243,171,60,0.13)"], [0.6, "rgba(243,171,60,0.03)"], [1, "rgba(243,171,60,0)"]]);
        }
        // the floor in front of the doors
        const fy = oy + gh;
        c.fillStyle = vgrad(c, fy, wh, [[0, "#0a0f19"], [1, "#020307"]]);
        c.fillRect(0, fy, ww, wh - fy);
        glow(c, ox + gw / 2, fy + 6 * k, 0.55 * gw, 0.18 * gh, [[0, "rgba(243,171,60,0.12)"], [1, "rgba(243,171,60,0)"]]);
        // the frame: a dark reveal with a thin lit edge
        const t = 18 * k;
        c.fillStyle = "#020408";
        c.fillRect(ox - t, oy - t, gw + 2 * t, gh + t);
        c.fillStyle = "rgba(243,171,60,0.5)";
        c.fillRect(ox - t, oy - t, gw + 2 * t, 1.5 * k);
        c.fillStyle = "rgba(120,150,210,0.18)";
        c.fillRect(ox - t, oy - t, 1.5 * k, gh + t);
        c.fillRect(ox + gw + t - 1.5 * k, oy - t, 1.5 * k, gh + t);
        c.clearRect(ox, oy, gw, gh);
      });
      const leaf = (cv: HTMLElement, side: "l" | "r") => texture(cv, gw / 2, gh, 0.5, (c, lw, lh) => {
        c.fillStyle = vgrad(c, 0, lh, [[0, "#0b1222"], [0.55, "#0d1628"], [1, "#060a13"]]);
        c.fillRect(0, 0, lw, lh);
        stripes(c, lw, lh, "x", 30 * k, 2.5 * k, "rgba(0,0,0,0.45)");
        // brushed sheen, brighter toward the lit seam
        const sx = side === "l" ? lw : 0;
        glow(c, sx, lh * 0.45, lw * 0.6, lh * 0.8, [[0, "rgba(140,170,230,0.10)"], [1, "rgba(140,170,230,0)"]]);
        // a tall glass slot with the studio's warm light behind it
        const gx = side === "l" ? lw * 0.76 : lw * 0.18, gW = lw * 0.06;
        c.fillStyle = vgrad(c, lh * 0.16, lh * 0.6, [[0, "rgba(243,171,60,0.34)"], [0.5, "rgba(214,138,52,0.22)"], [1, "rgba(160,96,34,0.12)"]]);
        c.fillRect(gx, lh * 0.16, gW, lh * 0.44);
        c.strokeStyle = "rgba(0,0,0,0.8)"; c.lineWidth = 3 * k;
        c.strokeRect(gx, lh * 0.16, gW, lh * 0.44);
        // pull handle by the seam
        const hx = side === "l" ? lw * 0.93 : lw * 0.05;
        c.fillStyle = vgrad(c, lh * 0.4, lh * 0.64, [[0, "#c9a160"], [0.5, "#7a5a2c"], [1, "#3b2a14"]]);
        c.fillRect(hx, lh * 0.4, 5 * k, lh * 0.24);
        // the edge at the seam catches the light
        c.fillStyle = "rgba(243,171,60,0.35)";
        c.fillRect(side === "l" ? lw - 2 * k : 0, 0, 2 * k, lh);
      });
      leaf(el.leafL, "l");
      leaf(el.leafR, "r");
      // the ON AIR box: right of the doors, near the top
      Object.assign(el.doorSign.style, { left: `${door.x1 + 30 * k}px`, top: `${door.y0 + 0.02 * gh}px` });
      Object.assign(el.spill.style, { left: `${door.x0}px`, width: `${gw}px`, top: `${door.y1 - 10}px` });
      lastApplied = -1;
    };

    const apply = (p: number) => {
      const z = cam(p)[0], cx = truck(p)[0], ty = tilt(p)[0] * f;
      const place = (node: HTMLElement, d: number) => {
        const s = d / (d - z);
        const tx = (-cx * G.FL / (d - z)) * f;
        w.css(node, "transform", `translate3d(${tx.toFixed(2)}px,${ty.toFixed(2)}px,0) scale(${s.toFixed(5)})`);
        return s;
      };
      planes.forEach(([n, node]) => place(node, G.d[n]));
      // The pillars are flat type (sharp at any scale) that ride the desk's front edge.
      const sf = G.d.fg / (G.d.fg - z);
      const deskY = vy + (deskRest - vy) * sf + ty;
      w.css(el.pillars, "transform", `translate3d(0,${(deskY - deskRest).toFixed(2)}px,0)`);

      // The doors: they slide into the wall as the camera walks in; once the
      // doorway has passed the edges of the stage the whole plane goes.
      const sd = place(el.door, G.d.door);
      const out = vx + (door.x0 - vx) * sd <= 0 && vx + (door.x1 - vx) * sd >= W
        && vy + (door.y0 - vy) * sd <= 0 && vy + (door.y1 - vy) * sd >= H;
      w.css(el.door, "visibility", out ? "hidden" : "inherit");
      const open = smooth(seg(p, 0.2, 0.38));
      const half = (door.x1 - door.x0) / 2 + 8;
      w.css(el.leafL, "transform", `translate3d(${(-open * half).toFixed(1)}px,0,0)`);
      w.css(el.leafR, "transform", `translate3d(${(open * half).toFixed(1)}px,0,0)`);
      const lit = smooth(seg(p, 0.1, 0.18));
      w.css(el.doorLit, "opacity", lit.toFixed(3));
      w.css(el.seam, "opacity", ((0.35 + 0.65 * lit) * (1 - smooth(seg(p, 0.22, 0.3)))).toFixed(3));
      w.css(el.spill, "opacity", (0.3 + 0.7 * Math.max(lit * 0.6, open)).toFixed(3));

      // Studio lights come up as the doors part.
      const dim = 0.66 * (1 - smooth(seg(p, 0.27, 0.47)));
      w.css(el.dim, "opacity", dim.toFixed(3));
      w.css(el.dim, "visibility", dim > 0.003 ? "inherit" : "hidden");

      // The sign tells the truth before the act ends.
      w.css(el.signOn, "opacity", (1 - smooth(seg(p, 0.8, 0.825))).toFixed(3));
      w.css(el.signProd, "opacity", smooth(seg(p, 0.83, 0.86)).toFixed(3));

      // Certifications' ground carried over the stage's top edge as it slides in.
      const fromCert = 1 - smooth(seg(p, 0, 0.06));
      w.css(el.seamTop, "opacity", fromCert.toFixed(3));
      w.css(el.seamTop, "visibility", fromCert > 0.003 ? "inherit" : "hidden");
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
    const onResize = () => { measure(); current = -1; kick(); };

    // One progress source: the engine's p, applied in the engine's own frame.
    let engineLive = false, lastP = NaN;
    const mo = new MutationObserver(() => {
      const v = parseFloat(section.style.getPropertyValue("--sc-p"));
      if (Number.isNaN(v) || v === lastP) return;
      lastP = v; engineLive = true; target = v;
      if (step(performance.now())) kick();
    });
    mo.observe(section, { attributes: true, attributeFilter: ["style"] });
    const onScroll = () => { if (!engineLive) { target = clamp01((scrollY - top) / travel); kick(); } };
    // The engine sizes the acts after mount: re-measure whenever the page does.
    const ro = new ResizeObserver(() => { measure(); kick(); });
    ro.observe(document.body);
    // Fonts change the canvas lettering nowhere, but they move the page: re-measure once they land.
    document.fonts?.ready.then(() => { if (!dead) { measure(); kick(); } });
    // Focus on anything that only exists in the rundown: go there. Centring the
    // element (the engine's default) cannot move a sticky stage's progress.
    const onFocus = (e: FocusEvent) => {
      if (!(e.target as HTMLElement).closest(".lg__rundown")) return;
      e.stopPropagation();
      if (current > 0.9 && current <= 1) return;
      measure();
      window.scrollTo({ top: top + 0.95 * travel, behavior: "instant" });
    };

    measure(); onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onResize, { passive: true });
    small.addEventListener("change", onResize);
    section.addEventListener("focusin", onFocus);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      cancelWarm();
      mo.disconnect();
      ro.disconnect();
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onResize);
      small.removeEventListener("change", onResize);
      section.removeEventListener("focusin", onFocus);
      section.removeAttribute("data-live");
    };
  }, []);

  const plate = (n: PlateName, cls = "") => (
    <img className={`lg__plate ${cls}`} src={src(n)} style={at(n)} alt="" loading="lazy" decoding="async" draggable={false} />
  );

  return (
    <section ref={root} id="lounge" className="lg chapter--lounge" data-sc-act="pin" data-sc-span="5" data-ground="lounge"
      aria-labelledby="lounge-title">
      <div className="lg__stage" data-sc-stage>
        <div className="lg__visual" role="img" aria-label={lounge.sceneAlt}>
          {/* L0 · the room, with the sign on its wall */}
          <div className="lg__plane lg__plane--room">
            <div className="lg__frame">
              <span className="lg__sky" />
              {plate("room", "lg__room")}
              <span className="lg__room-fade" />
              <span className="lg__room-edge lg__room-edge--l" />
              <span className="lg__room-edge lg__room-edge--r" />
              <div className="lg__sign" style={at("sign")}>
                <span className="lg__sign-on">On air</span>
                <span className="lg__sign-prod">In production</span>
              </div>
            </div>
          </div>
          {/* L2 · the host on the right, a step further back */}
          <div className="lg__plane lg__plane--h2">
            <div className="lg__frame">{plate("host-2")}{plate("wing-r")}</div>
          </div>
          {/* L3 · the host on the left */}
          <div className="lg__plane lg__plane--h1">
            <div className="lg__frame">{plate("host-1")}{plate("wing-l")}</div>
          </div>
          {/* L4 · the desk and the microphones, nearest the lens */}
          <div className="lg__plane lg__plane--fg">
            <div className="lg__frame">{plate("desk-front")}{plate("desk")}{plate("mic-2")}{plate("mic-1")}</div>
          </div>
          <div className="lg__dim" />
          {/* The way in: a slatted wall, double doors, the ON AIR box */}
          <div className="lg__plane lg__plane--door">
            <div className="lg__wall" />
            <span className="lg__spill" />
            <div className="lg__doorway">
              <div className="lg__leaf lg__leaf--l" />
              <div className="lg__leaf lg__leaf--r" />
              <span className="lg__seam" />
            </div>
            <div className="lg__door-sign"><span>On air</span><span className="lg__lit">On air</span></div>
          </div>
          <div className="lg__vignette" />
          <div className="lg__from-cert" />
        </div>

        <div className="lg__copy">
          <p className="lg__kicker mono" data-sc-cue="0.005 0.42 0.06 0.25">The podcast</p>
          <div className="lg__head" data-sc-cue="0.44 0.84 0.16 0.16">
            <h2 id="lounge-title" className="lg__title">The Access <span>Lounge</span></h2>
          </div>
          <p className="lg__tagline mono" data-sc-cue="0.45 0.63 0.2 0.25">{lounge.tagline}</p>
          <p className="lg__lede" data-sc-cue="0.62 0.84 0.22 0.2">{lounge.lede}</p>
          <p className="lg__ai mono" data-sc-cue="0.46 1.5 0.06"><i aria-hidden="true" />{lounge.disclosure}</p>
          <div className="lg__pillars" data-sc-cue="0.6 0.84 0.22 0.2">
            <ul className="mono" aria-label="What the show covers">
              {lounge.pillars.map((x) => <li key={x}>{x}</li>)}
            </ul>
          </div>
          <div className="lg__rundown" data-sc-cue="0.83 1.5 0.1">
            <p className="lg__status"><span className="lg__badge mono" aria-hidden="true">In production</span><span>{lounge.status}</span></p>
            <h3 className="lg__rundown-title mono">Planned topics · not yet recorded</h3>
            <ol className="lg__topics">
              {episodes.map((e) => (
                <li key={e.slug}>
                  <span className="mono">Planned · not yet recorded</span>
                  <b>{e.title}</b>
                </li>
              ))}
            </ol>
            <p className="lg__more">{lounge.statusMore}</p>
            <a className="lg__next" href="#contact">Next · Request access <span aria-hidden="true">↓</span></a>
          </div>
        </div>
      </div>
    </section>
  );
}
