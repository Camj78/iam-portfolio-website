// Before/after figure for the smoothness fix: frame time per frame, frame rate
// per progress window, and the About truck's camera velocity (old keyframes vs
// the continuous path). Reads lab/perf/{before,after}/trackpad.json.
//   node scripts/perf-chart.mjs [--out review/smoothness/perf-before-after.png]
import { readFileSync } from "node:fs";
import sharp from "sharp";

const OUT = process.argv.includes("--out") ? process.argv[process.argv.indexOf("--out") + 1] : "review/smoothness/perf-before-after.png";
const C = { surface: "#fcfcfb", ink: "#0b0b0b", ink2: "#52514e", grid: "#e6e5e1", before: "#eb6834", after: "#2a78d6" };
const load = (l) => JSON.parse(readFileSync(`lab/perf/${l}/trackpad.json`)).frames.filter((x) => x.dt > 0);
const B = load("before"), A = load("after");

const W = 1400, PAD = 64;
let svg = "";
const text = (x, y, s, o = {}) => { svg += `<text x="${x}" y="${y}" paint-order="stroke" stroke="${C.surface}" stroke-width="4" stroke-linejoin="round" font-family="Helvetica, Arial" font-size="${o.size ?? 15}" fill="${o.fill ?? C.ink2}" font-weight="${o.weight ?? 400}" text-anchor="${o.anchor ?? "start"}">${s}</text>`; };
const line = (x1, y1, x2, y2, c, w = 1, dash = "") => { svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" ${dash ? `stroke-dasharray="${dash}"` : ""}/>`; };
const poly = (pts, c, w = 2) => { svg += `<polyline fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" points="${pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ")}"/>`; };
const legend = (x, y) => {
  svg += `<rect x="${x}" y="${y - 10}" width="12" height="12" rx="3" fill="${C.before}"/>`; text(x + 18, y, "Before");
  svg += `<rect x="${x + 90}" y="${y - 10}" width="12" height="12" rx="3" fill="${C.after}"/>`; text(x + 108, y, "After");
};

// ---- Panel 1: frame time per frame (one axis, both runs) -------------------
let y0 = 70;
text(PAD, y0 - 30, "Frame time, every frame of the same continuous trackpad-speed pass (Lifecycle end → Certifications)", { size: 19, fill: C.ink, weight: 700 });
text(PAD, y0 - 8, "Headed Chrome, Intel Iris Plus 640, 1440×790 at 2× density. Lower is smoother; 16.7 ms is 60 fps. Values above 250 ms are drawn at the top edge.");
legend(W - PAD - 160, y0 - 8);
const H1 = 260, top1 = y0 + 18, cap = 250;
const ys = (v) => top1 + H1 - (Math.min(v, cap) / cap) * H1;
[0, 50, 100, 150, 200, 250].forEach((v) => { line(PAD, ys(v), W - PAD, ys(v), C.grid); text(PAD - 8, ys(v) + 5, `${v}`, { anchor: "end", size: 13 }); });
line(PAD, ys(16.7), W - PAD, ys(16.7), C.ink2, 1, "4 4"); text(W - PAD, ys(16.7) - 6, "16.7 ms (60 fps)", { anchor: "end", size: 13 });
const series = (F, c) => { const n = F.length; poly(F.map((f, i) => [PAD + (i / (n - 1)) * (W - 2 * PAD), ys(f.dt)]), c, 1.5); };
series(B, C.before); series(A, C.after);
text(PAD, top1 + H1 + 22, "Start of pass", { size: 13 }); text(W - PAD, top1 + H1 + 22, "End of pass (each run normalized to its own length)", { size: 13, anchor: "end" });

// ---- Panel 2: fps per progress window, dumbbell --------------------------
y0 = top1 + H1 + 90;
text(PAD, y0 - 30, "Frame rate in each tenth of each chapter", { size: 19, fill: C.ink, weight: 700 });
text(PAD, y0 - 8, "Mean fps while the chapter was pinned, by progress window. Same run as above.");
legend(W - PAD - 160, y0 - 8);
const bucket = (x) => x.pv > 0 && x.pv < 1 ? `V ${Math.floor(x.pv * 10) / 10}` : x.pa > 0 && x.pa < 1 ? `A ${Math.floor(x.pa * 10) / 10}` : null;
const fps = (F) => { const g = {}; for (const f of F) { const b = bucket(f); if (b) (g[b] ||= []).push(f.dt); } return Object.fromEntries(Object.entries(g).map(([k, v]) => [k, 1000 / (v.reduce((a, c) => a + c, 0) / v.length)])); };
const fb = fps(B), fa = fps(A);
const keys = [...Array(10).keys()].map((i) => `V ${i / 10}`).concat([...Array(10).keys()].map((i) => `A ${i / 10}`));
const H2 = 240, top2 = y0 + 18;
const y2 = (v) => top2 + H2 - (v / 60) * H2;
[0, 15, 30, 45, 60].forEach((v) => { line(PAD, y2(v), W - PAD, y2(v), C.grid); text(PAD - 8, y2(v) + 5, `${v}`, { anchor: "end", size: 13 }); });
const step = (W - 2 * PAD) / keys.length;
keys.forEach((k, i) => {
  const x = PAD + step * (i + 0.5);
  const b = fb[k] ?? 0, a = fa[k] ?? 0;
  line(x, y2(b), x, y2(a), C.grid, 3);
  svg += `<circle cx="${x}" cy="${y2(b)}" r="6" fill="${C.before}" stroke="${C.surface}" stroke-width="2"/>`;
  svg += `<circle cx="${x}" cy="${y2(a)}" r="6" fill="${C.after}" stroke="${C.surface}" stroke-width="2"/>`;
  text(x, top2 + H2 + 20, k.split(" ")[1].replace("0.", "."), { anchor: "middle", size: 12 });
});
text(PAD + step * 5, top2 + H2 + 42, "Validation (evidence vault), progress", { anchor: "middle", size: 14, fill: C.ink });
text(PAD + step * 15, top2 + H2 + 42, "About, progress", { anchor: "middle", size: 14, fill: C.ink });
line(PAD + step * 10, top2, PAD + step * 10, top2 + H2, C.ink2, 1, "2 4");

// ---- Panel 3: About truck camera velocity ---------------------------------
y0 = top2 + H2 + 110;
text(PAD, y0 - 30, "Camera speed across About's sideways move (p 0.38 → 0.66)", { size: 19, fill: C.ink, weight: 700 });
text(PAD, y0 - 8, "Before: each keyframe segment eased on its own, so the camera stopped dead mid-move at p 0.48. After: one continuous path.");
legend(W - PAD - 160, y0 - 8);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v), seg = (p, a, b) => clamp01((p - a) / (b - a));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2), lerp = (a, b, t) => a + (b - a) * t;
const oldKeys = [[0.32, 60], [0.38, 60], [0.48, 600], [0.58, 1150], [0.66, 1150]];
const oldX = (p) => { for (let i = 1; i < oldKeys.length; i++) { const [p0, x0] = oldKeys[i - 1], [p1, x1] = oldKeys[i]; if (p <= p1) return lerp(x0, x1, ease(seg(p, p0, p1))); } return 1150; };
// The new path (lib/camera-path monotone Hermite), x channel of the desktop camera.
const nk = [[0.34, 60], [0.4, 60], [0.6, 1150], [0.66, 1150]];
const newX = (() => {
  const xs = nk.map((k) => k[0]), y = nk.map((k) => k[1]), h = xs.slice(1).map((x, i) => x - xs[i]);
  const d = h.map((hi, i) => (y[i + 1] - y[i]) / hi), m = new Array(nk.length).fill(0);
  for (let i = 1; i < nk.length - 1; i++) { if (d[i - 1] * d[i] <= 0) continue; const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1]; m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]); }
  return (p) => { if (p <= xs[0]) return y[0]; if (p >= xs.at(-1)) return y.at(-1); let i = 0; while (p > xs[i + 1]) i++; const t = (p - xs[i]) / h[i], t2 = t * t, t3 = t2 * t; return (2 * t3 - 3 * t2 + 1) * y[i] + (t3 - 2 * t2 + t) * h[i] * m[i] + (-2 * t3 + 3 * t2) * y[i + 1] + (t3 - t2) * h[i] * m[i + 1]; };
})();
const H3 = 200, top3 = y0 + 18, p0 = 0.36, p1 = 0.64;
const vel = (f) => { const out = []; for (let p = p0; p <= p1; p += 0.001) out.push([p, (f(p + 0.0005) - f(p - 0.0005)) / 0.001]); return out; };
const vb = vel(oldX), va = vel(newX), vmax = Math.max(...vb.map((v) => v[1]), ...va.map((v) => v[1]));
const x3 = (p) => PAD + ((p - p0) / (p1 - p0)) * (W - 2 * PAD), y3 = (v) => top3 + H3 - (v / vmax) * H3;
[0, 0.5, 1].forEach((f) => { line(PAD, y3(f * vmax), W - PAD, y3(f * vmax), C.grid); });
text(PAD - 8, y3(0) + 5, "0", { anchor: "end", size: 13 }); text(PAD - 8, y3(vmax) + 5, "max", { anchor: "end", size: 13 });
poly(vb.map(([p, v]) => [x3(p), y3(v)]), C.before, 2); poly(va.map(([p, v]) => [x3(p), y3(v)]), C.after, 2);
[0.38, 0.48, 0.58].forEach((p) => text(x3(p), top3 + H3 + 20, p.toFixed(2), { anchor: "middle", size: 12 }));
svg += `<circle cx="${x3(0.48)}" cy="${y3(0)}" r="7" fill="none" stroke="${C.ink}" stroke-width="1.5"/>`;
text(x3(0.48) + 12, y3(0) - 10, "Before: stops dead mid-move", { size: 13, fill: C.ink });
text(x3(0.5), y3(Math.max(...va.map((v) => v[1]))) - 10, "After: one continuous move", { size: 13, fill: C.ink, anchor: "middle" });
text(PAD + (W - 2 * PAD) / 2, top3 + H3 + 42, "About progress (camera keys before at 0.38 / 0.48 / 0.58; after: one move from 0.40 to 0.60)", { anchor: "middle", size: 14, fill: C.ink });

const H = top3 + H3 + 70;
const doc = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="${C.surface}"/>${svg}</svg>`;
await sharp(Buffer.from(doc)).png().toFile(OUT);
console.log(OUT);
