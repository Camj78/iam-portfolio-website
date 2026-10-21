# Project handoff

How to resume work on Cameron Johnson's cinematic IAM portfolio. Read this file first, then
`scrollcraft/builds/cinematic-redesign/BRIEF.md`.

## Where things are

- **Repo:** `Camj78/iam-portfolio-website`. Local copy: `~/Developer/iam-portfolio-website`.
- **Branch:** `feature/cinematic-redesign`. Never merge into `main`, push to any other branch, or deploy (`vercel --prod`) without Cameron's explicit approval.
- **Dev server:** `npm run dev`, which serves http://localhost:4500. Node lives at `~/.fnm/node-versions/v20.20.0/installation/bin` (the shell may not load fnm).
- **Large pushes:** use `git -c http.postBuffer=524288000 push`.
- **Approved checkpoints:** the local tags `checkpoint/hero-approved`, `checkpoint/lifecycle-approved` and `checkpoint/validation-approved`.

## Rules that never bend

1. **CFG only.** The site shows only the Cashville Financial Group IAM lab (`Camj78/cashville-financial-group-iam`). GHOSTD must not appear anywhere on the rendered site. Its data stays unrendered in `src/content/cases.ts`.
2. **No invented claims.** Every fact comes from the résumé PDF (`public/resume`) or the CFG repository.
   - The Nissan roles were systems analysis and service planning, not IAM engineering.
   - SC-300 is **in progress, expected 2026**. Never show it as earned.
   - "Access reviews" is a GHOSTD result, so on this site it is *Learning*, not demonstrated.
3. **Phase 2 test identities:** joiner, mover and leaver were three different people (Jonathan, Sarah, David). Never show one person doing all three.
4. **Evidence images:** only the redacted copies in `public/evidence/optimized` are used. The originals in `assets-src/evidence-original` are git-ignored. The local branch `backup/pre-redaction-local` must never be pushed.
5. **Approval gates:** ask before every Kling generation (paid), every commit or push, any merge to `main`, any deploy, and before deleting files.
   - The old Desktop copy at `~/Desktop/Azure/CFG-IAM-Project/IAM Portfolio Website` stays until Cameron authorizes deleting it.
6. **Way of working:** one chapter at a time. Build it, capture screenshots, and get approval before starting the next chapter.

## Architecture

- **Stack:** Next.js 16 (App Router), React 19 and TypeScript, plus the **unmodified** Scroll Craft engine (`src/vendor/scrollcraft`, mounted by `ScrollCraftMount`). Do not edit the engine.
- **How a chapter works:** each cinematic chapter is one pinned act (`data-sc-act="pin" data-sc-span="N"`).
  - The engine pins `[data-sc-stage]`, publishes progress as `--sc-p`, fades copy (`data-sc-cue`, `data-sc-kinetic`) and drifts the dust layers (`data-sc-parallax`).
  - The chapter's component watches `--sc-p` with a MutationObserver, smooths it with a lerp, and moves the camera by setting transforms inline.
- **Reduced motion and no JS:** the component removes `data-sc-act`, and the chapter's default CSS shows a static composition.
- **Live styles** are written under `@media (prefers-reduced-motion: no-preference) { :root.js … }`.
- **Gotchas:**
  - Opacity or filter on a `preserve-3d` container flattens it, so fade the child surfaces through a CSS variable (`--o`) instead.
  - Lightning CSS drops `translate:` when the same rule also sets `transform`.
  - A CSS custom property derived with `calc()` resolves where it is declared, so set JS-driven geometry variables on the element that uses them.
- **A.R.I.A.:** three transparent poses in `public/aria/optimized` (`left`, `front` and `right`, at 760 and 480 px), blended by `src/lib/frame-player.ts`. Frame index 0 looks toward screen-left, 2 toward screen-right.
- **Navigation:** the `AccessPathRail` covers Identity through Validation and becomes a pill at the bottom of the screen at 1180px wide and below. `SiteHeader` changes its colours based on the `data-ground` of the section underneath it.

