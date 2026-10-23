// Mobile stability guard: phones and tablets get the lightweight page, desktop keeps the cinematic one.
//
//   node scripts/mobile-guard.mjs [base=http://localhost:4514] [--baseline <url>] [--shots <dir>] [--headed]
//
// Run against a production build (`next build && next start`). Chromium emulation only: it proves what
// each device is served and what runs there, not iOS memory behaviour; the physical iPhone is the
// acceptance test. Exits 1 on any failed check.
//
// iPhone (UA, 393x852 @3x, touch): the lite page at /; no 3D scene, canvas, engine, motion frames or
//   scene code in the loaded JavaScript; no preserve-3d anywhere; every chapter, anchor and key link;
//   nothing left hidden after scrolling; #hash loads land; no overflow from 320 to 1024 px.
// iPad in desktop mode (Mac UA, touch): served the cinematic page, LITE_GUARD reloads it as lite
//   before any scene mounts.
// Reduced motion phone: lite, nothing ever hidden for an entrance.
// Desktop (1440x900 @2x): the cinematic page, untouched by the guard; with --baseline, identical
//   server markup (apart from the guard script) and identical layer counts at every chapter.
import { chromium } from "playwright-core";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { homedir } from "node:os";

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i > -1 ? args[i + 1] : undefined; };
const base = (args.find((a, i) => !a.startsWith("--") && !["--baseline", "--shots"].includes(args[i - 1])) || "http://localhost:4514").replace(/\/$/, "");
const baseline = opt("--baseline")?.replace(/\/$/, "");
const shots = opt("--shots");
if (shots) mkdirSync(shots, { recursive: true });

const pwCache = `${homedir()}/Library/Caches/ms-playwright`;
const pwChromium = () => {
  const d = existsSync(pwCache) && readdirSync(pwCache).filter((x) => /^chromium-\d+$/.test(x)).sort().pop();
  return d && `${pwCache}/${d}/chrome-mac/Chromium.app/Contents/MacOS/Chromium`;
};
// Playwright's Chromium first: headless Google Chrome reports an almost empty layer tree.
const browser = await chromium.launch({ executablePath: pwChromium() || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: !args.includes("--headed") });

const IPHONE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 26_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1";
const MAC_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15";
const PHONE = { viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: IPHONE_UA };
const DESKTOP = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 };
const CHAPTERS = ["top", "identity", "privilege", "scope", "lifecycle", "validation", "about", "certifications", "lounge", "contact"];
const ACTS = ["top", "privilege", "lifecycle", "validation", "about", "lounge"];
// Class names that exist only in the cinematic scenes' code and markup.
const SCENE_CODE = ["cine__stage", "pv__world", "lc__world", "ev__world", "ab__stage", "lg__plane", "sc-act--pinned", "data-sc-stage"];

const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  " + detail : ""}`); };

