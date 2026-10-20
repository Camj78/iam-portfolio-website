// Functional checks: keyboard focus, lightbox, skills filter, request record,
// link targets, heading outline, images with alt text, hero reverse scroll.
import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";
const URL = process.argv[2] ?? "http://localhost:4500";
const OUT = "lab/interactions"; await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => { Element.prototype.requestPointerLock = () => Promise.resolve(); Element.prototype.setPointerCapture = () => {}; });
const p = await ctx.newPage();
const errors = []; p.on("pageerror", (e) => errors.push(String(e))); p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await p.goto(URL, { waitUntil: "networkidle" }); await p.waitForTimeout(800);
const ok = (name, cond, extra = "") => console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? "  " + extra : ""}`);

// 1. Keyboard: first tabs land on skip link, wordmark, nav, then hero CTAs (visible when focused)
const focusSeq = [];
for (let i = 0; i < 16; i++) {
  await p.keyboard.press("Tab"); await p.waitForTimeout(1100);
  focusSeq.push(await p.evaluate(() => {
    const el = document.activeElement; const r = el.getBoundingClientRect();
    let o = 1, n = el; while (n && n !== document.body) { o *= +getComputedStyle(n).opacity; n = n.parentElement; }
    return { text: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 28), visible: r.top >= 0 && r.bottom <= innerHeight && o > 0.9, outline: getComputedStyle(el).outlineStyle };
  }));
}
focusSeq.forEach((f, i) => console.log(`      tab ${i + 1}: ${f.text.padEnd(28)} visible=${f.visible} outline=${f.outline}`));
ok("every focused element is on screen and opaque", focusSeq.every((f) => f.visible));
await p.screenshot({ path: `${OUT}/focus-hero-cta.png` });

// 2. Lightbox
await p.locator("#case-01 .exhibit button").first().scrollIntoViewIfNeeded();
await p.locator("#case-01 .exhibit button").first().click(); await p.waitForTimeout(400);
ok("lightbox opens as dialog", await p.locator('[role="dialog"]').count() === 1);
ok("focus moves to Close", await p.evaluate(() => document.activeElement?.textContent === "Close"));
await p.screenshot({ path: `${OUT}/lightbox.png` });
await p.keyboard.press("ArrowRight"); await p.waitForTimeout(300);
ok("arrow key browses exhibits", (await p.locator('[role="dialog"] figcaption').textContent()).includes("2 of"));
await p.keyboard.press("Escape"); await p.waitForTimeout(400);
ok("Esc closes lightbox", await p.locator('[role="dialog"]').count() === 0);
ok("focus returns to opener", await p.evaluate(() => !!document.activeElement?.closest(".exhibit")));

// 3. Skills filter
await p.locator("#validation").scrollIntoViewIfNeeded();
const rows = () => p.locator(".ledger tbody tr").count();
const all = await rows();
await p.getByRole("button", { name: /^Learning/ }).click(); await p.waitForTimeout(200);
const learning = await rows();
ok("skills filter narrows rows", learning > 0 && learning < all, `${all} -> ${learning}`);
const anyDemoInLearning = await p.locator(".ledger tbody .status--demonstrated").count();
ok("learning filter shows no demonstrated rows", anyDemoInLearning === 0);
await p.getByRole("button", { name: /^All/ }).click();

// 4. Request record resolves
await p.locator("#contact .record").scrollIntoViewIfNeeded(); await p.waitForTimeout(1400);
ok("request record shows Approved", await p.locator(".record[data-approved]").count() === 1);
await p.screenshot({ path: `${OUT}/request-approved.png` });

// 5. Links
const links = await p.evaluate(() => Array.from(document.querySelectorAll("a[href]")).map((a) => a.getAttribute("href")));
const anchors = [...new Set(links.filter((h) => h.startsWith("#")))];
const missing = await p.evaluate((a) => a.filter((h) => h !== "#" && !document.getElementById(h.slice(1))), anchors);
ok("all in-page anchors resolve", missing.length === 0, missing.join(","));
const external = [...new Set(links.filter((h) => /^https?:/.test(h)))];
console.log(`      external links: ${external.length}`); external.forEach((h) => console.log("        " + h));
const res = await p.request.get(new globalThis.URL("/resume/Cameron-Johnson-IAM-Resume.pdf", URL).href);
ok("résumé PDF served", res.status() === 200 && res.headers()["content-type"].includes("pdf"));
const mailto = links.filter((h) => h.startsWith("mailto:"));
console.log(`      mailto: ${mailto.join(", ")}`);
const tel = links.filter((h) => h.startsWith("tel:"));
const bodyText = await p.evaluate(() => document.body.innerText);
ok("no phone number published", tel.length === 0 && !/708[\s.-]?9839/.test(bodyText));

// 6. Headings + images
const hs = await p.evaluate(() => Array.from(document.querySelectorAll("h1,h2,h3")).map((h) => `${h.tagName} ${h.textContent.trim().slice(0, 40)}`));
ok("exactly one h1", hs.filter((h) => h.startsWith("H1")).length === 1);
console.log("      outline: " + hs.filter((h) => !h.startsWith("H3")).join(" | "));
const noAlt = await p.evaluate(() => Array.from(document.images).filter((i) => !i.hasAttribute("alt")).map((i) => i.src));
ok("every <img> has alt", noAlt.length === 0, noAlt.join(","));

// 7. Hero reverse scroll returns to the same pose and copy state
await p.evaluate(() => scrollTo({ top: 0, behavior: "instant" })); await p.waitForTimeout(700);
const stateAt = async (frac) => {
  await p.evaluate((f) => { const h = document.getElementById("top"); scrollTo({ top: f * (h.offsetHeight - innerHeight), behavior: "instant" }); }, frac);
  await p.waitForTimeout(900);
  return p.evaluate(() => ({ p: getComputedStyle(document.getElementById("top")).getPropertyValue("--hero-p").trim(),
    name: document.querySelector(".hero__name").style.opacity, intro: document.querySelector(".hero__intro").style.opacity,
    tf: document.querySelector(".hero__aria").style.transform }));
};
const fwd = await stateAt(0.46); await stateAt(1); const back = await stateAt(0.46);
ok("reverse scroll restores mid-hero state", JSON.stringify(fwd) === JSON.stringify(back), `${fwd.tf} | ${back.tf}`);
const start = await stateAt(0);
ok("reverse to top restores opening (name visible)", start.name === "1");

ok("no console/page errors", errors.length === 0, errors.slice(0, 3).join(" ; "));
await b.close();
