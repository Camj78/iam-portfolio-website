// The header and rail now read cached document geometry (lib/ground). Check
// their state against live layout at points through every chapter, then again
// after a resize (which must invalidate the cache).
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto("http://localhost:4500", { waitUntil: "networkidle" });
await page.waitForTimeout(900);
const check = () => page.evaluate(() => {
  const vh = innerHeight;
  const ids = ["identity", "privilege", "scope", "lifecycle", "validation"];
  let idx = -1; ids.forEach((id, i) => { const e = document.getElementById(id); if (e && e.getBoundingClientRect().top < vh * 0.45) idx = i; });
  const groundAt = (y, self) => { for (const el of document.querySelectorAll("section[data-ground]")) { if (el === self) continue; const r = el.getBoundingClientRect(); if (r.top <= y && r.bottom >= y) return el.dataset.ground; } return "dark"; };
  const rail = document.querySelector(".rail"), header = document.querySelector(".site-header");
  const rr = rail.getBoundingClientRect();
  const hero = document.getElementById("top");
  const exp = { step: idx >= 0 ? ids[idx] : null, railGround: groundAt(rr.top + rr.height / 2, rail), headerGround: groundAt(header.offsetHeight / 2, header), railVisible: hero.getBoundingClientRect().bottom < vh * 0.55, scrolled: hero.getBoundingClientRect().bottom < header.offsetHeight };
  const cur = rail.querySelector('[aria-current="step"]');
  const got = { step: cur ? cur.getAttribute("href").slice(1) : null, railGround: rail.dataset.ground, headerGround: header.dataset.ground, railVisible: rail.hasAttribute("data-visible"), scrolled: header.hasAttribute("data-scrolled") };
  return { exp, got, ok: JSON.stringify(exp) === JSON.stringify(got) };
});
const ids = ["top", "identity", "privilege", "lifecycle", "validation", "about", "certifications", "lounge", "contact"];
let fails = 0;
for (const pass of ["initial", "after resize"]) {
  if (pass === "after resize") { await page.setViewportSize({ width: 1280, height: 760 }); await page.waitForTimeout(800); }
  for (const id of ids) {
    for (const f of [0.1, 0.6]) {
      await page.evaluate(([id, f]) => { const e = document.getElementById(id); const top = e.getBoundingClientRect().top + scrollY; scrollTo({ top: top + f * Math.max(innerHeight, e.offsetHeight - innerHeight), behavior: "instant" }); }, [id, f]);
      await page.waitForTimeout(250);
      const r = await check();
      if (!r.ok) { fails++; console.log("MISMATCH", pass, id, f, JSON.stringify(r)); }
    }
  }
  console.log(pass, "checked", ids.length * 2, "positions");
}
console.log(fails ? `${fails} mismatches` : "rail and header match live layout everywhere");
await b.close();