async function open(url, ctxOpts, { wait = 4000 } = {}) {
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  const net = { motion: 0, js: new Set(), docs: 0 };
  const errors = [];
  page.on("request", (r) => {
    const u = r.url();
    if (u.includes("/aria/motion/")) net.motion++;
    if (u.endsWith(".js")) net.js.add(u);
    if (r.resourceType() === "document") net.docs++;
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message.slice(0, 160)}`));
  page.on("console", (m) => { if (m.type() === "error" || /hydrat/i.test(m.text())) errors.push(`console: ${m.text().slice(0, 160)}`); });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("LayerTree.enable");
  let layers = [];
  cdp.on("LayerTree.layerTreeDidChange", (e) => { if (e.layers) layers = e.layers; });
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(wait);
  return { ctx, page, net, errors, layers: () => layers };
}

async function layerCount(s) {
  const drawing = () => s.layers().filter((l) => l.drawsContent && !(l.height > 20000)).length;
  await s.page.waitForTimeout(700);
  for (let i = 0, n = -1; i < 10 && drawing() !== n; i++) { n = drawing(); await s.page.waitForTimeout(500); }
  return drawing();
}
const jsText = async (s) => (await Promise.all([...s.net.js].map((u) => fetch(u).then((r) => r.text())))).join("\n");
const isLite = (page) => page.evaluate(() => !!document.querySelector(".lt") && !document.querySelector("[data-sc-stage]"));

/** Scroll the whole page the way a thumb does, then report anything still hidden. */
async function scrollThrough(page) {
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= H; y += 500) { await page.evaluate((v) => scrollTo({ top: v, behavior: "instant" }), y); await page.waitForTimeout(120); }
  await page.waitForTimeout(800);
}

// ---------------------------------------------------------------- iPhone
console.log(`\n# iPhone 393x852 @3x  ${base}`);
const phone = await open(base + "/", PHONE);
check("iPhone: served the lightweight page at /", await isLite(phone.page));
const env = await phone.page.evaluate(() => ({
  canvas: document.querySelectorAll("canvas").length,
  acts: document.querySelectorAll("[data-sc-act], [data-sc-stage]").length,
  live: document.querySelectorAll("[data-live]").length,
  engine: !!window.ScrollCraft,
  p3d: [...document.querySelectorAll("*")].filter((e) => getComputedStyle(e).transformStyle === "preserve-3d").length,
  persp: [...document.querySelectorAll("*")].filter((e) => getComputedStyle(e).perspective !== "none").length,
  ids: [...document.querySelectorAll("[id]")].map((e) => e.id),
  links: [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")),
}));
check("iPhone: no canvas, no scroll acts, no live scenes, no engine", env.canvas === 0 && env.acts === 0 && env.live === 0 && !env.engine, JSON.stringify({ canvas: env.canvas, acts: env.acts, live: env.live, engine: env.engine }));
check("iPhone: no 3D rendering context anywhere (preserve-3d, perspective)", env.p3d === 0 && env.persp === 0, `preserve-3d=${env.p3d} perspective=${env.persp}`);
check("iPhone: no A.R.I.A. motion frames requested", phone.net.motion === 0, `motion=${phone.net.motion}`);
const code = await jsText(phone);
const leaked = SCENE_CODE.filter((m) => code.includes(m));
check("iPhone: loaded JavaScript contains no cinematic scene code", leaked.length === 0, `${phone.net.js.size} files${leaked.length ? " LEAKED " + leaked.join(",") : ""}`);
const order = CHAPTERS.map((id) => env.ids.indexOf(id));
check("iPhone: every chapter and anchor, in order", order.every((v, i) => v > -1 && (i === 0 || v > order[i - 1])), CHAPTERS.map((c, i) => `${c}:${order[i]}`).join(" "));
const need = {
  "Phase 1 case": (l) => l === "/cfg/phase-1", "Phase 2 case": (l) => l === "/cfg/phase-2", resume: (l) => l.endsWith(".pdf"),
  email: (l) => l.startsWith("mailto:"), linkedin: (l) => l.includes("linkedin.com"), "CFG GitHub": (l) => l.includes("cashville-financial-group-iam"),
  certifications: (l) => l === "#certifications", contact: (l) => l === "#contact",
};
const missing = Object.entries(need).filter(([, f]) => !env.links.some(f)).map(([k]) => k);
const ghEvidence = env.links.filter((l) => l.includes("cashville-financial-group-iam")).length;
check("iPhone: key links present (cases, resumé, email, LinkedIn, GitHub, anchors)", missing.length === 0 && ghEvidence >= 12, `missing=[${missing}] CFG GitHub links=${ghEvidence}`);
const layersTop = await layerCount(phone);
await scrollThrough(phone.page);
const hidden = await phone.page.evaluate(() => document.querySelectorAll('[data-lr="wait"]').length);
check("iPhone: nothing left hidden after scrolling to the end", hidden === 0, `waiting=${hidden}`);
check("iPhone: few composited layers", layersTop <= 30, `layers at top=${layersTop}`);
check("iPhone: one document load (no reloads)", phone.net.docs === 1, `documents=${phone.net.docs}`);
const story = await phone.page.evaluate(() => { const d = document.querySelector(".lt-story"); d.open = true; return d.querySelector(".lt-story__body").getBoundingClientRect().height > 100; });
check("iPhone: 'Read my story' opens", story);
if (shots) {
  for (const id of ["top", "identity", "privilege", "lifecycle", "validation", "about", "certifications", "lounge", "contact"]) {
    await phone.page.evaluate((i) => document.getElementById(i).scrollIntoView({ behavior: "instant" }), id);
    await phone.page.waitForTimeout(900);
    await phone.page.screenshot({ path: `${shots}/phone-${id}.png` });
  }
}
check("iPhone: no page errors or hydration warnings", phone.errors.length === 0, phone.errors.slice(0, 3).join(" | "));
await phone.ctx.close();

const hashMiss = [];
for (const id of ["privilege", "validation", "lounge", "contact"]) {
  const s = await open(`${base}/#${id}`, PHONE, { wait: 1800 });
  const top = await s.page.evaluate((i) => Math.round(document.getElementById(i).getBoundingClientRect().top), id);
  if (Math.abs(top) > 2) hashMiss.push(`${id}@${top}`);
  await s.ctx.close();
}
check("iPhone: #hash loads land on their chapter", hashMiss.length === 0, hashMiss.join(" "));

const over = [];
for (const [w, h, ua] of [[320, 640, IPHONE_UA], [375, 812, IPHONE_UA], [393, 852, IPHONE_UA], [430, 932, IPHONE_UA], [768, 1024, MAC_UA.replace("Macintosh; Intel Mac OS X 10_15_7", "iPad; CPU OS 18_0 like Mac OS X")], [1024, 1366, IPHONE_UA.replace("iPhone", "iPad")]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: ua });
  const p = await ctx.newPage(); await p.goto(base + "/", { waitUntil: "load" }); await p.waitForTimeout(600);
  const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, lite: !!document.querySelector(".lt") }));
  if (r.sw !== r.cw || !r.lite) over.push(`${w}:${JSON.stringify(r)}`);
  await ctx.close();
}
check("phones and tablets: lite, no horizontal overflow (320 to 1024 px)", over.length === 0, over.join(" "));

