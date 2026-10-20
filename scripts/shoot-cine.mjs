// Redesign vertical slice: capture the pinned studio → Identity act at fixed
// timeline positions, plus the pin release, at desktop and phone sizes and with
// reduced motion. Also measures per-layer motion so the depth can be checked
// as numbers, not just pictures.
//
//   node scripts/shoot-cine.mjs [--url http://localhost:4500] [--out lab/redesign] [--only desktop,mobile]
import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const URL = arg("--url", "http://localhost:4500");
const OUT = path.resolve(arg("--out", arg("--act", "top") === "top" ? "lab/redesign" : `lab/redesign-${arg("--act", "top")}`));
const ONLY = arg("--only", "")?.split(",").filter(Boolean);
// Which pinned act to walk: "top" (hero) or "privilege".
const ACT = arg("--act", "top");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "laptop", width: 1280, height: 720 },
  { name: "tablet", width: 834, height: 1112, mobile: true },
  { name: "mobile", width: 390, height: 844, mobile: true },
  { name: "compact", width: 360, height: 640, mobile: true },
  { name: "reduced", width: 1440, height: 900, reduced: true },
  { name: "reduced-mobile", width: 390, height: 844, reduced: true, mobile: true },
].filter((v) => !ONLY?.length || ONLY.includes(v.name));

const SETS = {
  top: {
    stops: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.58, 0.66, 0.74, 0.84, 1],
    layers: [".cine__rear", ".cine__wall", ".cine__panel--l", ".cine__name-row--1", "[data-node=person]", ".cine__set", ".cine__fg", ".cine__dust--near", ".cine__id-title"],
  },
  lifecycle: {
    stops: [0, 0.06, 0.12, 0.2, 0.26, 0.32, 0.4, 0.44, 0.5, 0.58, 0.62, 0.7, 0.74, 0.78, 0.82, 0.88, 0.95, 1],
    layers: [".lc__sky", ".lc__skyline", ".lc__world", "[data-person=jonathan]", "[data-person=sarah]", "[data-person=david]", ".lc__group--finance", ".lc__fin--1", ".lc__dust"],
  },
  privilege: {
    stops: [0, 0.08, 0.16, 0.24, 0.32, 0.42, 0.5, 0.6, 0.68, 0.78, 0.86, 0.94, 1],
    layers: [".pv__room", ".pv__world", ".pv__floor", ".pv__au", ".pv__beam", ".pv__card--workforce", ".pv__stack", ".pv__vault", ".pv__fg-orb--1"],
  },
};
const { stops: STOPS, layers: LAYERS } = SETS[ACT];

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const report = [];

for (const vp of VIEWPORTS) {
  const dir = path.join(OUT, vp.name);
  await mkdir(dir, { recursive: true });
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1,
    isMobile: !!vp.mobile, hasTouch: !!vp.mobile,
    reducedMotion: vp.reduced ? "reduce" : "no-preference",
  });
  await ctx.addInitScript(() => {
    Element.prototype.requestPointerLock = () => Promise.resolve();
    Element.prototype.setPointerCapture = () => {};
  });
  const page = await ctx.newPage();
  const errors = [], failed = [];
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(`${m.type()}: ${m.text()}`); });
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("requestfailed", (r) => failed.push(`${r.failure()?.errorText} ${r.url()}`));

  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);

  const info = await page.evaluate((id) => {
    const h = document.getElementById(id);
    return {
      live: h.hasAttribute("data-live"), engineAct: h.hasAttribute("data-sc-act"),
      top: h.getBoundingClientRect().top + scrollY, height: h.offsetHeight,
      ready: id !== "top" || !!document.querySelector(".cine__aria[data-ready]"),
    };
  }, ACT);

  const shots = [], motion = [];
  const settle = async () => {
    // Wait for the choreographer's lerp to arrive (transforms stop changing).
    let last = "";
    for (let i = 0; i < 40; i++) {
      const sig = await page.evaluate((id) => [...document.getElementById(id).querySelectorAll("[style]")].map((e) => e.getAttribute("style")).join("|"), ACT);
      if (sig === last) break;
      last = sig;
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(120);
  };
  const snap = async (label, y) => {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
    await settle();
    await page.screenshot({ path: path.join(dir, `${label}.png`) });
    const m = await page.evaluate(({ sels, id }) => {
      const out = { scP: document.getElementById(id)?.style.getPropertyValue("--sc-p") || null, layers: {} };
      for (const s of sels) {
        const e = document.querySelector(s);
        if (!e) continue;
        const r = e.getBoundingClientRect();
        out.layers[s] = { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), o: +getComputedStyle(e).opacity };
      }
      out.overflow = document.documentElement.scrollWidth - innerWidth;
      return out;
    }, { sels: LAYERS, id: ACT });
    shots.push({ label, y: Math.round(y), overflow: m.overflow });
    motion.push({ label, ...m });
  };

  if (info.live) {
    const travel = info.height - vp.height;
    if (ACT !== "top") await snap("enter-50", info.top - vp.height * 0.5);
    for (const p of STOPS) await snap(`p${String(Math.round(p * 100)).padStart(3, "0")}`, info.top + p * travel);
    await snap("release-50", info.top + travel + vp.height * 0.5);
    await snap("release-100", info.top + travel + vp.height);
    // Reverse: scrub back up to the opening and check it returns cleanly.
    await snap("reverse-p040", info.top + 0.4 * travel);
    await snap("reverse-p000", info.top);
  } else if (ACT === "top") {
    await snap("static-frame1", 0);
    await snap("static-frame2", vp.height);
    await snap("static-after", vp.height * 2);
  } else {
    await snap("static-start", info.top);
    await snap("static-mid", info.top + vp.height * 0.8);
    await snap("static-end", info.top + info.height - vp.height);
  }

  report.push({ viewport: vp, info, errors, failed, shots, motion });
  await ctx.close();
}

await browser.close();
await writeFile(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
for (const r of report) {
  console.log(`${r.viewport.name}: live=${r.info.live} engineAct=${r.info.engineAct} ready=${r.info.ready} height=${r.info.height} errors=${r.errors.length} failed=${r.failed.length} maxOverflow=${Math.max(...r.shots.map((s) => s.overflow))}`);
  r.errors.slice(0, 5).forEach((e) => console.log("   ", e.slice(0, 200)));
  r.failed.slice(0, 5).forEach((e) => console.log("   ", e.slice(0, 200)));
}
