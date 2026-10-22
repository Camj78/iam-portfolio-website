/*
  Transparent frame-sequence player for a <canvas>.

  draw(f) takes a fractional frame index. Between two frames it blends with
  additive compositing of premultiplied pixels ("lighter"), which is an exact
  linear interpolation: where both frames are opaque the result stays opaque,
  so the character never turns see-through mid-blend the way two stacked
  opacity fades do.

  `dissolve` narrows the blend to a window inside each step. With three stills
  that keeps every pose crisp and dissolves only through the middle of a turn.
  For a dense sequence pass [0, 1] for a plain linear blend.

  Two players may share one canvas (a light set shown while a dense one loads);
  only the one being drawn paints.
*/

export type FramePlayer = {
  draw(f: number): void;
  resize(): void;
  dispose(): void;
};

type Options = {
  dissolve?: [number, number];
  /** Fetch priority for the frames ("low" for a set loaded behind a visible one). */
  priority?: "high" | "low" | "auto";
  onReady?: () => void;
  onFirstDraw?: () => void;
};

const smooth = (a: number, b: number, t: number) => {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

export function createFramePlayer(canvas: HTMLCanvasElement, urls: string[], opts: Options = {}): FramePlayer {
  const ctx = canvas.getContext("2d", { alpha: true })!;
  const [d0, d1] = opts.dissolve ?? [0, 1];
  const frames: HTMLImageElement[] = [];
  let ready = false, disposed = false, last = -1, lastF = 0, painted = false;

  // Every frame decoded before the canvas takes over from the poster, so the
  // stage never shows a partial set.
  Promise.all(
    urls.map((src) => {
      const img = new Image();
      img.decoding = "async";
      img.fetchPriority = opts.priority ?? "auto";
      img.src = src;
      frames.push(img);
      return img.decode();
    }),
  ).then(
    () => {
      if (disposed) return;
      ready = true;
      resize();
      opts.onReady?.();
    },
    () => { /* keep the static poster */ },
  );

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (w && h && (canvas.width !== w || canvas.height !== h)) { canvas.width = w; canvas.height = h; }
    last = -1;
    // Resizing clears the bitmap; repaint the current frame immediately. Nothing is
    // painted before the first draw(), so a player that finishes loading behind
    // another one sharing the canvas never paints over it.
    if (ready && painted) draw(lastF);
  }

  function draw(f: number) {
    if (!ready || disposed) return;
    lastF = f;
    const max = frames.length - 1;
    const fi = Math.min(max, Math.max(0, f));
    const i0 = Math.floor(fi), t = smooth(d0, d1, fi - i0);
    const key = Math.round((i0 + t) * 1000);
    if (key === last) return;
    last = key;

    const { width: w, height: h } = canvas;
    if (!w || !h) return;
    if (!painted) { painted = true; queueMicrotask(() => opts.onFirstDraw?.()); }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, w, h);
    if (t <= 0.001 || i0 >= max) { ctx.drawImage(frames[i0], 0, 0, w, h); return; }
    if (t >= 0.999) { ctx.drawImage(frames[i0 + 1], 0, 0, w, h); return; }
    ctx.globalAlpha = 1 - t;
    ctx.drawImage(frames[i0], 0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = t;
    ctx.drawImage(frames[i0 + 1], 0, 0, w, h);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }

  return {
    draw,
    resize,
    dispose() { disposed = true; frames.length = 0; },
  };
}
