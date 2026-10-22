// Ablation: which rendering features cost the frames? Loads the page once in
// headed Chrome (real GPU, Retina), then for each variant injects one style
// override and wheel-scrolls the same segments, measuring rAF frame intervals.
//   node scripts/perf-ablate.mjs [--variants base,nofilter,...] [--dpr 2]
import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const DPR = +arg("--dpr", "2");
const [VW, VH] = arg("--size", "1440x790").split("x").map(Number);
const LABEL = arg("--label", "ablate");

const VARIANTS = {
  base: "",
  nofilter: "*, *::before, *::after { filter: none !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }",
  noshadow: "*, *::before, *::after { box-shadow: none !important; }",
  nodust: ".ev__dust, .ab__dust, .cine__dust, .lc__dust, .pv__dust { display: none !important; }",
  noplanes: ".ev__plane, .ev__chamber-floor, .ev__chamber-wall, .ev__bulkhead, .ab__wall, .ab__floor, .ab__ring { display: none !important; }",
  nooverlay: ".ev__visual::after, .ab__visual::after, .ab__key, .ab__vignette, .ab__space, .ev__space, .ab__fg, .ev__fg, .ab__cone, .ab__pool, .ab__mirror, .ev__flood { display: none !important; }",
  nomask: "*, *::before, *::after { -webkit-mask: none !important; mask: none !important; }",
  noheader: ".site-header, .rail { display: none !important; }",
  wcplanes: ".ev__plane, .ev__chamber-floor, .ev__chamber-wall, .ev__bulkhead, .ab__wall, .ab__floor::before, .ab__ring-face, .ab__ring-rim { will-change: transform; }",
  np_noslab: ".ev__plane, .ev__chamber-floor, .ev__chamber-wall, .ev__bulkhead, .ab__wall, .ab__floor, .ab__ring { display: none !important; } .ab__cone, .ab__pool, .ab__mirror, .ab__edge { display: none !important; }",
  np_nofilter: ".ev__plane, .ev__chamber-floor, .ev__chamber-wall, .ev__bulkhead, .ab__wall, .ab__floor, .ab__ring { display: none !important; } *, *::before, *::after { filter: none !important; backdrop-filter: none !important; }",
  np_nohost: ".ev__plane, .ev__chamber-floor, .ev__chamber-wall, .ev__bulkhead, .ab__wall, .ab__floor, .ab__ring { display: none !important; } .ab__host { display: none !important; }",
  np_noface: ".ev__plane, .ev__chamber-floor, .ev__chamber-wall, .ev__bulkhead, .ab__wall, .ab__floor, .ab__ring { display: none !important; } .ab__face { display: none !important; }",
  np_nooverlay: ".ev__plane, .ev__chamber-floor, .ev__chamber-wall, .ev__bulkhead, .ab__wall, .ab__floor, .ab__ring { display: none !important; } .ab__visual::after, .ab__key, .ab__vignette, .ab__space, .ab__fg, .ab__dust { display: none !important; }",
  ev_corr: ".ev__plane { display: none !important; }",
  ev_chfloor: ".ev__chamber-floor { display: none !important; }",
  ev_chwall: ".ev__chamber-wall { display: none !important; }",
  ev_bulk: ".ev__bulkhead::before { display: none !important; }",
  ev_flood: ".ev__flood { display: none !important; }",
  ab_floor: ".ab__floor { display: none !important; }",
  ab_wall: ".ab__wall { display: none !important; }",
  ab_ring: ".ab__ring { display: none !important; }",
  ab_cone: ".ab__cone { display: none !important; }",
  ab_pool: ".ab__pool { display: none !important; }",
  ab_mirror: ".ab__mirror { display: none !important; }",

  wc_panels: ".ev__panel, .ev__group-label, .ab__face, .ab__edge { will-change: transform; }",
  no_thumbfx: ".ev__thumb img { filter: none !important; } .ev__panel { box-shadow: none !important; }",
  no_chwall: ".ev__chamber-wall { display: none !important; }",
  no_chfloor: ".ev__chamber-floor { display: none !important; }",
  no_shelf: ".ev__shelf { display: none !important; }",
  no_panels: ".ev__arc { display: none !important; }",
  no_portal: ".portal { display: none !important; }",
  no_scrim: ".ev__visual::after, .ab__visual::after { display: none !important; }",
  no_awall: ".ab__wall { display: none !important; }",
  no_afloor: ".ab__floor { display: none !important; }",
  no_host: ".ab__host { display: none !important; }",
  no_slabfx: ".ab__cone, .ab__pool, .ab__mirror { display: none !important; }",
  no_slabs: ".ab__obj { display: none !important; }",
  no_dust: ".ab__dust, .ev__dust { display: none !important; }",
  no_b: ".ab__obj--b { display: none !important; }",
  no_c: ".ab__obj--c { display: none !important; }",
  no_warm: ".ab__warmth, .ab__key-warm, canvas.tex-warm { display: none !important; }",
  no_paths: ".ab__path { display: none !important; }",
  no_canvas_host: ".ab__aria { display: none !important; }",
  no_console: ".ab__console, .ab__host-spot { display: none !important; }",
  no_warmth: ".ab__warmth { display: none !important; }",
  no_keywarm: ".ab__key-warm { display: none !important; }",
  no_texwarm: "canvas.tex-warm { display: none !important; }",
  texwarm_static: "canvas.tex-warm { opacity: 0.6 !important; }",
  texwarm_no3d_wc: "canvas.tex-warm { will-change: auto !important; }",
};
const pick = arg("--variants", Object.keys(VARIANTS).join(",")).split(",");

