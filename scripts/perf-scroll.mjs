// Continuous-scroll performance and motion harness for Validation → About.
//
// Headed Chrome on the real GPU, Retina density, driven by a stream of wheel
// events (not jumps to fixed progress). Records, per animation frame: the frame
// interval, scrollY, the engine's --sc-p for both acts, and the camera transform
// each component actually wrote. Long animation frames come from the LoAF API.
//
//   node scripts/perf-scroll.mjs --label before [--pattern trackpad|wheel|fast|reverse|all] [--headless]
//
// Synthetic wheel events go through Chrome's real input and scroll pipeline
// (Input.dispatchMouseEvent), but they are not physical trackpad input: there is
// no OS momentum phase and no hardware event timing. The "trackpad" pattern
// imitates both with small, eased deltas at display rate.
import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const LABEL = arg("--label", "run");
const PATTERN = arg("--pattern", "all");
const [VW, VH] = arg("--size", "1440x790").split("x").map(Number);
const DPR = +arg("--dpr", "2");
const URL = arg("--url", "http://localhost:4500");
const OUT = `lab/perf/${LABEL}`;
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: process.argv.includes("--headless"),
  args: [`--window-size=${VW},${VH + 120}`, "--window-position=0,0", "--disable-background-timer-throttling", "--disable-renderer-backgrounding"],
});
const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: DPR });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(800);

const geo = await page.evaluate(() => {
  const r = (id) => { const e = document.getElementById(id); const b = e.getBoundingClientRect(); return { top: b.top + scrollY, h: e.offsetHeight }; };
  return { lifecycle: r("lifecycle"), validation: r("validation"), about: r("about"), cert: r("certifications"), vh: innerHeight, gpu: (() => { const c = document.createElement("canvas").getContext("webgl"); const d = c && c.getExtension("WEBGL_debug_renderer_info"); return d ? c.getParameter(d.UNMASKED_RENDERER_WEBGL) : "unknown"; })() };
});
const START = geo.validation.top - geo.vh * 1.0;             // the end of Lifecycle
const END = geo.about.top + geo.about.h + geo.vh * 0.2;       // into Certifications

// In-page recorder: one sample per animation frame, nothing that forces layout.
await page.addScriptTag({ content: `
(() => {
  const num = (s) => (s || "").match(/-?\\d+(\\.\\d+)?/g)?.map(Number) || [];
  const v = document.getElementById("validation"), a = document.getElementById("about");
  const vw = v.querySelector(".ev__world"), aw = a.querySelector(".ab__world");
  const aCue = a.querySelector(".ab__scene--2 .ab__title"), vCue = v.querySelector(".ev__beat");
  window.__rec = { on: false, frames: [], loaf: [] };
  try {
    new PerformanceObserver((l) => { if (!__rec.on) return; for (const e of l.getEntries()) __rec.loaf.push({ scripts: (e.scripts || []).map((s) => ({ inv: s.invoker, fn: s.sourceFunctionName, src: (s.sourceURL || "").split("/").pop().slice(0, 60), d: Math.round(s.duration), forced: Math.round(s.forcedStyleAndLayoutDuration || 0) })), t: e.startTime, d: e.duration, block: e.blockingDuration, render: e.renderStart ? e.startTime + e.duration - e.renderStart : 0, style: e.styleAndLayoutStart ? e.startTime + e.duration - e.styleAndLayoutStart : 0 }); })
      .observe({ type: "long-animation-frame", buffered: false });
  } catch (e) {}
  let last = 0;
  const tick = (t) => {
    if (__rec.on) {
      __rec.frames.push({ t, dt: last ? t - last : 0, y: scrollY,
        pv: parseFloat(v.style.getPropertyValue("--sc-p")), pa: parseFloat(a.style.getPropertyValue("--sc-p")),
        cv: num(vw.style.transform), ca: num(aw.style.transform),
        ov: +(vCue.style.opacity || 0), oa: +(aCue.style.opacity || 0) });
    }
    last = t;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();` });

