/*
  The exit portal: the one frame Validation ends on and About begins from.

  Validation backs out of the chamber through a round door and the lights go
  down; About opens on the same ring and the studio lights come up inside it.
  Both acts draw the same .portal element at the same place and size, so at
  the hand-off (Validation p = 1, About p = 0) the two stages are pixel for
  pixel the same picture and the switch between them cannot be seen.

  About's camera starts behind a ring at depth `ringZ` and dollies through it;
  the portal's on-screen scale is that ring's perspective scale relative to the
  first frame.
*/

import { texture } from "@/lib/texture";

export const PORTAL = {
  desktop: { base: [1440, 900], kMin: 0.7, kMax: 1.35, vx: 60, vy: 54, P: 1100, ringZ: 500, camZ0: -1600, hole: 760 },
  // Phone: a ring that sits inside the portrait frame (about 0.42 of its width).
  mobile: { base: [390, 760], kMin: 0.8, kMax: 1.9, vx: 50, vy: 63, P: 760, ringZ: 380, camZ0: -1300, hole: 360 },
};

export type PortalFrame = { k: number; cx: number; cy: number; r: number; small: boolean };

/** Stage scale k and the ring's first-frame centre and radius, in stage px. */
export function portalFrame(W: number, H: number, small: boolean): PortalFrame {
  const G = small ? PORTAL.mobile : PORTAL.desktop;
  const k = Math.max(G.kMin, Math.min(Math.min(W / G.base[0], H / G.base[1]), G.kMax));
  const s0 = G.P / (G.P - (G.ringZ + G.camZ0));
  // Short phones drop the horizon so the final slab clears the closing copy.
  const vy = small && H < 700 ? 58 : G.vy;
  return { k, cx: (G.vx / 100) * W, cy: (vy / 100) * H, r: G.hole * k * s0, small };
}

/**
  Paint the portal for this stage size (once per resize). The ring and its
  plate are one canvas texture, the darkness inside it another, so scaling
  and darkening the portal never re-rasterizes anything (lib/texture).
*/
export function placePortal(el: HTMLElement, f: PortalFrame) {
  const W = el.clientWidth || 1, H = el.clientHeight || 1;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  el.style.setProperty("--px", `${f.cx.toFixed(1)}px`);
  el.style.setProperty("--py", `${f.cy.toFixed(1)}px`);
  el.style.setProperty("--pr", `${f.r.toFixed(1)}px`);
  const { cx, cy, r } = f;
  texture(el, W, H, dpr, (c, w, h) => {
    const R = r * 1.7;
    const g = c.createRadialGradient(cx, cy, 0, cx, cy, R);
    const at = (x: number) => Math.min(1, x / R);
    g.addColorStop(0, "rgba(7,12,10,0)");
    g.addColorStop(at(r - 1), "rgba(7,12,10,0)");
    g.addColorStop(at(r), "rgba(102,199,147,0.75)");
    g.addColorStop(at(r + 4), "#1c2c24");
    g.addColorStop(at(r * 1.1), "#121d18");
    g.addColorStop(at(r * 1.105), "#0a120e");
    g.addColorStop(1, "#070c0a");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    // The rim's glow, inside and out.
    const gl = c.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.1);
    gl.addColorStop(0, "rgba(102,199,147,0)");
    gl.addColorStop(0.5, "rgba(102,199,147,0.16)");
    gl.addColorStop(1, "rgba(102,199,147,0)");
    c.fillStyle = gl;
    c.fillRect(cx - r * 1.1, cy - r * 1.1, r * 2.2, r * 2.2);
  });
  texture(el, W, H, Math.min(dpr, 1), (c) => {
    c.fillStyle = "#070c0a";
    c.beginPath();
    c.arc(cx, cy, r + 1, 0, Math.PI * 2);
    c.fill();
  }, "tex-dark");
  el.append(el.querySelector("canvas.tex-dark")!);
  drawn.delete(el);
}

const drawn = new WeakMap<HTMLElement, string>();

/**
  Scale (1 = the shared first frame, larger = nearer the lens) and interior
  darkness. Transform and opacity only, so the compositor does the work.
*/
export function drawPortal(el: HTMLElement, scale: number, darkness: number) {
  const on = scale < 5;   // past ~5x the rim has left every screen edge
  const key = on ? `${scale.toFixed(4)}|${darkness.toFixed(3)}` : "off";
  if (drawn.get(el) === key) return;
  drawn.set(el, key);
  el.style.visibility = on ? "inherit" : "hidden";
  if (!on) return;
  el.style.transform = `scale(${scale.toFixed(4)})`;
  const dark = el.querySelector<HTMLElement>("canvas.tex-dark");
  if (dark) dark.style.opacity = darkness.toFixed(3);
}
