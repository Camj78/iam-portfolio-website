// Builds web delivery copies from the source images in assets-src/.
//
// Non-destructive by design:
//   - sources are only ever read, never written
//   - every output path is listed explicitly below (no globbing, no deletion)
//   - an output that already exists is skipped, unless --refresh is passed
//   - an output path that resolves to a source path aborts the run
import sharp from "sharp";
import { access, mkdir } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const src = (p) => path.join(root, "assets-src", p);
const out = (p) => path.join(root, "public", p);
const refresh = process.argv.includes("--refresh");

// One shared crop for all three poses so they stay registered (same scale and
// anchor). Union of the poses' alpha bounds (x 492..1195 of 1672) plus margin.
const ARIA_CROP = { left: 462, top: 0, width: 760, height: 941 };
const ariaWebp = { quality: 90, alphaQuality: 100, effort: 6 };

const EVIDENCE = [
  "CFG-Phase1-Identity-Architecture",
  "CFG-Phase1-AU-New-York-Created",
  "CFG-Phase1-Marcus-UserAdmin-AU-New-York-Least-Privilege-Final",
  "CFG-Phase1-Marcus-PIM-Eligible-UserAdmin-AU-New-York",
  "CFG-Phase1-PIM-RoleNotFound-Audit-Evidence",
  "CFG-Phase2-Finance-Dynamic-Group-Rule",
  "CFG-Phase2-Joiner-Jonathan-Inherited-App-Assignment",
  "CFG-Phase2-Sarah-Finance-Portal-Assignment-Removed",
  "CFG-Phase2-David-Leaver-Account-Disabled-Audit",
  "CFG-Phase2-David-Leaver-Sessions-Revoked-Audit",
];

/** [source, output, transform] — every file this script can create. */
const JOBS = [
  ...["left", "front", "right"].flatMap((pose) => [
    [src(`aria/aria-${pose}.png`), out(`aria/optimized/aria-${pose}-760.webp`),
      (s) => s.extract(ARIA_CROP).resize({ width: 760 }).webp(ariaWebp)],
    [src(`aria/aria-${pose}.png`), out(`aria/optimized/aria-${pose}-480.webp`),
      (s) => s.extract(ARIA_CROP).resize({ width: 480 }).webp(ariaWebp)],
  ]),
  [src("podcast/access-lounge-cover.png"), out("podcast/optimized/access-lounge-cover-1200.webp"),
    (s) => s.resize({ width: 1200 }).webp({ quality: 88, effort: 6 })],
  [src("podcast/access-lounge-cover.png"), out("podcast/optimized/access-lounge-cover-640.webp"),
    (s) => s.resize({ width: 640 }).webp({ quality: 88, effort: 6 })],
  [src("podcast/access-lounge-cover.png"), out("podcast/optimized/access-lounge-cover-1200.jpg"),
    (s) => s.resize({ width: 1200 }).jpeg({ quality: 86, mozjpeg: true })],
  ...EVIDENCE.map((name) => [src(`evidence/${name}.png`), out(`evidence/optimized/${name}.webp`),
    (s) => s.resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 84, effort: 5 })]),
];

const exists = (p) => access(p).then(() => true, () => false);
const sources = new Set(JOBS.map(([s]) => path.resolve(s)));

let made = 0, skipped = 0;
for (const [from, to, transform] of JOBS) {
  if (sources.has(path.resolve(to))) throw new Error(`Refusing to write over a source: ${to}`);
  if (!refresh && (await exists(to))) { skipped++; continue; }
  await mkdir(path.dirname(to), { recursive: true });
  const info = await transform(sharp(from)).toFile(to);
  console.log(`created ${path.relative(root, to)}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
  made++;
}
console.log(`${made} created, ${skipped} already present (skipped)`);
