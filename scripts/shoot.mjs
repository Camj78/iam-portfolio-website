// Visual verification: screenshots across hero progress and every chapter,
// at desktop / tablet / phone / compact phone, plus a reduced-motion pass.
// Also reports console errors, failed requests and horizontal overflow.
//
//   node scripts/shoot.mjs [--url http://localhost:4500] [--out lab/shots] [--only desktop,mobile]
import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const URL = arg("--url", "http://localhost:4500");
const OUT = path.resolve(arg("--out", "lab/shots"));
const ONLY = arg("--only", "")?.split(",").filter(Boolean);
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

const HERO_STOPS = [0, 0.1, 0.22, 0.32, 0.46, 0.62, 0.72, 0.84, 1];
const CHAPTERS = ["identity", "privilege", "scope", "lifecycle", "case-02", "case-03", "validation", "lounge", "contact"];

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const report = [];

for (const vp of VIEWPORTS) {
  const dir = path.join(OUT, vp.name);
  await mkdir(dir, { recursive: true });
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    isMobile: !!vp.mobile,
    hasTouch: !!vp.mobile,
    reducedMotion: vp.reduced ? "reduce" : "no-preference",
  });
  // Never let automation grab the real pointer.
  await ctx.addInitScript(() => {
    Element.prototype.requestPointerLock = () => Promise.resolve();
    Element.prototype.setPointerCapture = () => {};
  });
  const page = await ctx.newPage();
  const errors = [], failed = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("requestfailed", (r) => failed.push(`${r.failure()?.errorText} ${r.url()}`));

  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);

  const heroInfo = await page.evaluate(() => {
    const h = document.getElementById("top");
    return { live: h.hasAttribute("data-live"), top: h.getBoundingClientRect().top + scrollY, height: h.offsetHeight, ready: !!document.querySelector(".hero__aria[data-ready]") };
  });

  const shots = [];
  const snap = async (label, y) => {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
    await page.waitForTimeout(450);
    const file = path.join(dir, `${label}.png`);
    await page.screenshot({ path: file });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    shots.push({ label, y: Math.round(y), overflow });
  };

  if (heroInfo.live) {
    const travel = heroInfo.height - vp.height;
    for (const p of HERO_STOPS) await snap(`hero-${String(Math.round(p * 100)).padStart(3, "0")}`, heroInfo.top + p * travel);
  } else {
    await snap("hero-static", 0);
  }
  for (const id of CHAPTERS) {
    const y = await page.evaluate((id) => { const el = document.getElementById(id); return el ? el.getBoundingClientRect().top + scrollY - 80 : null; }, id);
    if (y !== null) await snap(`ch-${id}`, y);
  }
  // Reverse scroll check: back to mid-hero after visiting the end.
  if (heroInfo.live) {
    const travel = heroInfo.height - vp.height;
    await snap("reverse-hero-046", heroInfo.top + 0.46 * travel);
    await snap("reverse-hero-000", heroInfo.top);
  }
  await page.screenshot({ path: path.join(dir, "full.png"), fullPage: true });

  report.push({ viewport: vp.name, hero: heroInfo, shots, errors, failed });
  await ctx.close();
}
await browser.close();
await writeFile(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
for (const r of report) {
  const of = r.shots.filter((s) => s.overflow > 0).map((s) => `${s.label}:${s.overflow}px`);
  console.log(`${r.viewport.padEnd(15)} live=${r.hero.live} ready=${r.hero.ready} shots=${r.shots.length} errors=${r.errors.length} failed=${r.failed.length} overflow=${of.join(",") || "none"}`);
  r.errors.slice(0, 5).forEach((e) => console.log("   error:", e.slice(0, 200)));
  r.failed.slice(0, 5).forEach((e) => console.log("   failed:", e.slice(0, 200)));
}
