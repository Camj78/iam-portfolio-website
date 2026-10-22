// Continuous screen recording of Lifecycle's end → Validation → About →
// Certifications, scrolled with streams of wheel events (never jumps to fixed
// progress inside a segment). Headed Chrome on the real GPU at Retina density.
//
// Frames come from Chrome's compositor (CDP Page.startScreencast) with their
// presentation timestamps, and are retimed onto a constant 30 fps timeline:
// if the page drops frames, the video holds the last frame exactly as a viewer
// would have seen it, so stutter is visible rather than smoothed over.
// Encoded with Playwright's bundled ffmpeg (VP8 WebM: plays in Chrome/Safari).
//
//   node scripts/record-scroll.mjs [--out review/smoothness/scroll-desktop.webm]
import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { homedir } from "node:os";
import path from "node:path";

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const OUT = arg("--out", "review/smoothness/scroll-desktop.webm");
const [VW, VH] = arg("--size", "1440x790").split("x").map(Number);
const FFMPEG = path.join(homedir(), "Library/Caches/ms-playwright/ffmpeg-1011/ffmpeg-mac");
await mkdir(path.dirname(OUT), { recursive: true });

const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: false,
  args: [`--window-size=${VW},${VH + 120}`, "--window-position=0,0", "--disable-background-timer-throttling", "--disable-renderer-backgrounding"],
});
const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(arg("--url", "http://localhost:4500"), { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1000);

const g = await page.evaluate(() => {
  const r = (id) => { const e = document.getElementById(id); return { top: e.getBoundingClientRect().top + scrollY, h: e.offsetHeight }; };
  return { v: r("validation"), a: r("about"), vh: innerHeight };
});
const START = Math.round(g.v.top - g.vh);
const END = Math.round(g.a.top + g.a.h + g.vh * 0.25);
const at = (s, p) => Math.round(s.top + p * (s.h - g.vh));

// A small caption naming each segment, bottom right (outside the stages' copy).
await page.addStyleTag({ content: "#__seg{position:fixed;right:14px;bottom:12px;z-index:99999;font:600 12px/1.2 ui-monospace,monospace;letter-spacing:.06em;color:#0c1310;background:#ece7dc;padding:6px 9px;border-radius:6px;opacity:.85;pointer-events:none}" });
await page.evaluate(() => { const d = document.createElement("div"); d.id = "__seg"; document.body.append(d); });
const label = (t) => page.evaluate((t) => { document.getElementById("__seg").textContent = t; }, t);
// In-page frame timing while recording (capture itself costs some frames).
await page.evaluate(() => { window.__f = []; let l = 0; const t = (n) => { if (l) __f.push(n - l); l = n; requestAnimationFrame(t); }; requestAnimationFrame(t); });

const frames = [];
const cdp = await ctx.newCDPSession(page);
cdp.on("Page.screencastFrame", async (f) => {
  frames.push({ ts: f.metadata.timestamp, data: Buffer.from(f.data, "base64") });
  try { await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }); } catch {}
});

await page.mouse.move(VW / 2, VH / 2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const jump = async (y) => { await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), y); await sleep(900); };
async function stream(to, px, every, ease = true) {
  let y = await page.evaluate(() => scrollY);
  const dir = Math.sign(to - y);
  let i = 0;
  while (dir > 0 ? y < to - 2 : y > to + 2) {
    const t0 = Date.now();
    const k = ease ? Math.min(1, (i + 1) / 20) : 1;
    await page.mouse.wheel(0, dir * Math.max(1, Math.round(px * k)));
    i++;
    if (i % 4 === 0) y = await page.evaluate(() => scrollY);
    const d = Date.now() - t0; if (d < every) await sleep(every - d);
  }
  await sleep(700);
}

await jump(START);
// Capture size and quality are a trade: encoding every Retina frame as a
// full-size JPEG costs this machine's page about 40% of its frames.
const CAPW = +arg("--capw", "960");
await cdp.send("Page.startScreencast", { format: "jpeg", quality: +arg("--q", "55"), maxWidth: CAPW, maxHeight: Math.round(CAPW * VH / VW), everyNthFrame: 1 });
await sleep(600);
const marks = [];
const seg = async (name, fn) => { marks.push({ name, at: Date.now() }); await label(name); await fn(); };

await seg("1 · trackpad-speed, forward", () => stream(END, 14, 16));
await seg("2 · slow, through the hand-off", async () => { await jump(at(g.v, 0.8)); await stream(at(g.a, 0.3), 5, 16); });
await seg("3 · mouse wheel (100px notches), forward", async () => { await jump(START); await stream(END, 100, 80, false); });
await seg("4 · fast, forward", async () => { await jump(START); await stream(END, 70, 16); });
await seg("5 · reverse, trackpad-speed", () => stream(START, 14, 16));

await cdp.send("Page.stopScreencast");
const fdt = await page.evaluate(() => __f);
await browser.close();

// Keep the raw capture, so an encode can be redone without re-recording.
frames.sort((a, b) => a.ts - b.ts);
const RAW = "lab/rec/frames";
await mkdir(RAW, { recursive: true });
await Promise.all(frames.map((f, i) => writeFile(`${RAW}/${String(i).padStart(5, "0")}.jpg`, f.data)));
await writeFile("lab/rec/index.json", JSON.stringify(frames.map((f) => f.ts)));

// Retime onto a constant 30 fps timeline.
const t0 = frames[0].ts, t1 = frames[frames.length - 1].ts, FPS = 30;
const ff = spawn(FFMPEG, ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "pipe:0",
  "-c:v", "libvpx", "-b:v", "3M", "-crf", "10", "-qmin", "4", "-qmax", "30", "-auto-alt-ref", "0", OUT], { stdio: ["pipe", "inherit", "inherit"] });
let j = 0, written = 0;
for (let t = t0; t <= t1; t += 1 / FPS) {
  while (j + 1 < frames.length && frames[j + 1].ts <= t) j++;
  if (!ff.stdin.write(frames[j].data)) await new Promise((r) => ff.stdin.once("drain", r));
  written++;
}
ff.stdin.end();
await new Promise((r) => ff.on("close", r));

const gaps = frames.slice(1).map((f, i) => (f.ts - frames[i].ts) * 1000);
const s = [...fdt].sort((a, b) => a - b);
const summary = {
  out: OUT, seconds: +(t1 - t0).toFixed(1), screencastFrames: frames.length, videoFrames: written,
  screencastMeanFps: +(frames.length / (t1 - t0)).toFixed(1), screencastGapsOver50ms: gaps.filter((x) => x > 50).length,
  pageRafWhileRecording: { fps: +(1000 / (fdt.reduce((a, b) => a + b, 0) / fdt.length)).toFixed(1), p95: +s[Math.floor(s.length * 0.95)].toFixed(1) },
  segments: marks.map((m) => m.name),
};
await writeFile(OUT.replace(/\.webm$/, ".json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