const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: false,
  args: [`--window-size=${VW},${VH + 120}`, "--window-position=0,0", "--disable-background-timer-throttling", "--disable-renderer-backgrounding"],
});
const page = await (await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: DPR })).newPage();
await page.goto(arg("--url", "http://localhost:4500"), { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(800);
await page.mouse.move(VW / 2, VH / 2);
await page.addScriptTag({ content: `window.__f=[];window.__on=false;let __l=0;const __t=(t)=>{if(__on&&__l)__f.push(t-__l);__l=t;requestAnimationFrame(__t)};requestAnimationFrame(__t);` });

const seg = await page.evaluate(() => {
  const at = (id, p) => { const e = document.getElementById(id); const top = e.getBoundingClientRect().top + scrollY; return Math.round(top + p * (e.offsetHeight - innerHeight)); };
  return {
    apush: [at("about", 0.6), at("about", 0.8)],
  };
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function run([a, b]) {
  await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), a);
  await sleep(700);
  await page.evaluate(() => { __f = []; __on = true; });
  let y = a;
  const t0 = Date.now();
  while (y < b && Date.now() - t0 < 25000) {
    const s = Date.now();
    await page.mouse.wheel(0, 14);
    y += 14;
    const d = Date.now() - s; if (d < 16) await sleep(16 - d);
  }
  await sleep(300);
  const f = await page.evaluate(() => { __on = false; return __f; });
  const mean = f.reduce((x, y) => x + y, 0) / f.length;
  const s = [...f].sort((x, y) => x - y);
  return { fps: +(1000 / mean).toFixed(1), p95: +s[Math.floor(0.95 * s.length)].toFixed(0), over33: f.filter((x) => x > 33.4).length, n: f.length };
}

const out = {};
for (const v of pick) {
  await page.evaluate((css) => { let s = document.getElementById("__ablate"); if (!s) { s = document.createElement("style"); s.id = "__ablate"; document.head.append(s); } s.textContent = css; }, VARIANTS[v]);
  await sleep(500);
  out[v] = {};
  for (const [name, r] of Object.entries(seg)) out[v][name] = await run(r);
  console.log(v.padEnd(10), Object.entries(out[v]).map(([k, x]) => `${k} ${String(x.fps).padStart(5)}fps p95 ${String(x.p95).padStart(4)}`).join("   "));
}
await browser.close();
await mkdir("lab/perf", { recursive: true });
await writeFile(`lab/perf/${LABEL}.json`, JSON.stringify({ dpr: DPR, out }, null, 2));