await page.mouse.move(VW / 2, VH / 2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Stream wheel deltas at a fixed cadence until the page reaches `to`. */
async function stream(to, speedPx, intervalMs, ease = true) {
  const dir = Math.sign(to - (await page.evaluate(() => scrollY)));
  let y = await page.evaluate(() => scrollY), i = 0;
  while (dir > 0 ? y < to - 2 : y > to + 2) {
    const t0 = Date.now();
    // Ease in over the first 20 events so the start is not a step.
    const k = ease ? Math.min(1, (i + 1) / 20) : 1;
    await page.mouse.wheel(0, dir * Math.max(1, Math.round(speedPx * k)));
    i++;
    if (i % 4 === 0) y = await page.evaluate(() => scrollY);
    const spent = Date.now() - t0;
    if (spent < intervalMs) await sleep(intervalMs - spent);
  }
}

const PATTERNS = {
  // Trackpad-like: small deltas at display cadence.
  trackpad: async () => { await stream(END, 14, 16); },
  slow: async () => { await stream(END, 5, 16); },
  // Notched mouse wheel: 100px per notch, ~12 notches a second.
  wheel: async () => { await stream(END, 100, 80, false); },
  fast: async () => { await stream(END, 70, 16); },
  probe: async () => { await stream(geo.validation.top + geo.vh * 2.5, 14, 16); },
  reverse: async () => { await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), END); await sleep(700); await stream(START, 14, 16); },
};

const runs = PATTERN === "all" ? ["trackpad", "wheel", "fast", "reverse"] : PATTERN.split(",");
const results = {};
for (const name of runs) {
  await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), name === "reverse" ? END : START);
  await sleep(900);
  await page.evaluate(() => { __rec.frames = []; __rec.loaf = []; __rec.on = true; });
  const t0 = Date.now();
  await PATTERNS[name]();
  await sleep(600); // let any smoothing settle on camera
  const data = await page.evaluate(() => { __rec.on = false; return { frames: __rec.frames, loaf: __rec.loaf }; });
  data.wallMs = Date.now() - t0;
  results[name] = data;
  await writeFile(`${OUT}/${name}.json`, JSON.stringify(data));
}
await browser.close();

// ---- summary --------------------------------------------------------------
const pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };
const summary = { label: LABEL, viewport: `${VW}x${VH}@${DPR}x`, gpu: geo.gpu, runs: {} };
for (const [name, d] of Object.entries(results)) {
  const f = d.frames.filter((x) => x.dt > 0);
  const dts = f.map((x) => x.dt);
  // Only frames while either act is on screen.
  const inAct = f.filter((x) => (x.pv > 0 && x.pv < 1) || (x.pa > 0 && x.pa < 1));
  const adt = inAct.map((x) => x.dt);
  // Lag between the engine's progress (what captions use) and the camera: count
  // frames where the camera transform had not changed while p had.
  let staleCam = 0;
  for (let i = 1; i < inAct.length; i++) {
    const a = inAct[i], b = inAct[i - 1];
    const pMoved = Math.abs(a.pv - b.pv) > 1e-4 || Math.abs(a.pa - b.pa) > 1e-4;
    const camMoved = a.cv.join() !== b.cv.join() || a.ca.join() !== b.ca.join();
    if (pMoved && !camMoved) staleCam++;
  }
  summary.runs[name] = {
    frames: f.length, wallMs: d.wallMs,
    fps: +(1000 / (dts.reduce((s, x) => s + x, 0) / dts.length)).toFixed(1),
    inActFps: adt.length ? +(1000 / (adt.reduce((s, x) => s + x, 0) / adt.length)).toFixed(1) : null,
    p50: +pct(adt, 0.5).toFixed(1), p95: +pct(adt, 0.95).toFixed(1), p99: +pct(adt, 0.99).toFixed(1), max: +Math.max(...adt).toFixed(1),
    over20ms: adt.filter((x) => x > 20).length, over33ms: adt.filter((x) => x > 33.4).length, over50ms: adt.filter((x) => x > 50).length,
    jankPct: +(100 * adt.filter((x) => x > 20).length / Math.max(1, adt.length)).toFixed(1),
    loaf: d.loaf.length, loafMax: d.loaf.length ? +Math.max(...d.loaf.map((x) => x.d)).toFixed(0) : 0,
    staleCameraFrames: staleCam,
  };
}
await writeFile(`${OUT}/summary.json`, JSON.stringify({ geo, ...summary }, null, 2));
console.log(JSON.stringify(summary, null, 2));
