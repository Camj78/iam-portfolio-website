/*
  Camera choreography helpers shared by the pinned 3D acts.

  path(): a C1-continuous curve through keyframes [p, ...values], one monotone
  cubic Hermite spline per channel (Fritsch–Butland slopes). Velocity is
  continuous through every key, so a camera never stops in the middle of a move
  the way per-segment ease-in-out does; it only settles where the values
  actually hold (equal neighbouring keys) or turn around. It never overshoots a
  key, so a hold stays a hold. Affine-invariant: two channels keyed at the same
  p with proportional values move exactly in step.

  follow(): frame-rate independent smoothing toward the engine's progress.
*/

export type Path = (p: number) => number[];

export function path(keys: number[][]): Path {
  const n = keys.length;
  const xs = keys.map((k) => k[0]);
  const channels = keys[0].length - 1;
  const h = xs.slice(1).map((x, i) => x - xs[i]);
  const slopes: number[][] = [];
  for (let c = 0; c < channels; c++) {
    const ys = keys.map((k) => k[c + 1]);
    const d = h.map((hi, i) => (ys[i + 1] - ys[i]) / hi);
    const m = new Array<number>(n).fill(0);
    for (let i = 1; i < n - 1; i++) {
      if (d[i - 1] * d[i] <= 0) continue;          // a hold or a turn: settle here
      const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1];
      m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
    }
    slopes.push(m);                                  // ends at 0: ease in and out
  }
  return (p: number) => {
    if (p <= xs[0]) return keys[0].slice(1);
    if (p >= xs[n - 1]) return keys[n - 1].slice(1);
    let i = 0;
    while (p > xs[i + 1]) i++;
    const t = (p - xs[i]) / h[i], t2 = t * t, t3 = t2 * t;
    const h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
    const out = new Array<number>(channels);
    for (let c = 0; c < channels; c++) {
      const y0 = keys[i][c + 1], y1 = keys[i + 1][c + 1];
      out[c] = h00 * y0 + h10 * h[i] * slopes[c][i] + h01 * y1 + h11 * h[i] * slopes[c][i + 1];
    }
    return out;
  };
}

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
/** C1 ease for windows that are not part of a path. */
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
  Exponential follow with a time constant in ms. At 60 or 120 fps, or at 20
  when the machine is struggling, the camera trails the scroll by the same
  amount of time, so captions driven directly by the engine stay in sync.
*/
export function follow(current: number, target: number, dtMs: number, tauMs: number) {
  if (tauMs <= 0) return target;
  return current + (target - current) * (1 - Math.exp(-Math.min(dtMs, 100) / tauMs));
}

/**
  Style writes only when the value changes. Re-assigning an unchanged inline
  style still invalidates style for the element (and, for a custom property,
  its whole subtree), which on a 3D stage is most of the frame.
*/
export function styleWriter() {
  const last = new WeakMap<HTMLElement, Record<string, string>>();
  const changed = (el: HTMLElement, k: string, v: string) => {
    let m = last.get(el);
    if (!m) { m = {}; last.set(el, m); }
    if (m[k] === v) return false;
    m[k] = v;
    return true;
  };
  return {
    css(el: HTMLElement, prop: "transform" | "opacity" | "visibility" | "filter", v: string) {
      if (changed(el, prop, v)) el.style[prop] = v;
    },
    prop(el: HTMLElement, name: string, v: string) {
      if (changed(el, name, v)) el.style.setProperty(name, v);
    },
  };
}