| Chapter (homepage order) | Component and styles | Status |
|---|---|---|
| Hero → Identity | `CinematicHero.tsx`, `IdentityContinuation.tsx`, `cinematic.css` | Approved |
| Privilege (CFG Phase 1) | `PrivilegeScene.tsx`, `privilege.css`, `content/privilege-scene.ts` | Approved |
| Lifecycle (CFG Phase 2) | `LifecycleScene.tsx`, `lifecycle.css`, `content/lifecycle-scene.ts` | Approved |
| Validation (evidence vault) | `VaultScene.tsx`, `vault.css`, `content/vault-scene.ts` | Approved (smoothness refactor approved 2026-10-21) |
| About | `AboutScene.tsx`, `about.css`, `content/about-scene.ts` | Approved 2026-10-21 |
| Certifications | Milestone 1 markup in `src/app/page.tsx`; SC-300 card float in `FloatCard.tsx` + `.cert__card` (globals.css) | Approved 2026-10-21 (minimal float only, no cinematic act) |
| The Access Lounge | Milestone 1 markup in `page.tsx`, `content/lounge.ts` | Storyboard awaiting approval (`scrollcraft/builds/cinematic-redesign/LOUNGE-STORYBOARD.md`, local draft) |
| Request Access | Milestone 1 markup in `page.tsx`, `RequestRecord.tsx` | To redesign |

The full case files live at `/cfg/phase-1` and `/cfg/phase-2` (`CaseStudyShell`).

## Scroll performance rules (learned on Cameron's Mac)

Cameron reviews on a 2017 MacBook Pro: Intel i5-7360U, **Intel Iris Plus 640**, Retina. Headless screenshots
at 1× cannot show GPU problems. Always measure in **headed Chrome at 2× with continuous wheel input**
(`scripts/perf-scroll.mjs`). On 2026-10-21 Validation and About went from about 14 fps to about 58 fps
in-act (p95 frame 202 ms → 17.8 ms). The root causes and their fixes, in order of impact:

1. **Large CSS-gradient surfaces in 3D get re-rasterized every frame** as the camera changes their projected
   scale. Backdrops (walls, floors, corridor, bulkhead, the exit portal) are painted once into `<canvas>`
   textures by `lib/texture.ts` / `lib/portal.ts`, and the CSS gradient stays only as a fallback (`.has-tex`).
2. **Surfaces must never reach the camera's eye plane** (their projected scale goes to infinity). Long planes
   are cut into depth segments, and segments and objects are hidden (`visibility`) before they reach the lens.
   Write `inherit`, never `visible`, so a hidden stage still hides its children. Keep focusable controls
   reachable: hidden elements cannot take focus.
3. **Lighting changes are opacity on their own layer** (`will-change: opacity`), never a `var()` inside a
   gradient or shadow, which repaints. Avoid extra full-screen translucent layers: each costs about 5 fps on this GPU.
4. **Camera paths are continuous** (`lib/camera-path.ts`, monotone cubic Hermite). Key each channel separately
   so a move is one segment between holds; per-segment easing made cameras stop mid-move. Drive objects from
   the camera's own progress.
5. **One progress source, same frame:** apply the camera inside the MutationObserver callback for the engine's
   `--sc-p` (a microtask in the engine's frame), with time-based smoothing (`follow`, τ 45 ms), never a
   per-frame lerp. Write styles through `styleWriter()` so unchanged values cause no style invalidation.
6. **No layout reads on the scroll path:** the header and rail use the cached geometry in `lib/ground.ts`.
7. **Idle loops run only in view.** An infinite CSS animation keeps the compositor producing frames even when
   it is far off screen: the SC-300 float alone took the trackpad run from 1% to 9–13% jank (about 58 → 52 fps)
   while Validation and About were on screen. Start such animations `paused` and let an IntersectionObserver
   set `data-in-view` (`FloatCard.tsx`).

**Validation → About hand-off:** About's section overlaps Validation's release (`margin-top: -var(--fh)`) and
stays hidden until its own progress is above 0. Validation's exit beat (span 7 now; it ends by backing out
through the door) and About's first frame both draw the shared portal (`lib/portal.ts`), so the two stages are
pixel-identical at the switch (checked with an image diff at 1440, 834, 390 and 360 px).

## About chapter (Stage 5) in brief

- **The act:** a pinned span of 6 through a CSS 3D studio. Every world length is a px value multiplied by `--k`, and all staging lives in the `GEO` table in `AboutScene.tsx`, with separate desktop and phone setups.
- **The beats:**
  1. The first frame is the exit portal Validation ended on; the studio lights come up inside it.
  2. **Foundation:** a slab swings up off the floor.
  3. **Transition:** the camera trucks right while A.R.I.A.'s console tracks with it, the first slab recedes, and a light path draws across the floor.
  4. **Practice:** the camera pushes into the warm end of the studio, and A.R.I.A. becomes an over-the-shoulder foreground.
  5. **Close:** the personal statement and an SC-300 glow, then the pin releases onto Certifications.
