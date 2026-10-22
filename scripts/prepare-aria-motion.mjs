// Builds the hero's A.R.I.A. head-turn frame sets from the archived Kling composite.
//
//   node scripts/prepare-aria-motion.mjs [--counts 36] [--src <composite/master dir>] [--refresh]
//
// Source: ~/Developer/iam-portfolio-assets/aria-motion/composite/master/ (121 RGBA PNGs,
// 760x941, already in ARIA_CROP; see that archive's README). It is never written.
// Frames 0, 74 and 120 are the approved left, front and right stills, so a set uses
// the existing /aria/optimized/ files for them byte for byte and only the in-between
// frames are encoded here.
//
// Frame choice: equal steps of head motion (not of time), so every sampled step looks
// the same size. The blink frames are never chosen, so nobody can stop scrolling on a
// half-closed eye. Kling hid each gaze shift behind its blink, so blending across a
// skipped blink would cross-fade two gazes (doubled pupils). Instead every set keeps
// the last open frame before and the first open frame after each blink, and the hero
// cuts between them (a saccade) instead of dissolving: listed as `cuts`.
//
// Non-destructive like prepare-assets.mjs: existing outputs are skipped unless
// --refresh, and nothing is deleted. Writes public/aria/motion/*.webp and
// src/content/aria-motion.json.
import sharp from "sharp";
import { access, mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const SRC = arg("--src", path.join(homedir(), "Developer/iam-portfolio-assets/aria-motion/composite/master"));
const COUNTS = arg("--counts", "36").split(",").map(Number);
const refresh = process.argv.includes("--refresh");

const TOTAL = 121;
const ANCHORS = { 0: "left", 74: "front", 120: "right" };
const BLINKS = [[20, 25], [78, 83]];                 // eyes closing → open again (inclusive)
const WEBP = { quality: 82, alphaQuality: 90, effort: 6 };
const WIDTHS = [760, 480];

const file = (i) => path.join(SRC, `${String(i).padStart(4, "0")}.png`);
const blink = (i) => BLINKS.some(([a, b]) => i >= a && i <= b);
const allowed = Array.from({ length: TOTAL }, (_, i) => i).filter((i) => !blink(i));

// Head motion between consecutive allowed frames: mean absolute difference over the
// head at 380 px wide, composited on the stage colour, with the eye band masked so
// eyelids do not count as movement.
const W = 380, H = 470, BG = [22, 30, 24];
const HEAD = { x0: 75, x1: 305, y0: 0, y1: 250 }, EYES = { x0: 80, x1: 300, y0: 70, y1: 115 };
async function headPixels(i) {
  const { data } = await sharp(file(i)).resize(W, H).raw().toBuffer({ resolveWithObject: true });
  const out = [];
  for (let y = HEAD.y0; y < HEAD.y1; y++) for (let x = HEAD.x0; x < HEAD.x1; x++) {
    if (y >= EYES.y0 && y < EYES.y1 && x >= EYES.x0 && x < EYES.x1) continue;
    const o = (y * W + x) * 4, a = data[o + 3] / 255;
    for (let c = 0; c < 3; c++) out.push(data[o + c] * a + BG[c] * (1 - a));
  }
  return out;
}
const px = new Map();
for (const i of allowed) px.set(i, await headPixels(i));
const cum = new Map([[allowed[0], 0]]);
for (let k = 1; k < allowed.length; k++) {
  const a = px.get(allowed[k - 1]), b = px.get(allowed[k]);
  let s = 0; for (let j = 0; j < a.length; j++) s += Math.abs(a[j] - b[j]);
  cum.set(allowed[k], cum.get(allowed[k - 1]) + s / a.length);
}

// The open frames either side of each blink: the hero cuts between them.
const CUTS = BLINKS.map(([a, b]) => [a - 1, b + 1]);

/** `count` source frames: the anchors and blink edges, plus equal motion steps between them. */
function pick(count) {
  const fixed = [...new Set([...Object.keys(ANCHORS).map(Number), ...CUTS.flat()])].sort((x, y) => x - y);
  const isCut = (a, b) => CUTS.some(([x, y]) => x === a && y === b);
  const segs = fixed.slice(1).map((b, k) => [fixed[k], b]).filter(([a, b]) => !isCut(a, b));
  const motion = segs.map(([a, b]) => cum.get(b) - cum.get(a));
  const total = motion.reduce((s, m) => s + m, 0);
  // Steps per segment: proportional to its motion (largest remainder), at least one.
  const budget = count - 1 - CUTS.length;
  const exact = motion.map((m) => (m / total) * budget);
  const steps = exact.map((x) => Math.max(1, Math.floor(x)));
  while (steps.reduce((s, x) => s + x, 0) < budget) {
    const k = exact.map((x, i) => x - steps[i]).reduce((m, r, i, a) => (r > a[m] ? i : m), 0);
    steps[k]++; exact[k] = steps[k];
  }
  const chosen = new Set(fixed);
  segs.forEach(([a, b], s) => {
    const pool = allowed.filter((i) => i > a && i < b);
    for (let k = 1; k < steps[s]; k++) {
      const target = cum.get(a) + (k / steps[s]) * motion[s];
      const free = pool.filter((i) => !chosen.has(i));
      if (!free.length) break;
      chosen.add(free.reduce((m, i) => (Math.abs(cum.get(i) - target) < Math.abs(cum.get(m) - target) ? i : m)));
    }
  });
  const list = [...chosen].sort((x, y) => x - y);
  if (list.length !== count) throw new Error(`picked ${list.length} frames for ${count}`);
  return list;
}

const exists = (p) => access(p).then(() => true, () => false);
const sets = {};
let made = 0, skipped = 0;
await mkdir(path.join(root, "public/aria/motion"), { recursive: true });
for (const count of COUNTS) {
  sets[count] = pick(count);
  for (const i of sets[count]) {
    if (ANCHORS[i]) continue;
    for (const w of WIDTHS) {
      const to = path.join(root, `public/aria/motion/aria-${String(i).padStart(3, "0")}-${w}.webp`);
      if (!refresh && (await exists(to))) { skipped++; continue; }
      await sharp(file(i)).resize({ width: w }).webp(WEBP).toFile(to);
      made++;
    }
  }
}

const manifest = {
  source: "Kling 4.0 image_to_video, 2026-10-22; composite archived in ~/Developer/iam-portfolio-assets/aria-motion",
  sourceFrames: TOTAL,
  anchors: ANCHORS,
  blinksSkipped: BLINKS,
  cuts: CUTS,
  sets,
};
await writeFile(path.join(root, "src/content/aria-motion.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`made ${made}, skipped ${skipped}`);
for (const [n, l] of Object.entries(sets)) console.log(n, l.join(" "));
