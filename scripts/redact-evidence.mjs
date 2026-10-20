// Creates public-safe copies of the CFG evidence screenshots.
//
// Non-destructive: reads unredacted copies from assets-src/evidence-original/
// (local only, git-ignored) and writes NEW files to an output folder. Nothing
// is deleted and no input is ever written. Every output path is explicit.
//
// What is hidden, as labelled blocks so a reviewer can see an edit was made:
//   - the signed-in admin account chip (email, tenant, avatar) in the Entra header
//   - the tenant domain of admin UPNs (adm-marcus.reed@...)
//   - the personal browser toolbar and bookmarks bar (cropped off)
//
//   node scripts/redact-evidence.mjs --out <dir> [--refresh]
import sharp from "sharp";
import { access, mkdir } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const outDir = path.resolve(root, arg("--out") ?? "lab/redacted");
const refresh = process.argv.includes("--refresh");
const inDir = path.join(root, "assets-src/evidence-original");

const CHIP_2X = { x: 2440, y: 0, w: 412, h: 80 };   // 2880 / 3410 / 3526-wide captures
const CHIP_1X = { x: 1735, y: 0, w: 296, h: 57 };   // 2048-wide captures

/** name → { crop?, boxes: [{x,y,w,h,label,fill?,ink?,size}] } */
const PLAN = {
  "CFG-Phase1-Identity-Architecture": { boxes: [] },
  "CFG-Phase1-AU-New-York-Created": { boxes: [{ ...CHIP_2X, label: "account redacted" }] },
  "CFG-Phase1-Marcus-UserAdmin-AU-New-York-Least-Privilege-Final": {
    boxes: [{ ...CHIP_2X, label: "account redacted" },
            { x: 1604, y: 584, w: 116, h: 42, label: "@redacted", fill: "#ffffff", ink: "#8a8886", size: 21 }],
  },
  "CFG-Phase1-Marcus-PIM-Eligible-UserAdmin-AU-New-York": {
    boxes: [{ ...CHIP_2X, label: "account redacted" },
            { x: 1641, y: 652, w: 96, h: 42, label: "@redacted", fill: "#ffffff", ink: "#8a8886", size: 18 }],
  },
  "CFG-Phase1-PIM-RoleNotFound-Audit-Evidence": {
    crop: { top: 111 },                       // browser tabs, URL bar and bookmarks
    boxes: [{ x: 1738, y: 0, w: 292, h: 57, label: "account redacted" }],
  },
  "CFG-Phase2-Finance-Dynamic-Group-Rule": { boxes: [{ ...CHIP_1X, label: "account redacted" }] },
  "CFG-Phase2-Joiner-Jonathan-Inherited-App-Assignment": { boxes: [{ ...CHIP_1X, label: "account redacted" }] },
  "CFG-Phase2-Sarah-Finance-Portal-Assignment-Removed": { boxes: [{ ...CHIP_2X, label: "account redacted" }] },
  "CFG-Phase2-David-Leaver-Account-Disabled-Audit": { boxes: [{ ...CHIP_2X, label: "account redacted" }] },
  "CFG-Phase2-David-Leaver-Sessions-Revoked-Audit": { boxes: [{ ...CHIP_2X, label: "account redacted" }] },
};

const exists = (p) => access(p).then(() => true, () => false);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

await mkdir(path.join(outDir, "png"), { recursive: true });
await mkdir(path.join(outDir, "webp"), { recursive: true });

for (const [name, plan] of Object.entries(PLAN)) {
  const src = path.join(inDir, `${name}.png`);
  const png = path.join(outDir, "png", `${name}.png`);
  const webp = path.join(outDir, "webp", `${name}.webp`);
  if (path.resolve(png).startsWith(inDir)) throw new Error("Refusing to write into the originals folder");
  if (!refresh && (await exists(png)) && (await exists(webp))) { console.log(`skip ${name}`); continue; }

  let img = sharp(src);
  const meta = await img.metadata();
  let W = meta.width, H = meta.height;
  if (plan.crop) {
    img = sharp(await img.extract({ left: 0, top: plan.crop.top, width: W, height: H - plan.crop.top }).toBuffer());
    H -= plan.crop.top;
  }
  const base = await img.removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const sample = (x, y) => { const i = (y * W + x) * 3; return `rgb(${base.data[i]},${base.data[i + 1]},${base.data[i + 2]})`; };

  const overlays = plan.boxes.map((b) => {
    const fill = b.fill ?? sample(Math.max(0, b.x - 12), Math.min(H - 1, b.y + 8));
    const ink = b.ink ?? "#b9b6b2";
    const size = b.size ?? Math.round(b.h * 0.3);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${b.w}" height="${b.h}">
      <rect width="${b.w}" height="${b.h}" fill="${fill}"/>
      <text x="${b.w / 2}" y="${b.h / 2 + size * 0.36}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="${size}" font-style="italic" fill="${ink}">${esc(b.label)}</text></svg>`;
    return { input: Buffer.from(svg), left: b.x, top: b.y };
  });

  const out = sharp(base.data, { raw: { width: W, height: H, channels: 3 } }).composite(overlays);
  const buf = await out.png({ compressionLevel: 9 }).toBuffer();
  await sharp(buf).toFile(png);
  await sharp(buf).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 84, effort: 5 }).toFile(webp);
  console.log(`redacted ${name}  ${W}x${H}  boxes=${plan.boxes.length}${plan.crop ? "  cropped top " + plan.crop.top + "px" : ""}`);
}