- **"Read my story":** an accessible `<dialog>` (the Vault's dialog pattern) with the verified long form.
- **Scene 2 copy:** Cameron's own approved wording.
- **Hand-off to Certifications:** for now a light seam (ground continuity plus the SC-300 plate and a "Next" link). When Certifications is redesigned, the SC-300 plate can carry straight into its card.

## Verification tools

- **Smoothness (run these, not screenshots, before claiming an animation is smooth):**
  - `node scripts/perf-scroll.mjs --label <name> [--pattern trackpad,slow,wheel,fast,reverse]` runs headed GPU continuous scroll and writes frame timing to `lab/perf/<name>/`.
  - `node scripts/perf-buckets.mjs <name> trackpad` gives fps per tenth of each act.
  - `node scripts/perf-ablate.mjs --variants base,...` disables one effect at a time to find the cost.
  - `node scripts/record-scroll.mjs` records the continuous video (CDP screencast; capture itself costs this Mac about a third of its frames).
  - `node scripts/perf-chart.mjs` draws the before/after figure.
  - `node scripts/nav-check.mjs` compares the header and rail against live layout.

- **Capture any pinned act:** `node scripts/shoot-cine.mjs --act <top|privilege|lifecycle|validation|about> [--only desktop,mobile,...]`. Output goes to `lab/redesign-<act>/`.
- **Contact sheet:** `node lab/cine-sheet.mjs redesign-<act>/<viewport> <cols> <scale> [labels…]`.
- **About checks:** `node lab/ab-check.mjs` covers reduced motion, keyboard, the dialog and a GHOSTD scan. `lab/` and `review/` are git-ignored, so they are local only.
- **Before asking for approval:** run `npm run typecheck` and `npm run build`. `next dev` writes to `.next/dev`, so a build can run while the dev server is up.

## Stage 6 (Certifications) and fixes, 2026-10-21

- **Certifications:** Cameron kept the Milestone 1 layout and approved only a minimal enhancement: the SC-300
  card floats 7px on a 7 s ease-in-out cycle with a faint static green glow (CSS keyframes on `transform`,
  `will-change: transform`), off under `prefers-reduced-motion`. Status stays "In progress · expected 2026".
- **Float cost off screen (fixed):** the first version (7aaf996) ran the animation all the time; the A/B in
  rule 7 above traced the Validation/About drop to it. Now it starts paused and runs only within 25% of the
  viewport. Trackpad run: float off 57.8–59.1 fps, gated 57.9–58.6, ungated 52.1–55.2.
- **Validation crash in a zero-size viewport (fixed):** every corridor size is viewport-derived (`--cw`, `--ch`,
  `--hole` in vault.css). In a hidden or collapsed pane, tab or frame the stage lays out at 0×0, so the bulkhead
  painter's `at(hole) = 0 / 0` gave `NaN` and `addColorStop(NaN)` threw. The throw happened inside a React
  effect, so React unmounted the whole page and it stayed blank after the viewport grew. Fix: `texture()`
  (lib/texture.ts) skips painting a 0×0 surface and keeps the CSS fallback until the next measure (resize or
  ResizeObserver) paints it. It never fires at a real size: all 55 texture hosts and their pixel hashes are
  identical with and without the guard at 1440, 800×600 and 390.
- **1px horizontal overflow on phones (fixed):** the Lounge cover's amber glow (`.lounge__cover::before`,
  `inset: 8% -6% -6% 8%`) reaches 6% past the cover, past the viewport at 390 and 414 px. `body { overflow-x:
  clip }` does not contain it: with `html` at `overflow: visible`, body's overflow is propagated to the viewport
  rather than clipping body's own descendants. On a phone the layout viewport then widened to 391 px, stretching
  the fixed header. Fix: `overflow-x: clip` on `.chapter--lounge` only (clips exactly at the viewport edge, so
  nothing visible changes). Sweep: no overflow at 320–1920 px. Any new section with bleed effects needs its own clip.
- **Checks (lab/, local):** `cert-check.mjs` (float range/period, reduced motion), `float-gate.mjs` (paused off
  screen), `flow-scroll.mjs <WxH>` (continuous Validation → Lounge: fps per chapter, CLS, errors),
  `zero-check.mjs` (0×0 viewport), `overflow-sweep.mjs`, `tex-hosts.mjs`.

## Remaining stages

1. **The Access Lounge:** podcast chapter. No episodes are published yet, so keep it honest about that.
   Storyboard drafted; build only after Cameron approves it and its open decisions.
2. **Request Access:** the contact close.
3. **Whole-site pass:** run every act in both directions, check performance, metadata, and a final audit for GHOSTD and invented claims. Then hand the merge and deploy decisions to Cameron.
