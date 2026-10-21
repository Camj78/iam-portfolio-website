/*
  Painted textures for the big backdrop surfaces of the 3D stages.

  A CSS gradient on a 3D-transformed element is rasterized at the element's
  projected scale, and every camera move changes that scale, so Chrome
  re-rasterizes the whole surface frame after frame: on an integrated GPU at
  Retina density, the walls and floors alone held the acts near 20 fps. A
  composited <canvas> is a GPU texture instead: painted once here, then only
  sampled as the camera moves. The painters below reproduce the surfaces'
  original CSS gradients.

  `density` is texels per CSS px. Backdrops are soft and mostly far away, so
  a fraction of a texel per px is enough and keeps GPU memory small.
*/

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

/** Paint (or repaint) a texture canvas as the first child of `host`. */
export function texture(host: HTMLElement, w: number, h: number, density: number, draw: Draw, cls = "tex") {
  let c = host.querySelector<HTMLCanvasElement>(`:scope > canvas.${cls}`);
  if (!c) {
    c = document.createElement("canvas");
    c.className = cls;
    c.setAttribute("aria-hidden", "true");
    host.prepend(c);
  }
  const cw = Math.max(1, Math.round(w * density)), ch = Math.max(1, Math.round(h * density));
  if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; }
  const ctx = c.getContext("2d")!;
  ctx.setTransform(cw / w, 0, 0, ch / h, 0, 0);
  ctx.clearRect(0, 0, w, h);
  draw(ctx, w, h);
  host.classList.add("has-tex");
  return c;
}

/** A vertical linear gradient across [y0, y1] (may extend past the canvas). */
export function vgrad(ctx: CanvasRenderingContext2D, y0: number, y1: number, stops: [number, string][]) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  return g;
}

/** An elliptical radial glow centred at (cx, cy) with radii (rx, ry). */
export function glow(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, stops: [number, string][]) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(rx, ry);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  ctx.fillStyle = g;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}

/** Repeating stripes: `size` wide every `period`, from `offset`, along x or y. */
export function stripes(ctx: CanvasRenderingContext2D, w: number, h: number, axis: "x" | "y", period: number, size: number, color: string, offset = 0) {
  ctx.fillStyle = color;
  const len = axis === "x" ? w : h;
  let start = offset % period;
  if (start > 0) start -= period;
  for (let t = start; t < len; t += period) {
    if (axis === "x") ctx.fillRect(t, 0, size, h);
    else ctx.fillRect(0, t, w, size);
  }
}
