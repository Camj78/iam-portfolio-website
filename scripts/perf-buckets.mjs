// Frame time by chapter and progress bucket for a perf-scroll run.
//   node scripts/perf-buckets.mjs <label> [pattern]
import { readFileSync } from "node:fs";
const [label, pattern = "trackpad"] = process.argv.slice(2);
const d = JSON.parse(readFileSync(`lab/perf/${label}/${pattern}.json`));
const f = d.frames.filter((x) => x.dt > 0);
const b = (x) => x.pv > 0 && x.pv < 1 ? `vault ${(Math.floor(x.pv * 10) / 10).toFixed(1)}` : x.pa > 0 && x.pa < 1 ? `about ${(Math.floor(x.pa * 10) / 10).toFixed(1)}` : x.pv >= 1 && x.pa <= 0 ? "handoff" : x.pv <= 0 ? "before vault" : "after about";
const g = {};
for (const x of f) (g[b(x)] ||= []).push(x.dt);
for (const [k, v] of Object.entries(g)) {
  const s = [...v].sort((a, c) => a - c);
  console.log(k.padEnd(13), "frames", String(v.length).padStart(4), " fps", (1000 / (v.reduce((a, c) => a + c, 0) / v.length)).toFixed(1).padStart(5), " p50", s[Math.floor(s.length / 2)].toFixed(1).padStart(6), " p95", s[Math.floor(s.length * 0.95)].toFixed(0).padStart(4));
}