// ---------------------------------------------------------------- iPad in desktop mode
console.log(`\n# iPad requesting the desktop site (Mac UA, touch)`);
const ipad = await open(base + "/", { viewport: { width: 1024, height: 1366 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: MAC_UA }, { wait: 3000 });
const ipadState = await ipad.page.evaluate(() => ({ lite: !!document.querySelector(".lt"), live: document.querySelectorAll("[data-live]").length, engine: !!window.ScrollCraft, cookie: document.cookie }));
check("iPad desktop mode: guard reloads into lite before any scene mounts", ipadState.lite && ipadState.live === 0 && !ipadState.engine && /view=lite/.test(ipadState.cookie) && ipad.net.motion === 0, `${JSON.stringify(ipadState)} documents=${ipad.net.docs}`);
await ipad.ctx.close();

// Cookies blocked: Set-Cookie stripped and document.cookie inert. The guard must still land on lite once.
const blocked = await browser.newContext({ viewport: { width: 1024, height: 1366 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: MAC_UA });
await blocked.addInitScript(() => Object.defineProperty(Document.prototype, "cookie", { get: () => "", set: () => {}, configurable: true }));
await blocked.route("**/*", async (route) => { const r = await route.fetch(); const h = { ...r.headers() }; delete h["set-cookie"]; await route.fulfill({ response: r, headers: h }); });
const bp = await blocked.newPage(); let bDocs = 0; bp.on("request", (r) => { if (r.resourceType() === "document") bDocs++; });
await bp.goto(base + "/", { waitUntil: "load" }); await bp.waitForTimeout(3000);
const bState = await bp.evaluate(() => ({ lite: !!document.querySelector(".lt"), url: location.pathname + location.search }));
check("iPad desktop mode, cookies blocked: one reload to lite, no loop", bState.lite && bDocs === 2, `${JSON.stringify(bState)} documents=${bDocs}`);
await blocked.close();

// ---------------------------------------------------------------- metadata
const SITE = "https://iamtechcam.com";
const meta = async (ua) => { const h = await fetch(base + "/", { headers: { "user-agent": ua } }).then((r) => r.text());
  return { canonical: h.match(/<link rel="canonical" href="([^"]+)"/)?.[1], og: h.match(/<meta property="og:url" content="([^"]+)"/)?.[1], title: h.match(/<title>([^<]+)/)?.[1], noindex: /noindex/.test(h) }; };
const [mDesk, mPhone] = [await meta(MAC_UA), await meta(IPHONE_UA)];
const sitemap = await fetch(base + "/sitemap.xml").then((r) => r.text()), robots = await fetch(base + "/robots.txt").then((r) => r.text());
const metaOk = [mDesk, mPhone].every((m) => m.canonical === SITE && m.og === SITE && !m.noindex && m.title === mDesk.title)
  && !/\/m</.test(sitemap) && sitemap.includes(`${SITE}/cfg/phase-1`) && robots.includes(`${SITE}/sitemap.xml`);
check("metadata: both variants canonical and og:url https://iamtechcam.com, indexable; sitemap and robots on the domain, no /m", metaOk, JSON.stringify({ mDesk, mPhone }));

// ---------------------------------------------------------------- reduced motion
console.log(`\n# iPhone, reduced motion`);
const reduced = await open(base + "/", { ...PHONE, reducedMotion: "reduce" });
await scrollThrough(reduced.page);
const rWait = await reduced.page.evaluate(() => ({ lite: !!document.querySelector(".lt"), waiting: document.querySelectorAll('[data-lr="wait"]').length, anim: getComputedStyle(document.querySelector(".lt-hero__aria")).animationName }));
check("reduced motion: lite, no entrance hiding, no A.R.I.A. float", rWait.lite && rWait.waiting === 0 && rWait.anim === "none", JSON.stringify(rWait));
check("reduced motion: no page errors", reduced.errors.length === 0, reduced.errors.slice(0, 3).join(" | "));
await reduced.ctx.close();

// ---------------------------------------------------------------- desktop
console.log(`\n# Desktop 1440x900 @2x`);
const desk = await open(base + "/", { ...DESKTOP, userAgent: MAC_UA });
const dState = await desk.page.evaluate(() => ({ lite: !!document.querySelector(".lt"), acts: document.querySelectorAll("[data-sc-stage]").length, engine: !!window.ScrollCraft, cookie: document.cookie }));
check("desktop: cinematic page, engine mounted, guard inert", !dState.lite && dState.acts === 6 && dState.engine && !/view=/.test(dState.cookie), JSON.stringify(dState));
check("desktop: all 21 A.R.I.A. motion frames load", desk.net.motion === 21, `motion=${desk.net.motion}`);
if (baseline) {
  const strip = (h) => h.slice(h.indexOf("<body")).replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "").replace(/\/_next\/static\/[^"' )]+/g, "_").replace(/"[A-Za-z0-9_-]{21}"/g, "_");
  const [a, b] = await Promise.all([fetch(base + "/", { headers: { "user-agent": MAC_UA } }).then((r) => r.text()), fetch(baseline + "/", { headers: { "user-agent": MAC_UA } }).then((r) => r.text())]);
  check("desktop: server markup identical to the baseline build (scripts aside)", strip(a) === strip(b), `${strip(a).length} vs ${strip(b).length} chars`);
  const deskBase = await open(baseline + "/", { ...DESKTOP, userAgent: MAC_UA });
  for (const id of ACTS) {
    for (const s of [desk, deskBase]) await s.page.evaluate((i) => { const e = document.getElementById(i); scrollTo({ top: e.getBoundingClientRect().top + scrollY + (i === "top" ? 0 : e.offsetHeight * 0.4), behavior: "instant" }); }, id);
    const [x, y] = [await layerCount(desk), await layerCount(deskBase)];
    check(`desktop @${id}: layer count matches baseline`, x === y, `${y} -> ${x}`);
    if (shots) { await desk.page.screenshot({ path: `${shots}/desktop-${id}.png` }); await deskBase.page.screenshot({ path: `${shots}/desktop-${id}-baseline.png` }); }
  }
  await deskBase.ctx.close();
}
check("desktop: no page errors or hydration warnings", desk.errors.length === 0, desk.errors.slice(0, 3).join(" | "));
await desk.ctx.close();

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed. Chromium emulation cannot prove iOS stability; the physical iPhone is the acceptance test.`);
process.exit(failed.length ? 1 : 0);
